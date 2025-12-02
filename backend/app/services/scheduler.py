# -*- coding: utf-8 -*-
"""
포인트 만료 배치 작업 스케줄러

매일 자정에 만료된 포인트를 처리합니다.
"""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.supabase import get_supabase_admin_client
from app.services.points import expire_points

logger = logging.getLogger(__name__)

# 스케줄러 인스턴스
scheduler = AsyncIOScheduler()


async def expire_points_job():
    """
    만료된 포인트를 처리하는 배치 작업

    매일 자정(00:00)에 실행됩니다.
    """
    try:
        logger.info("=== 포인트 만료 배치 작업 시작 ===")
        supabase = get_supabase_admin_client()

        # 만료된 포인트 처리
        expired_count = await expire_points(supabase)

        logger.info(f"=== 포인트 만료 배치 작업 완료: {expired_count}명 처리 ===")

    except Exception as e:
        logger.error(f"=== 포인트 만료 배치 작업 실패: {str(e)} ===")


def start_scheduler():
    """
    스케줄러 시작

    매일 자정(00:00)에 포인트 만료 작업 실행
    """
    try:
        # 매일 자정(00:00)에 실행
        scheduler.add_job(
            expire_points_job,
            trigger=CronTrigger(hour=0, minute=0),
            id="expire_points_job",
            name="포인트 만료 배치 작업",
            replace_existing=True,
        )

        scheduler.start()
        logger.info("✅ 포인트 만료 스케줄러 시작됨 (매일 00:00 실행)")

    except Exception as e:
        logger.error(f"❌ 스케줄러 시작 실패: {str(e)}")


def stop_scheduler():
    """
    스케줄러 중지
    """
    try:
        scheduler.shutdown()
        logger.info("✅ 포인트 만료 스케줄러 중지됨")
    except Exception as e:
        logger.error(f"❌ 스케줄러 중지 실패: {str(e)}")


# 수동 실행 함수 (테스트용)
async def run_expire_points_manually():
    """
    포인트 만료 작업을 수동으로 실행 (테스트용)

    Returns:
        int: 처리된 사용자 수
    """
    try:
        logger.info("=== 포인트 만료 작업 수동 실행 시작 ===")
        supabase = get_supabase_admin_client()

        expired_count = await expire_points(supabase)

        logger.info(f"=== 포인트 만료 작업 수동 실행 완료: {expired_count}명 처리 ===")
        return expired_count

    except Exception as e:
        logger.error(f"=== 포인트 만료 작업 수동 실행 실패: {str(e)} ===")
        raise
