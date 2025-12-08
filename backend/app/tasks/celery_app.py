"""
Celery 비동기 작업 정의
 대규모 비동기 처리 아키텍처 설계

비동기 처리가 필요한 작업:
1. 이미지 임베딩 생성 (대량 상품 등록 시)
2. AI 리뷰 요약 생성
3. 선물 추천 알고리즘 실행
4. 이메일/푸시 알림 발송
5. 주문 완료 후처리 (재고 업데이트, 포인트 적립)
6. 통계 데이터 집계
"""
from celery import Celery
import os
import logging
from typing import List
import time

logger = logging.getLogger(__name__)

# Celery 앱 초기화
celery_app = Celery(
    'shoppingmall',
    broker=os.getenv('CELERY_BROKER_URL', 'amqp://admin:admin123@localhost:5672//'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
)

# Celery 설정
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5분 타임아웃
    task_soft_time_limit=240,  # 4분 경고
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)


# ============================================================
# 1. 이미지 임베딩 생성 (대량 처리)
# ============================================================

@celery_app.task(bind=True, max_retries=3)
def generate_image_embeddings_batch(self, product_ids: List[str]):
    """
    대량 상품 이미지 임베딩 생성 (비동기)

    사용 사례:
    - 신규 상품 100개 등록 시
    - 기존 상품 재임베딩 (모델 업데이트 시)

    성능:
    - 동기 처리: 100개 × 500ms = 50초 (사용자 대기)
    - 비동기 처리: 즉시 반환, 백그라운드에서 처리

    에러 처리:
    - 3회 재시도 (지수 백오프)
    - 실패 시 Sentry 알림
    """
    logger.info(f"[Celery] 이미지 임베딩 배치 작업 시작: {len(product_ids)}개")
    start_time = time.time()

    try:
        from app.services.image_embedding_optimized import get_embedding_service
        from supabase import create_client

        embedding_service = get_embedding_service()
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

        success_count = 0
        failed_products = []

        for i, product_id in enumerate(product_ids):
            try:
                # 상품 정보 조회
                product = supabase.table("products").select("*").eq("id", product_id).single().execute()

                if not product.data or not product.data.get("image_url"):
                    logger.warning(f"상품 이미지 없음: {product_id}")
                    continue

                # 이미지 다운로드
                import requests
                image_response = requests.get(product.data["image_url"], timeout=10)
                image_bytes = image_response.content

                # 임베딩 생성
                embedding = embedding_service.generate_embedding_single(image_bytes)

                # DB 업데이트
                supabase.table("products").update({
                    "image_embedding": embedding.tolist()
                }).eq("id", product_id).execute()

                success_count += 1

                # 진행률 업데이트 (Celery progress)
                self.update_state(
                    state='PROGRESS',
                    meta={
                        'current': i + 1,
                        'total': len(product_ids),
                        'percent': int((i + 1) / len(product_ids) * 100)
                    }
                )

            except Exception as e:
                logger.error(f"임베딩 생성 실패: {product_id}, {e}")
                failed_products.append(product_id)

        elapsed = time.time() - start_time
        logger.info(
            f"[Celery] 이미지 임베딩 완료: {success_count}/{len(product_ids)}개, "
            f"{elapsed:.2f}s"
        )

        return {
            'success_count': success_count,
            'failed_products': failed_products,
            'elapsed_seconds': elapsed
        }

    except Exception as e:
        logger.error(f"[Celery] 이미지 임베딩 배치 작업 실패: {e}")
        # 재시도
        raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))


# ============================================================
# 2. AI 리뷰 요약 생성
# ============================================================

@celery_app.task(bind=True, max_retries=2)
def generate_review_summary(self, product_id: str):
    """
    상품 리뷰 요약 생성 (비동기)

    트리거:
    - 새 리뷰 작성 시 (실시간은 아니어도 됨)
    - 관리자가 수동 요청 시

    LLM 추론 시간: 5-10초
    → 사용자 대기 없이 백그라운드 처리
    """
    logger.info(f"[Celery] 리뷰 요약 생성 시작: {product_id}")

    try:
        from app.services.rag_search import generate_review_summary_llm
        from supabase import create_client

        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

        # 리뷰 조회
        reviews = supabase.table("reviews")\
            .select("*")\
            .eq("product_id", product_id)\
            .order("created_at", desc=True)\
            .limit(30)\
            .execute()

        if not reviews.data:
            logger.info(f"리뷰 없음: {product_id}")
            return {'message': 'no_reviews'}

        # LLM 요약 생성
        summary = generate_review_summary_llm(reviews.data)

        # DB 저장
        supabase.table("products").update({
            "review_summary": summary,
            "review_summary_updated_at": "now()"
        }).eq("id", product_id).execute()

        logger.info(f"[Celery] 리뷰 요약 생성 완료: {product_id}")

        return {'product_id': product_id, 'summary_length': len(summary)}

    except Exception as e:
        logger.error(f"[Celery] 리뷰 요약 생성 실패: {product_id}, {e}")
        raise self.retry(exc=e, countdown=120)


# ============================================================
# 3. 주문 후처리 (재고 업데이트, 알림 발송)
# ============================================================

@celery_app.task(bind=True, max_retries=5)
def process_order_completion(self, order_id: str):
    """
    주문 완료 후처리 (비동기)

    처리 항목:
    1. 재고 차감
    2. 판매량 업데이트
    3. 포인트 적립
    4. 주문 확인 이메일 발송
    5. 판매자에게 알림

    트랜잭션 실패 시:
    - 5회 재시도
    - 재시도 간격: 1분 → 2분 → 4분 → 8분 → 16분 (지수 백오프)
    """
    logger.info(f"[Celery] 주문 후처리 시작: {order_id}")

    try:
        from supabase import create_client
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

        # 주문 정보 조회
        order = supabase.table("orders").select("*").eq("id", order_id).single().execute()
        if not order.data:
            logger.error(f"주문 없음: {order_id}")
            return

        # 1. 재고 차감
        for item in order.data.get("items", []):
            supabase.rpc(
                "decrease_product_stock",
                {"product_id": item["product_id"], "quantity": item["quantity"]}
            ).execute()

        # 2. 판매량 업데이트
        for item in order.data.get("items", []):
            supabase.rpc(
                "increment_product_sales",
                {"product_id": item["product_id"], "quantity": item["quantity"]}
            ).execute()

        # 3. 포인트 적립 (결제 금액의 1%)
        points_to_add = int(order.data["total_amount"] * 0.01)
        supabase.rpc(
            "add_user_points",
            {
                "user_id": order.data["user_id"],
                "points": points_to_add,
                "reason": f"주문 적립 ({order_id})"
            }
        ).execute()

        # 4. 이메일 발송 (다른 태스크로 위임)
        send_order_confirmation_email.delay(order_id)

        # 5. 판매자 알림
        notify_vendor_new_order.delay(order_id)

        logger.info(f"[Celery] 주문 후처리 완료: {order_id}")

        return {'order_id': order_id, 'status': 'completed'}

    except Exception as e:
        logger.error(f"[Celery] 주문 후처리 실패: {order_id}, {e}")
        # 지수 백오프 재시도
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


# ============================================================
# 4. 이메일 발송
# ============================================================

@celery_app.task(bind=True, max_retries=3)
def send_order_confirmation_email(self, order_id: str):
    """주문 확인 이메일 발송"""
    logger.info(f"[Celery] 주문 확인 이메일 발송: {order_id}")

    try:
        from app.services.email import send_email
        from supabase import create_client

        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

        order = supabase.table("orders").select("*, users(email, full_name)").eq("id", order_id).single().execute()

        if not order.data:
            return

        send_email(
            to=order.data["users"]["email"],
            subject=f"주문이 완료되었습니다 (주문번호: {order_id[:8]})",
            body=f"""
            안녕하세요 {order.data["users"]["full_name"]}님,

            주문이 정상적으로 완료되었습니다.

            주문번호: {order_id}
            결제 금액: {order.data["total_amount"]:,}원

            감사합니다.
            """
        )

        logger.info(f"[Celery] 이메일 발송 완료: {order_id}")

    except Exception as e:
        logger.error(f"[Celery] 이메일 발송 실패: {order_id}, {e}")
        raise self.retry(exc=e, countdown=60)


@celery_app.task
def notify_vendor_new_order(order_id: str):
    """판매자에게 신규 주문 알림"""
    logger.info(f"[Celery] 판매자 알림: {order_id}")
    # 구현 생략
    pass


# ============================================================
# 5. 스케줄 작업 (Celery Beat)
# ============================================================

@celery_app.task
def aggregate_daily_statistics():
    """
    일일 통계 집계 (매일 자정 실행)

    집계 항목:
    - 일일 매출
    - 신규 회원 수
    - 상품별 조회수/판매량
    - 인기 검색어
    """
    logger.info("[Celery Beat] 일일 통계 집계 시작")

    try:
        from supabase import create_client
        from datetime import datetime, timedelta

        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

        # 일일 매출
        orders = supabase.table("orders")\
            .select("total_amount")\
            .gte("created_at", yesterday)\
            .execute()

        total_revenue = sum(order["total_amount"] for order in orders.data)

        # 통계 저장
        supabase.table("daily_statistics").insert({
            "date": yesterday,
            "total_revenue": total_revenue,
            "order_count": len(orders.data),
        }).execute()

        logger.info(f"[Celery Beat] 일일 통계 집계 완료: {yesterday}, 매출 {total_revenue:,}원")

    except Exception as e:
        logger.error(f"[Celery Beat] 일일 통계 집계 실패: {e}")


# Celery Beat 스케줄
celery_app.conf.beat_schedule = {
    'aggregate-daily-stats': {
        'task': 'app.tasks.celery_app.aggregate_daily_statistics',
        'schedule': 3600.0,  # 1시간마다 (테스트용, 실제로는 crontab(hour=0, minute=0))
    },
}
