"""
Face Verification Service - Database Models
SQLAlchemy models for storing user face embeddings securely
"""

from sqlalchemy import Column, String, DateTime, LargeBinary, Float, Boolean, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import json

Base = declarative_base()


class User(Base):
    """User model with face embeddings"""
    __tablename__ = "users"
    
    id = Column(String(255), primary_key=True, index=True)  # Wallet address or unique ID
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    enrollment_count = Column(Integer, default=0)
    
    # Store embedding as encrypted binary (in production, use proper encryption)
    # Embedding is a 128-dimensional vector from OpenFace model
    embedding = Column(LargeBinary, nullable=True)
    
    # Metadata
    metadata_json = Column(Text, default="{}")
    
    def set_embedding(self, embedding_array):
        """Convert numpy array to bytes for storage"""
        import numpy as np
        self.embedding = embedding_array.astype(np.float32).tobytes()
    
    def get_embedding(self):
        """Convert stored bytes back to numpy array"""
        import numpy as np
        if self.embedding is None:
            return None
        return np.frombuffer(self.embedding, dtype=np.float32)
    
    def set_metadata(self, data: dict):
        """Store metadata as JSON"""
        self.metadata_json = json.dumps(data)
    
    def get_metadata(self) -> dict:
        """Retrieve metadata from JSON"""
        return json.loads(self.metadata_json) if self.metadata_json else {}


class VerificationLog(Base):
    """Audit log for verification attempts"""
    __tablename__ = "verification_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), index=True)
    timestamp = Column(DateTime, default=func.now())
    success = Column(Boolean)
    similarity_score = Column(Float, nullable=True)
    liveness_passed = Column(Boolean, nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(500), nullable=True)
    failure_reason = Column(String(255), nullable=True)


class RateLimitEntry(Base):
    """Track rate limiting per IP/user"""
    __tablename__ = "rate_limits"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(255), index=True)  # IP or user_id
    window_start = Column(DateTime, default=func.now())
    request_count = Column(Integer, default=1)
