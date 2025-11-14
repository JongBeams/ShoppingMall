from datetime import datetime, timedelta
from typing import Optional
import jwt
from app.config import get_settings

settings = get_settings()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT Access Token 생성

    Args:
        data: 토큰에 포함할 데이터 (user_id, email, role 등)
        expires_delta: 토큰 만료 시간 (기본값: 30분)

    Returns:
        JWT 토큰 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    JWT 토큰 검증 및 디코딩

    Args:
        token: JWT 토큰 문자열

    Returns:
        디코딩된 페이로드 또는 None (검증 실패 시)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("[JWT] 토큰이 만료되었습니다.")
        return None
    except jwt.InvalidTokenError as e:
        print(f"[JWT] 유효하지 않은 토큰: {str(e)}")
        return None


def decode_token(token: str) -> dict:
    """
    JWT 토큰 디코딩 (검증 포함)

    Args:
        token: JWT 토큰 문자열

    Returns:
        디코딩된 페이로드

    Raises:
        jwt.ExpiredSignatureError: 토큰이 만료된 경우
        jwt.InvalidTokenError: 토큰이 유효하지 않은 경우
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return payload
