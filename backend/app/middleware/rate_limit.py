"""
API Rate Limiting Middleware
slowapi를 사용한 요청 제한
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import os


def get_identifier(request: Request) -> str:
    """
    요청자 식별자 반환

    - 로그인 사용자: user_id 사용
    - 비로그인: IP 주소 사용
    """
    # Authorization 헤더에서 사용자 정보 추출 시도
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # JWT 토큰에서 사용자 ID 추출 (간단히 토큰 해시 사용)
        token = auth_header.split(" ")[1]
        return f"user:{token[:16]}"  # 토큰 앞 16자리로 사용자 구분

    # 비로그인 사용자는 IP 주소 사용
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.client.host if request.client else "unknown"


# Limiter 인스턴스 생성
limiter = Limiter(
    key_func=get_identifier,
    default_limits=[
        "100/minute",  # 분당 100회
        "2000/hour",   # 시간당 2000회
        "10000/day"    # 일일 10000회
    ],
    storage_uri=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    strategy="fixed-window",
    config_filename=""  # .env 파일 자동 로드 방지 (main.py에서 이미 로드됨)
)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Rate Limit 초과 시 커스텀 응답
    """
    return Response(
        content=f'{{"detail": "요청 제한 초과: {exc.detail}. 잠시 후 다시 시도해주세요."}}',
        status_code=HTTP_429_TOO_MANY_REQUESTS,
        headers={"Content-Type": "application/json"}
    )
