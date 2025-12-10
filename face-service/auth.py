"""
Face Verification Service - JWT Authentication
Handles token creation and validation for verified users
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import jwt, JWTError
from config import settings
import logging

logger = logging.getLogger(__name__)


def create_verification_token(
    user_id: str,
    similarity_score: float,
    additional_claims: Optional[Dict] = None
) -> str:
    """
    Create a short-lived JWT token after successful face verification
    
    Token contains:
    - sub: user_id (wallet address)
    - verified: True
    - score: similarity score
    - exp: expiration time
    - iat: issued at
    """
    now = datetime.utcnow()
    expire = now + timedelta(minutes=settings.jwt_expiry_minutes)
    
    payload = {
        "sub": user_id,
        "verified": True,
        "score": round(similarity_score, 4),
        "iat": now,
        "exp": expire,
        "type": "face_verification"
    }
    
    # Add any additional claims
    if additional_claims:
        payload.update(additional_claims)
    
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    logger.info(f"✅ Created verification token for user {user_id[:10]}... expires in {settings.jwt_expiry_minutes} min")
    
    return token


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify a JWT token and return its payload
    
    Returns None if token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        
        # Check if it's a face verification token
        if payload.get("type") != "face_verification":
            logger.warning("Invalid token type")
            return None
        
        # Check if verified flag is True
        if not payload.get("verified"):
            logger.warning("Token not marked as verified")
            return None
        
        return payload
        
    except JWTError as e:
        logger.warning(f"Token verification failed: {e}")
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get expiration time of a token without full validation
    Useful for UI countdown
    """
    try:
        # Decode without verification to get expiry
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": False}
        )
        
        exp = payload.get("exp")
        if exp:
            return datetime.utcfromtimestamp(exp)
        return None
        
    except JWTError:
        return None


def is_token_valid(token: str) -> bool:
    """Quick check if token is valid"""
    return verify_token(token) is not None
