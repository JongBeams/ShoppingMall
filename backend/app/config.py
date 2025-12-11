from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

# backend 디렉토리의 .env 파일 경로
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# .env 파일 명시적 로드
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
else:
    print(f"WARNING: .env file not found at {ENV_FILE}")


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Backend Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # SMTP Configuration
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str

    # Payment Configuration
    TOSS_SECRET_KEY: str

    # CORS Configuration
    NEXT_PUBLIC_URL: str = "http://localhost:3000"

    # API Server Configuration
    BACKEND_PORT: int = 8000

    # AI Models Configuration
    OLLAMA_HOST: str = "http://localhost:11435"
    OLLAMA_MODEL: str = "qwen2.5:14b"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    OLLAMA_TIMEOUT: int = 120

    # Recommendation System Settings
    RECOMMENDATION_ANALYSIS_MONTHS: int = 6
    RECOMMENDATION_MIN_REVIEWS: int = 3
    RECOMMENDATION_PRICE_TOLERANCE: float = 0.3
    RECOMMENDATION_DEFAULT_LIMIT: int = 50
    RECOMMENDATION_EXCLUDE_PURCHASED: bool = True

    # Search Settings
    SEARCH_DOCUMENT_LIMIT: int = 3
    SEARCH_PRODUCT_LIMIT: int = 50
    SEARCH_MIN_KEYWORD_LENGTH: int = 2

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """설정 인스턴스 반환 (캐싱)"""
    return Settings()
