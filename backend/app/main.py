from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager
import logging


logger = logging.getLogger(__name__)

load_dotenv()

# Routers
from app.routers import auth, admin, product, vendor, notice, faq, inquiry, chat, cart, documents, orders, reviews, payment, gift_wizard, subscriptions, points, analytics, wishlist, notifications, coupons

# Scheduler
from app.services.scheduler import start_scheduler, stop_scheduler

# Rate Limiting
from app.middleware.rate_limit import limiter, custom_rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Security Headers
from app.middleware.security_headers import SecurityHeadersMiddleware

# CSRF Protection
from app.middleware.csrf import csrf_protect_middleware

# ============================================================
# 4년차급 프로덕션 기능 추가 (선택적)
# 의존성 없어도 기존 코드 정상 동작
# ============================================================

# 모니터링 (Prometheus) - 선택적
try:
    from app.middleware.metrics import metrics_middleware
    from prometheus_client import make_asgi_app
    PROMETHEUS_ENABLED = True
    logger.info(" Prometheus 모듈 로드 완료")
except ImportError:
    PROMETHEUS_ENABLED = False
    logger.info("ℹ️  Prometheus 미설치 - 기본 모드로 실행 (pip install prometheus-client)")

# Sentry 에러 추적 - 선택적
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration

    # Sentry 초기화 (프로덕션 환경에서만)
    if os.getenv("ENVIRONMENT") == "production" and os.getenv("SENTRY_DSN"):
        sentry_sdk.init(
            dsn=os.getenv("SENTRY_DSN"),
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)
            ],
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            environment=os.getenv("ENVIRONMENT", "production"),
        )
        logger.info(" Sentry 에러 추적 활성화")
except ImportError:
    logger.info("ℹ️  Sentry 미설치 - 에러 추적 비활성화 (pip install sentry-sdk)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    애플리케이션 생명주기 관리

    - 시작 시: 스케줄러 시작, 캐시 워밍
    - 종료 시: 스케줄러 중지
    """
    # 시작
    logger.info("[STARTUP] Application starting...")
    start_scheduler()
    logger.info("[STARTUP] Scheduler started")

    # 캐시 워밍 (인기 데이터 미리 로드) - 선택적
    try:
        from app.database.read_write_split import warm_up_cache
        warm_up_cache()
        logger.info("[STARTUP] Cache warming completed")
    except ImportError:
        logger.info("[STARTUP] Cache warming 비활성화 (선택적 기능)")
    except Exception as e:
        logger.warning(f"[STARTUP] Cache warming failed: {e}")

    yield

    # 종료
    logger.info("[SHUTDOWN] Application shutting down...")
    stop_scheduler()
    logger.info("[SHUTDOWN] Scheduler stopped")


app = FastAPI(title="ShoppingMall API", version="1.0.0", lifespan=lifespan)

# Rate Limiting 설정
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

# ============================================================
# 보안 미들웨어 (우선순위 순서대로 적용)
# ============================================================

# 1. 보안 헤더 (모든 응답에 추가)
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"
app.add_middleware(SecurityHeadersMiddleware, enable_hsts=IS_PRODUCTION)
logger.info(f" 보안 헤더 활성화 (HSTS: {IS_PRODUCTION})")

# 2. CORS 설정 (크로스 도메인 요청 제어)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # 환경 변수에서 허용된 도메인만 사용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 3. CSRF 보호 (POST/PUT/PATCH/DELETE 요청 검증)
# 프로덕션에서만 활성화 (개발 시 비활성화 가능)
CSRF_ENABLED = os.getenv("CSRF_ENABLED", "false").lower() == "true"
if CSRF_ENABLED:
    app.middleware("http")(csrf_protect_middleware)
    logger.info(" CSRF 보호 활성화")
else:
    logger.info("ℹ️  CSRF 보호 비활성화 (개발 환경)")

# ============================================================
# Prometheus 모니터링 미들웨어 (선택적)
# ============================================================
if PROMETHEUS_ENABLED:
    app.middleware("http")(metrics_middleware)

    # Prometheus 메트릭 엔드포인트
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    logger.info(" Prometheus 모니터링 활성화 (/metrics)")
else:
    logger.info("ℹ️  Prometheus 비활성화 - 설치 방법: pip install prometheus-client")

# Routers 등록
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(product.router)
app.include_router(vendor.router)
app.include_router(notice.router)
app.include_router(faq.router)
app.include_router(inquiry.router)
app.include_router(chat.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(documents.router)
app.include_router(payment.router)
app.include_router(gift_wizard.router)
app.include_router(subscriptions.router)
app.include_router(points.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(coupons.router)

@app.get("/")
async def root():
    return {"message": "ShoppingMall API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# WebSocket 테스트 엔드포인트
from fastapi import WebSocket
@app.websocket("/test-ws")
async def test_websocket(websocket: WebSocket):
    logger.info("테스트 WebSocket 연결 요청!")
    await websocket.accept()
    logger.info("테스트 WebSocket 연결 성공!")
    await websocket.send_text("Hello from WebSocket!")
    await websocket.close()

