"""
Face Verification Service - Configuration
Loads settings from environment variables with sensible defaults
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

# Get the directory of this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Settings(BaseSettings):
    """Application settings loaded from environment"""
    
    # JWT Configuration
    jwt_secret_key: str = "change-this-secret-key-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 10
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./face_data.db"
    
    # Face Verification
    similarity_threshold: float = 0.70  # 70% match required
    max_enrollment_images: int = 3
    
    # Rate Limiting
    rate_limit_requests: int = 10
    rate_limit_period: int = 60  # seconds
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080"
    
    # Liveness
    enable_liveness: bool = True
    blink_threshold: float = 0.25
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins into list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'  # Ignore extra env vars from parent .env
    )


# Global settings instance
settings = Settings()
