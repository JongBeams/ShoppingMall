"""
보안 헤더 미들웨어

실무 수준의 HTTP 보안 헤더 설정:
- X-Content-Type-Options: MIME 스니핑 방지
- X-Frame-Options: 클릭재킹 방지
- X-XSS-Protection: XSS 공격 방지 (레거시 브라우저용)
- Strict-Transport-Security: HTTPS 강제
- Content-Security-Policy: CSP 정책
- Referrer-Policy: Referrer 정보 제어
- Permissions-Policy: 브라우저 기능 제어
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    HTTP 보안 헤더 추가 미들웨어

    OWASP Top 10 보안 권장사항 준수:
    - A01:2021 – Broken Access Control
    - A03:2021 – Injection
    - A05:2021 – Security Misconfiguration
    """

    def __init__(self, app: ASGIApp, enable_hsts: bool = False):
        """
        Args:
            app: FastAPI 앱
            enable_hsts: HSTS 활성화 여부 (프로덕션에서만 True)
        """
        super().__init__(app)
        self.enable_hsts = enable_hsts

    async def dispatch(self, request: Request, call_next):
        """
        모든 응답에 보안 헤더 추가

        Args:
            request: FastAPI 요청 객체
            call_next: 다음 미들웨어/핸들러

        Returns:
            보안 헤더가 추가된 Response
        """
        response = await call_next(request)

        # 1. X-Content-Type-Options: MIME 스니핑 방지
        # 공격자가 악성 파일을 업로드하여 브라우저가 실행하도록 유도하는 공격 방지
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 2. X-Frame-Options: 클릭재킹 방지
        # 악성 사이트가 iframe으로 우리 사이트를 포함하는 것을 방지
        response.headers["X-Frame-Options"] = "DENY"

        # 3. X-XSS-Protection: XSS 공격 방지 (레거시 브라우저용)
        # 최신 브라우저는 CSP를 사용하지만, 구형 브라우저 호환성을 위해 추가
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 4. Strict-Transport-Security (HSTS): HTTPS 강제
        # 프로덕션 환경에서만 활성화 (로컬 개발은 HTTP 사용)
        if self.enable_hsts:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # 5. Content-Security-Policy (CSP): XSS 방어의 핵심
        # 실무에서는 프론트엔드 요구사항에 맞게 조정 필요
        csp_directives = [
            "default-src 'self'",  # 기본: 자신의 도메인만 허용
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # 스크립트: Next.js HMR 지원
            "style-src 'self' 'unsafe-inline'",  # 스타일: Tailwind CSS 지원
            "img-src 'self' data: https:",  # 이미지: 외부 이미지 허용
            "font-src 'self' data:",  # 폰트
            "connect-src 'self' ws: wss:",  # WebSocket 허용
            "frame-ancestors 'none'",  # iframe 금지 (X-Frame-Options와 동일)
            "base-uri 'self'",  # <base> 태그 제한
            "form-action 'self'",  # 폼 제출 제한
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # 6. Referrer-Policy: Referrer 정보 제어
        # 외부 사이트로 이동 시 Referrer 헤더에 민감 정보가 포함되지 않도록
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 7. Permissions-Policy: 브라우저 기능 제어
        # 카메라, 마이크, 위치 등 민감한 기능 사용 제한
        permissions_policies = [
            "geolocation=(self)",  # 위치: 자신의 도메인만
            "microphone=()",  # 마이크: 사용 금지
            "camera=()",  # 카메라: 사용 금지 (이미지 검색은 파일 업로드로 대체)
            "payment=(self)",  # 결제: 자신의 도메인만
            "usb=()",  # USB: 사용 금지
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions_policies)

        # 8. X-Permitted-Cross-Domain-Policies: Adobe Flash/PDF 정책
        # 레거시 보안 헤더지만 일부 스캐너에서 체크하므로 추가
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # 9. Cache-Control: 민감 정보 캐싱 방지 (인증 필요한 엔드포인트)
        if request.url.path.startswith("/auth") or request.url.path.startswith("/mypage"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        logger.debug(f"[Security Headers] Added to {request.method} {request.url.path}")
        return response


def get_security_headers_middleware(enable_hsts: bool = False):
    """
    보안 헤더 미들웨어 팩토리 함수

    Args:
        enable_hsts: HSTS 활성화 여부 (프로덕션=True, 개발=False)

    Returns:
        SecurityHeadersMiddleware 인스턴스

    Usage:
        app.add_middleware(SecurityHeadersMiddleware, enable_hsts=True)
    """
    return SecurityHeadersMiddleware
