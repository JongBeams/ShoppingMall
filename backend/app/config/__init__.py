from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Backend
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BACKEND_PORT: int = 8000

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str

    # CORS
    NEXT_PUBLIC_URL: str = "http://localhost:3000"

    # AI Models
    OLLAMA_HOST: str = "http://localhost:11435"
    OLLAMA_MODEL: str = "qwen2.5:14b"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    OLLAMA_TIMEOUT: int = 120

    # Recommendation Settings
    RECOMMENDATION_ANALYSIS_MONTHS: int = 6
    RECOMMENDATION_MIN_REVIEWS: int = 3
    RECOMMENDATION_PRICE_TOLERANCE: float = 0.3  # ±30%
    RECOMMENDATION_DEFAULT_LIMIT: int = 50
    RECOMMENDATION_EXCLUDE_PURCHASED: bool = True

    # Search Settings
    SEARCH_DOCUMENT_LIMIT: int = 3
    SEARCH_PRODUCT_LIMIT: int = 50
    SEARCH_MIN_KEYWORD_LENGTH: int = 2

    # Validation
    @field_validator('RECOMMENDATION_PRICE_TOLERANCE')
    @classmethod
    def validate_price_tolerance(cls, v):
        """가격 허용 범위는 0~1 사이여야 함"""
        if not 0 <= v <= 1:
            raise ValueError('RECOMMENDATION_PRICE_TOLERANCE must be between 0 and 1')
        return v

    @field_validator('OLLAMA_TIMEOUT')
    @classmethod
    def validate_timeout(cls, v):
        """타임아웃은 최소 10초 이상"""
        if v < 10:
            raise ValueError('OLLAMA_TIMEOUT must be at least 10 seconds')
        return v

    @field_validator('RECOMMENDATION_ANALYSIS_MONTHS')
    @classmethod
    def validate_analysis_months(cls, v):
        """분석 기간은 1~24개월 사이"""
        if not 1 <= v <= 24:
            raise ValueError('RECOMMENDATION_ANALYSIS_MONTHS must be between 1 and 24')
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()
