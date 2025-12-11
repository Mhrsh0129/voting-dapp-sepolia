"""
VotEth Face Verification Service
================================
FastAPI-based face verification for secure voting

Endpoints:
- POST /enroll      - Register a user's face
- POST /verify      - Verify a user's face and get JWT
- GET  /health      - Health check
- GET  /status/{id} - Check if user is enrolled

Author: VotEth Team
"""

from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import re

# Local imports
from config import settings
from database import init_db, get_db
from models import User, VerificationLog
from face_processor import decode_image, extract_embedding, compare_embeddings, get_face_quality
from liveness import detect_liveness
from auth import create_verification_token, verify_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Signer
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import to_bytes, keccak
import secrets

# Try to get key from env, otherwise generate ephemeral one
SIGNER_PRIVATE_KEY = os.getenv("SIGNER_PRIVATE_KEY")
if not SIGNER_PRIVATE_KEY:
    # Generate random key for demo/security
    # Note: In production, this must be persistent in .env
    priv = secrets.token_hex(32)
    SIGNER_PRIVATE_KEY = "0x" + priv
    logger.warning(f"⚠️  Using EPHEMERAL signer key: {SIGNER_PRIVATE_KEY}")
    logger.warning("    (Refer to README to set this permanently in .env)")

try:
    signer_account = Account.from_key(SIGNER_PRIVATE_KEY)
    SIGNER_ADDRESS = signer_account.address
    logger.info(f"🔐 Verification Signer Active: {SIGNER_ADDRESS}")
except Exception as e:
    logger.error(f"❌ Failed to load signer key: {e}")
    signer_account = None
    SIGNER_ADDRESS = None

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="VotEth Face Verification Service",
    description="Secure face verification for blockchain voting",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# CORS configuration - MUST be added FIRST before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Serve static files (enroll.html)
# This assumes enroll.html is in the same directory as main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

@app.get("/enroll.html")
async def get_enroll_page():
    return FileResponse(os.path.join(BASE_DIR, "enroll.html"))

# Add rate limiter AFTER CORS
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ============== Request/Response Models ==============

class EnrollRequest(BaseModel):
    """Request to enroll a user's face"""
    user_id: str = Field(..., description="Unique user ID (wallet address)")
    image: str = Field(..., description="Base64 encoded face image")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        # Allow wallet addresses (0x...) or other IDs
        if not v or len(v) < 3:
            raise ValueError("User ID must be at least 3 characters")
        return v.strip().lower()
    
    @validator('image')
    def validate_image(cls, v):
        if not v or len(v) < 100:
            raise ValueError("Invalid image data")
        return v


class VerifyRequest(BaseModel):
    """Request to verify a user's face"""
    user_id: str = Field(..., description="User ID to verify against")
    image: str = Field(..., description="Base64 encoded face image")
    skip_liveness: bool = Field(False, description="Skip liveness check (for testing only)")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        if not v or len(v) < 3:
            raise ValueError("User ID must be at least 3 characters")
        return v.strip().lower()


class EnrollResponse(BaseModel):
    """Response after successful enrollment"""
    success: bool
    message: str
    user_id: str
    quality_score: Optional[float] = None


class VerifyResponse(BaseModel):
    """Response after verification attempt"""
    success: bool
    verified: bool
    similarity_score: float
    liveness_passed: bool
    token: Optional[str] = None
    signature: Optional[str] = None
    expires_in_seconds: Optional[int] = None
    message: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    status: str
    timestamp: str
    version: str
    signer_address: Optional[str] = None


class UserStatusResponse(BaseModel):
    """User enrollment status"""
    enrolled: bool
    user_id: str
    enrollment_date: Optional[str] = None


# ============== Startup/Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Initialize database and models on startup"""
    logger.info("🚀 Starting Face Verification Service...")
    await init_db()
    
    # Pre-load face models (warmup)
    try:
        from face_processor import get_face_analyzer
        get_face_analyzer()
        logger.info("✅ Face models loaded")
    except Exception as e:
        logger.warning(f"⚠️ Face model preload failed (will load on first request): {e}")
    
    logger.info("✅ Face Verification Service ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down Face Verification Service...")


# ============== Endpoints ==============

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - returns service info"""
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0", 
        "signer_address": SIGNER_ADDRESS
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0", 
        "signer_address": SIGNER_ADDRESS
    }


@app.options("/health")
async def health_options():
    """Handle CORS preflight for health endpoint"""
    return {}


@app.post("/enroll", response_model=EnrollResponse)
@limiter.limit(f"{settings.rate_limit_requests}/minute")
async def enroll_user(
    request: Request,
    data: EnrollRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Enroll a new user with their face
    
    - Validates image quality
    - Extracts face embedding
    - Stores embedding in database
    """
    logger.info(f"📝 Enrollment request for user: {data.user_id[:10]}...")
    
    try:
        # Decode image
        image = decode_image(data.image)
        
        # Check image quality
        quality = get_face_quality(image)
        if not quality.get("valid"):
            raise HTTPException(
                status_code=400,
                detail=f"Image quality check failed: {quality.get('reason', 'Unknown')}"
            )
        
        # Extract embedding
        embedding, status = extract_embedding(image)
        
        if embedding is None:
            raise HTTPException(
                status_code=400,
                detail=f"Face extraction failed: {status}"
            )
        
        # Check if user already exists
        result = await db.execute(select(User).where(User.id == data.user_id))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Update existing enrollment
            existing_user.set_embedding(embedding)
            existing_user.enrollment_count += 1
            existing_user.updated_at = datetime.utcnow()
            logger.info(f"🔄 Updated enrollment for {data.user_id[:10]}...")
        else:
            # Create new user
            new_user = User(
                id=data.user_id,
                enrollment_count=1
            )
            new_user.set_embedding(embedding)
            db.add(new_user)
            logger.info(f"✅ New enrollment for {data.user_id[:10]}...")
        
        await db.commit()
        
        return EnrollResponse(
            success=True,
            message="Face enrolled successfully",
            user_id=data.user_id,
            quality_score=quality.get("face_size_ratio", 0) * 100
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Enrollment error: {e}")
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


@app.options("/enroll")
async def enroll_options():
    """Handle CORS preflight for enroll endpoint"""
    return {}


@app.post("/verify", response_model=VerifyResponse)
@limiter.limit(f"{settings.rate_limit_requests}/minute")
async def verify_user(
    request: Request,
    data: VerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a user's face against their enrolled face
    
    - Checks liveness (anti-spoofing)
    - Compares face embeddings
    - Returns JWT token if verified (>=70% match)
    """
    logger.info(f"🔍 Verification request for user: {data.user_id[:10]}...")
    
    # Get client info for logging
    client_ip = get_remote_address(request)
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Check if user is enrolled
        result = await db.execute(select(User).where(User.id == data.user_id))
        user = result.scalar_one_or_none()
        
        if not user or user.embedding is None:
            # Log failed attempt
            log_entry = VerificationLog(
                user_id=data.user_id,
                success=False,
                ip_address=client_ip,
                user_agent=user_agent[:500] if user_agent else None,
                failure_reason="User not enrolled"
            )
            db.add(log_entry)
            await db.commit()
            
            raise HTTPException(
                status_code=404,
                detail="User not enrolled. Please enroll first."
            )
        
        # Decode image
        image = decode_image(data.image)
        
        # Liveness check (unless skipped for testing)
        liveness_passed = True
        if settings.enable_liveness and not data.skip_liveness:
            liveness_result = detect_liveness(image)
            liveness_passed = liveness_result.get("is_live", False)
            
            if not liveness_passed:
                # Log failed liveness
                log_entry = VerificationLog(
                    user_id=data.user_id,
                    success=False,
                    liveness_passed=False,
                    ip_address=client_ip,
                    user_agent=user_agent[:500] if user_agent else None,
                    failure_reason=f"Liveness failed: {liveness_result.get('reason', 'Unknown')}"
                )
                db.add(log_entry)
                await db.commit()
                
                return VerifyResponse(
                    success=True,
                    verified=False,
                    similarity_score=0.0,
                    liveness_passed=False,
                    message=f"Liveness check failed: {liveness_result.get('reason', 'Please use a real camera')}"
                )
        
        # Extract embedding from verification image
        embedding, status = extract_embedding(image)
        
        if embedding is None:
            log_entry = VerificationLog(
                user_id=data.user_id,
                success=False,
                liveness_passed=liveness_passed,
                ip_address=client_ip,
                user_agent=user_agent[:500] if user_agent else None,
                failure_reason=f"Face extraction failed: {status}"
            )
            db.add(log_entry)
            await db.commit()
            
            return VerifyResponse(
                success=True,
                verified=False,
                similarity_score=0.0,
                liveness_passed=liveness_passed,
                message=f"Face detection failed: {status}"
            )
        
        # Compare embeddings
        stored_embedding = user.get_embedding()
        similarity = compare_embeddings(embedding, stored_embedding)
        
        # Check threshold
        verified = similarity >= settings.similarity_threshold
        
        # Create token if verified
        token = None
        expires_in = None
        if verified:
            token = create_verification_token(data.user_id, similarity)
            expires_in = settings.jwt_expiry_minutes * 60
        
        # Log verification attempt
        log_entry = VerificationLog(
            user_id=data.user_id,
            success=verified,
            similarity_score=similarity,
            liveness_passed=liveness_passed,
            ip_address=client_ip,
            user_agent=user_agent[:500] if user_agent else None,
            failure_reason=None if verified else f"Similarity {similarity:.2%} below threshold"
        )
        db.add(log_entry)
        await db.commit()
        
        message = "Verification successful" if verified else f"Face match failed ({similarity:.1%} < {settings.similarity_threshold:.0%} required)"
        
        logger.info(f"{'✅' if verified else '❌'} Verification for {data.user_id[:10]}...: {similarity:.2%}")

        # Generage on-chain signature if verified
        signature = None
        if verified and signer_account:
            try:
                # Create hash of the address (exactly as Solidity will do)
                # Solidity: keccak256(abi.encodePacked(msg.sender))
                if data.user_id.startswith("0x") and len(data.user_id) == 42:
                    addr_bytes = to_bytes(hexstr=data.user_id)
                    msg_hash = keccak(addr_bytes)
                    
                    # Sign the hash (EIP-191)
                    # This corresponds to .toEthSignedMessageHash() in Solidity
                    signable_message = encode_defunct(digest=msg_hash)
                    signed_message = signer_account.sign_message(signable_message)
                    signature = signed_message.signature.hex()
                    logger.info(f"✍️  Signed voting permit for {data.user_id[:10]}...")
            except Exception as e:
                logger.error(f"Signing failed: {e}")
        
        return VerifyResponse(
            success=True,
            verified=verified,
            similarity_score=round(similarity * 100, 2),
            liveness_passed=liveness_passed,
            token=token,
            signature=signature,
            expires_in_seconds=expires_in,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@app.options("/verify")
async def verify_options():
    """Handle CORS preflight for verify endpoint"""
    return {}


@app.get("/status/{user_id}", response_model=UserStatusResponse)
async def get_user_status(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Check if a user is enrolled"""
    user_id = user_id.strip().lower()
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user and user.embedding is not None:
        return UserStatusResponse(
            enrolled=True,
            user_id=user_id,
            enrollment_date=user.created_at.isoformat() if user.created_at else None
        )
    
    return UserStatusResponse(
        enrolled=False,
        user_id=user_id
    )


@app.post("/validate-token")
async def validate_token(
    authorization: str = Header(None)
):
    """Validate a face verification JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format. Use: Bearer <token>")
    
    token = parts[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "valid": True,
        "user_id": payload.get("sub"),
        "verified": payload.get("verified"),
        "score": payload.get("score"),
        "expires": payload.get("exp")
    }


@app.delete("/user/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a user's enrollment (for GDPR compliance)"""
    user_id = user_id.strip().lower()
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    
    logger.info(f"🗑️ Deleted user: {user_id[:10]}...")
    
    return {"success": True, "message": "User data deleted"}


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,  # Disabled reload for stability
        log_level="info"
    )
