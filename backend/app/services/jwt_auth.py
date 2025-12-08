from datetime import datetime, timedelta
from typing import Optional
import jwt
import redis
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings

settings = get_settings()

# Redis 연결 (Refresh Token 저장용)
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(redis_url, decode_responses=True)

# HTTP Bearer 스키마
security = HTTPBearer()


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


def create_refresh_token(user_id: str, user_type: str = "user") -> str:
    """
    JWT Refresh Token 생성 및 Redis 저장

    Args:
        user_id: 사용자 ID
        user_type: 사용자 타입 ("user" 또는 "admin")

    Returns:
        JWT Refresh Token 문자열
    """
    # Refresh Token 만료 시간: 7일
    expire = datetime.utcnow() + timedelta(days=7)

    to_encode = {
        "sub": user_id,
        "type": user_type,
        "exp": expire,
        "iat": datetime.utcnow(),
        "token_type": "refresh"
    }

    refresh_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # Redis에 Refresh Token 저장 (7일 TTL)
    redis_key = f"refresh_token:{user_type}:{user_id}"
    redis_client.setex(redis_key, timedelta(days=7), refresh_token)

    print(f"[JWT] Refresh Token 생성: {user_id} ({user_type})")
    return refresh_token


def verify_refresh_token(refresh_token: str) -> Optional[dict]:
    """
    Refresh Token 검증 및 Redis 확인

    Args:
        refresh_token: Refresh Token 문자열

    Returns:
        디코딩된 페이로드 또는 None (검증 실패 시)
    """
    try:
        # JWT 디코딩
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Refresh Token 타입 확인
        if payload.get("token_type") != "refresh":
            print("[JWT] Refresh Token이 아닙니다.")
            return None

        user_id = payload.get("sub")
        user_type = payload.get("type", "user")

        # Redis에서 토큰 확인 (무효화 여부 체크)
        redis_key = f"refresh_token:{user_type}:{user_id}"
        stored_token = redis_client.get(redis_key)

        if not stored_token or stored_token != refresh_token:
            print("[JWT] Refresh Token이 Redis에 없거나 일치하지 않습니다.")
            return None

        return payload

    except jwt.ExpiredSignatureError:
        print("[JWT] Refresh Token이 만료되었습니다.")
        return None
    except jwt.InvalidTokenError as e:
        print(f"[JWT] 유효하지 않은 Refresh Token: {str(e)}")
        return None


def revoke_refresh_token(user_id: str, user_type: str = "user"):
    """
    Refresh Token 무효화 (로그아웃 시 사용)

    Args:
        user_id: 사용자 ID
        user_type: 사용자 타입 ("user" 또는 "admin")
    """
    redis_key = f"refresh_token:{user_type}:{user_id}"
    redis_client.delete(redis_key)
    print(f"[JWT] Refresh Token 무효화: {user_id} ({user_type})")


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


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    현재 로그인한 사용자 정보 조회 (일반 사용자)

    Args:
        credentials: HTTP Authorization 헤더에서 추출한 Bearer 토큰

    Returns:
        사용자 정보 딕셔너리

    Raises:
        HTTPException: 토큰이 유효하지 않은 경우
    """
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Access Token인지 확인 (Refresh Token은 사용 불가)
    if payload.get("token_type") == "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token이 필요합니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 일반 사용자 토큰인지 확인
    if payload.get("type") != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 없습니다.",
        )

    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "user_type": payload.get("user_type"),
    }
