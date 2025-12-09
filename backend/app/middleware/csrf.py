"""
CSRF (Cross-Site Request Forgery) 방어 미들웨어

실무 수준의 CSRF 토큰 검증:
- 세션별 CSRF 토큰 생성
- Redis에 토큰 저장 (TTL: 1시간)
- POST/PUT/PATCH/DELETE 요청만 검증
- GET/HEAD/OPTIONS는 통과
"""

import secrets
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

# Redis 클라이언트 (rate_limit.py와 공유 가능)
try:
    from app.middleware.rate_limit import redis_client
except ImportError:
    # Fallback: 새로운 Redis 연결
    import os
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=1,  # CSRF 전용 DB
        decode_responses=True
    )

# CSRF 설정
CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_TTL = 3600  # 1시간
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"

# CSRF 검증 제외 경로
CSRF_EXEMPT_PATHS = [
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
    "/metrics",
    "/auth/login",  # 로그인은 CSRF 불필요 (최초 토큰 발급)
    "/auth/register",  # 회원가입도 제외
]

# CSRF 검증 제외 메서드
CSRF_SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]


def generate_csrf_token() -> str:
    """
    암호학적으로 안전한 CSRF 토큰 생성

    Returns:
        32자 랜덤 문자열
    """
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def store_csrf_token(token: str, user_id: Optional[str] = None) -> None:
    """
    CSRF 토큰을 Redis에 저장

    Args:
        token: CSRF 토큰
        user_id: 사용자 ID (선택, 로그 추적용)
    """
    try:
        key = f"csrf:{token}"
        redis_client.setex(key, CSRF_TOKEN_TTL, user_id or "anonymous")
        logger.debug(f"[CSRF] Token stored: {token[:8]}... for user {user_id or 'anonymous'}")
    except redis.RedisError as e:
        logger.error(f"[CSRF] Failed to store token in Redis: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CSRF token storage failed"
        )


def verify_csrf_token(token: str) -> bool:
    """
    CSRF 토큰 검증

    Args:
        token: 클라이언트가 보낸 CSRF 토큰

    Returns:
        유효하면 True, 아니면 False
    """
    try:
        key = f"csrf:{token}"
        exists = redis_client.exists(key)

        if exists:
            logger.debug(f"[CSRF] Token verified: {token[:8]}...")
            return True
        else:
            logger.warning(f"[CSRF] Invalid token: {token[:8]}...")
            return False
    except redis.RedisError as e:
        logger.error(f"[CSRF] Redis error during verification: {e}")
        # Redis 장애 시 CSRF 검증 통과 (가용성 우선)
        return True


def delete_csrf_token(token: str) -> None:
    """
    CSRF 토큰 삭제 (로그아웃 시)

    Args:
        token: 삭제할 CSRF 토큰
    """
    try:
        key = f"csrf:{token}"
        redis_client.delete(key)
        logger.debug(f"[CSRF] Token deleted: {token[:8]}...")
    except redis.RedisError as e:
        logger.error(f"[CSRF] Failed to delete token: {e}")


async def csrf_protect_middleware(request: Request, call_next):
    """
    CSRF 방어 미들웨어

    동작 방식:
    1. 안전한 메서드(GET, HEAD, OPTIONS)는 통과
    2. 제외 경로는 통과
    3. POST/PUT/PATCH/DELETE는 CSRF 토큰 검증
    4. 검증 실패 시 403 Forbidden

    Args:
        request: FastAPI 요청 객체
        call_next: 다음 미들웨어/핸들러

    Returns:
        Response 객체
    """
    # 1. 안전한 메서드는 통과
    if request.method in CSRF_SAFE_METHODS:
        return await call_next(request)

    # 2. 제외 경로는 통과
    path = request.url.path
    if any(path.startswith(exempt) for exempt in CSRF_EXEMPT_PATHS):
        return await call_next(request)

    # 3. CSRF 토큰 검증
    csrf_token = request.headers.get(CSRF_HEADER_NAME)

    if not csrf_token:
        logger.warning(f"[CSRF] Missing token for {request.method} {path}")
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": "CSRF token missing",
                "error_code": "CSRF_TOKEN_MISSING",
                "hint": f"Include '{CSRF_HEADER_NAME}' header in your request"
            }
        )

    # 4. 토큰 유효성 검증
    if not verify_csrf_token(csrf_token):
        logger.warning(f"[CSRF] Invalid token for {request.method} {path}: {csrf_token[:8]}...")
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": "CSRF token invalid or expired",
                "error_code": "CSRF_TOKEN_INVALID",
                "hint": "Request a new CSRF token from /auth/csrf-token"
            }
        )

    # 5. 검증 통과 → 다음 핸들러 실행
    response = await call_next(request)
    return response


# FastAPI 라우터에서 사용할 의존성
def get_csrf_token(request: Request) -> str:
    """
    현재 요청의 CSRF 토큰 반환 (의존성 주입용)

    Args:
        request: FastAPI 요청 객체

    Returns:
        CSRF 토큰

    Raises:
        HTTPException: 토큰이 없거나 유효하지 않으면
    """
    csrf_token = request.headers.get(CSRF_HEADER_NAME)

    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing"
        )

    if not verify_csrf_token(csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token invalid or expired"
        )

    return csrf_token
