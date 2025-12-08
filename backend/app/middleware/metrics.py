"""
Prometheus Metrics Middleware
4년차 증명: 프로덕션 모니터링 경험
"""
from prometheus_client import Counter, Histogram, Gauge
import time
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

# 메트릭 정의
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

image_search_latency = Histogram(
    'image_search_latency_seconds',
    'CLIP image search latency',
    ['model_type']  # CLIP, ResNet 등
)

image_search_total = Counter(
    'image_search_total',
    'Total image searches',
    ['status']  # success, error
)

rag_search_latency = Histogram(
    'rag_search_latency_seconds',
    'RAG search latency',
    ['search_type']  # document, product, hybrid
)

active_websocket_connections = Gauge(
    'active_websocket_connections',
    'Number of active WebSocket connections',
    ['room_id']
)

llm_token_usage = Counter(
    'llm_token_usage_total',
    'Total LLM tokens used',
    ['model', 'operation']  # chat, recommendation, review_summary
)

db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['table', 'operation']  # products.select, orders.insert
)

cache_hit_rate = Counter(
    'cache_operations_total',
    'Cache hit/miss count',
    ['operation']  # hit, miss
)


async def metrics_middleware(request: Request, call_next):
    """
    모든 HTTP 요청에 대한 메트릭 수집
    """
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    # 메트릭 기록
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response


# 사용 예시
def track_image_search(func):
    """이미지 검색 성능 추적 데코레이터"""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            image_search_total.labels(status='success').inc()
            return result
        except Exception as e:
            image_search_total.labels(status='error').inc()
            logger.error(f"Image search failed: {e}")
            raise
        finally:
            latency = time.time() - start_time
            image_search_latency.labels(model_type='CLIP').observe(latency)

            # 성능 경고 (4년차가 하는 것)
            if latency > 1.0:
                logger.warning(
                    f"Image search latency high: {latency:.2f}s",
                    extra={'alert': 'performance_degradation'}
                )

    return wrapper
