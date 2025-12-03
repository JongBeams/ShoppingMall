"""
분석 지표 API 라우터
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timedelta
from app.models.analytics import (
    RemoteControlMetrics,
    RAGMetrics,
    GiftWizardMetrics,
    AnalyticsSummary
)
from app.services.supabase import supabase
from app.services.auth_middleware import get_current_admin

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/remote-control")
async def log_remote_control_session(metrics: RemoteControlMetrics):
    """원격 제어 세션 기록"""
    try:
        # Supabase에 저장
        result = supabase.table('remote_control_metrics').insert({
            'session_id': metrics.session_id,
            'duration_seconds': metrics.duration_seconds,
            'events_count': metrics.events_count,
            'success': metrics.success,
            'user_satisfaction': metrics.user_satisfaction,
            'timestamp': metrics.timestamp or datetime.now().isoformat()
        }).execute()

        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag-query")
async def log_rag_query(metrics: RAGMetrics):
    """RAG 검색 기록"""
    try:
        result = supabase.table('rag_metrics').insert({
            'query': metrics.query,
            'response_time_ms': metrics.response_time_ms,
            'documents_found': metrics.documents_found,
            'user_rating': metrics.user_rating,
            'clicked_product': metrics.clicked_product,
            'timestamp': metrics.timestamp or datetime.now().isoformat()
        }).execute()

        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gift-wizard")
async def log_gift_wizard_session(metrics: GiftWizardMetrics):
    """선물 마법사 세션 기록"""
    try:
        result = supabase.table('gift_wizard_metrics').insert({
            'session_id': metrics.session_id,
            'completed': metrics.completed,
            'recommendations_count': metrics.recommendations_count,
            'clicked_recommendation': metrics.clicked_recommendation,
            'purchased': metrics.purchased,
            'satisfaction': metrics.satisfaction,
            'timestamp': metrics.timestamp or datetime.now().isoformat()
        }).execute()

        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_analytics_summary(
    days: int = 7,
    admin_user: dict = Depends(get_current_admin)
) -> AnalyticsSummary:
    """통합 분석 요약 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # 원격 제어 지표
        remote_control_data = supabase.table('remote_control_metrics')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .execute()

        rc_sessions = len(remote_control_data.data)
        rc_avg_duration = sum(s['duration_seconds'] for s in remote_control_data.data) / rc_sessions if rc_sessions > 0 else 0
        rc_success_rate = sum(1 for s in remote_control_data.data if s['success']) / rc_sessions * 100 if rc_sessions > 0 else 0
        rc_satisfaction_list = [s['user_satisfaction'] for s in remote_control_data.data if s.get('user_satisfaction')]
        rc_satisfaction = sum(rc_satisfaction_list) / len(rc_satisfaction_list) if rc_satisfaction_list else 0

        # RAG 챗봇 지표
        rag_data = supabase.table('rag_metrics')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .execute()

        rag_queries = len(rag_data.data)
        rag_avg_response_time = sum(q['response_time_ms'] for q in rag_data.data) / rag_queries if rag_queries > 0 else 0
        rag_accuracy_list = [q['user_rating'] for q in rag_data.data if q.get('user_rating')]
        rag_accuracy = (sum(rag_accuracy_list) / len(rag_accuracy_list) / 5 * 100) if rag_accuracy_list else 0
        rag_conversion_rate = sum(1 for q in rag_data.data if q['clicked_product']) / rag_queries * 100 if rag_queries > 0 else 0

        # 선물 마법사 지표
        gift_data = supabase.table('gift_wizard_metrics')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .execute()

        gift_sessions = len(gift_data.data)
        gift_completion_rate = sum(1 for g in gift_data.data if g['completed']) / gift_sessions * 100 if gift_sessions > 0 else 0
        gift_conversion_rate = sum(1 for g in gift_data.data if g['purchased']) / gift_sessions * 100 if gift_sessions > 0 else 0
        gift_satisfaction_list = [g['satisfaction'] for g in gift_data.data if g.get('satisfaction')]
        gift_satisfaction = sum(gift_satisfaction_list) / len(gift_satisfaction_list) if gift_satisfaction_list else 0

        # 전체 통계
        users_count = supabase.table('profiles').select('id', count='exact').execute()
        products_count = supabase.table('products').select('id', count='exact').execute()
        orders_count = supabase.table('orders').select('id', count='exact')\
            .gte('created_at', start_date.isoformat())\
            .execute()
        pending_inquiries_count = supabase.table('inquiries').select('id', count='exact')\
            .eq('status', 'pending')\
            .execute()
        pending_vendors_count = supabase.table('vendor_profiles').select('id', count='exact')\
            .eq('approval_status', 'pending')\
            .execute()

        return AnalyticsSummary(
            # 원격 제어
            remote_control_sessions=rc_sessions,
            remote_control_avg_duration=round(rc_avg_duration, 1),
            remote_control_success_rate=round(rc_success_rate, 1),
            remote_control_satisfaction=round(rc_satisfaction, 2),

            # RAG 챗봇
            rag_queries=rag_queries,
            rag_avg_response_time=round(rag_avg_response_time, 1),
            rag_accuracy=round(rag_accuracy, 1),
            rag_conversion_rate=round(rag_conversion_rate, 1),

            # 선물 마법사
            gift_wizard_sessions=gift_sessions,
            gift_wizard_completion_rate=round(gift_completion_rate, 1),
            gift_wizard_conversion_rate=round(gift_conversion_rate, 1),
            gift_wizard_satisfaction=round(gift_satisfaction, 2),

            # 전체 통계
            total_users=users_count.count,
            total_products=products_count.count,
            total_orders=orders_count.count,
            pending_inquiries=pending_inquiries_count.count,
            pending_vendors=pending_vendors_count.count,

            # 기간
            period_start=start_date.isoformat(),
            period_end=end_date.isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/remote-control/trend")
async def get_remote_control_trend(days: int = 30, admin_user: dict = Depends(get_current_admin)):
    """원격 제어 추세 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        data = supabase.table('remote_control_metrics')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .order('timestamp')\
            .execute()

        # 일별 그룹화
        daily_stats = {}
        for session in data.data:
            date_key = session['timestamp'][:10]  # YYYY-MM-DD
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    'date': date_key,
                    'sessions': 0,
                    'total_duration': 0,
                    'success_count': 0
                }
            daily_stats[date_key]['sessions'] += 1
            daily_stats[date_key]['total_duration'] += session['duration_seconds']
            if session['success']:
                daily_stats[date_key]['success_count'] += 1

        # 평균 계산
        trend_data = []
        for date_key, stats in sorted(daily_stats.items()):
            trend_data.append({
                'date': stats['date'],
                'sessions': stats['sessions'],
                'avg_duration': round(stats['total_duration'] / stats['sessions'], 1),
                'success_rate': round(stats['success_count'] / stats['sessions'] * 100, 1)
            })

        return {"trend": trend_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/trend")
async def get_rag_trend(days: int = 30, admin_user: dict = Depends(get_current_admin)):
    """RAG 챗봇 추세 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        data = supabase.table('rag_metrics')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .order('timestamp')\
            .execute()

        # 일별 그룹화
        daily_stats = {}
        for query in data.data:
            date_key = query['timestamp'][:10]
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    'date': date_key,
                    'queries': 0,
                    'total_response_time': 0,
                    'conversions': 0
                }
            daily_stats[date_key]['queries'] += 1
            daily_stats[date_key]['total_response_time'] += query['response_time_ms']
            if query.get('clicked_product'):
                daily_stats[date_key]['conversions'] += 1

        # 평균 계산
        trend_data = []
        for date_key, stats in sorted(daily_stats.items()):
            trend_data.append({
                'date': stats['date'],
                'queries': stats['queries'],
                'avg_response_time': round(stats['total_response_time'] / stats['queries'], 1),
                'conversion_rate': round(stats['conversions'] / stats['queries'] * 100, 1)
            })

        return {"trend": trend_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gift-wizard/trend")
async def get_gift_wizard_trend(days: int = 30, admin_user: dict = Depends(get_current_admin)):
    """선물 마법사 추세 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        data = supabase.table('gift_wizard_metrics')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .order('timestamp')\
            .execute()

        # 일별 그룹화
        daily_stats = {}
        for session in data.data:
            date_key = session['timestamp'][:10]
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    'date': date_key,
                    'sessions': 0,
                    'completed': 0,
                    'conversions': 0
                }
            daily_stats[date_key]['sessions'] += 1
            if session['completed']:
                daily_stats[date_key]['completed'] += 1
            if session.get('purchased'):
                daily_stats[date_key]['conversions'] += 1

        # 평균 계산
        trend_data = []
        for date_key, stats in sorted(daily_stats.items()):
            trend_data.append({
                'date': stats['date'],
                'sessions': stats['sessions'],
                'completion_rate': round(stats['completed'] / stats['sessions'] * 100, 1),
                'conversion_rate': round(stats['conversions'] / stats['sessions'] * 100, 1)
            })

        return {"trend": trend_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/trend")
async def get_users_trend(days: int = 30, admin_user: dict = Depends(get_current_admin)):
    """회원 가입 추세 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        data = supabase.table('profiles')\
            .select('created_at')\
            .gte('created_at', start_date.isoformat())\
            .order('created_at')\
            .execute()

        # 전체 날짜 범위 초기화 (0으로 채우기)
        daily_stats = {}
        current_date = start_date
        while current_date <= end_date:
            date_key = current_date.strftime('%Y-%m-%d')
            daily_stats[date_key] = {'date': date_key, 'count': 0}
            current_date += timedelta(days=1)

        # 실제 데이터로 업데이트
        for user in data.data:
            date_key = user['created_at'][:10]
            if date_key in daily_stats:
                daily_stats[date_key]['count'] += 1

        trend_data = []
        for date_key in sorted(daily_stats.keys()):
            trend_data.append({
                'date': daily_stats[date_key]['date'],
                'count': daily_stats[date_key]['count']
            })

        return {"trend": trend_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/trend")
async def get_products_trend(days: int = 30, admin_user: dict = Depends(get_current_admin)):
    """상품 등록 추세 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        data = supabase.table('products')\
            .select('created_at')\
            .gte('created_at', start_date.isoformat())\
            .order('created_at')\
            .execute()

        # 전체 날짜 범위 초기화 (0으로 채우기)
        daily_stats = {}
        current_date = start_date
        while current_date <= end_date:
            date_key = current_date.strftime('%Y-%m-%d')
            daily_stats[date_key] = {'date': date_key, 'count': 0}
            current_date += timedelta(days=1)

        # 실제 데이터로 업데이트
        for product in data.data:
            date_key = product['created_at'][:10]
            if date_key in daily_stats:
                daily_stats[date_key]['count'] += 1

        trend_data = []
        for date_key in sorted(daily_stats.keys()):
            trend_data.append({
                'date': daily_stats[date_key]['date'],
                'count': daily_stats[date_key]['count']
            })

        return {"trend": trend_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/trend")
async def get_orders_trend(days: int = 30, admin_user: dict = Depends(get_current_admin)):
    """주문 추세 조회"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        data = supabase.table('orders')\
            .select('created_at')\
            .gte('created_at', start_date.isoformat())\
            .order('created_at')\
            .execute()

        # 전체 날짜 범위 초기화 (0으로 채우기)
        daily_stats = {}
        current_date = start_date
        while current_date <= end_date:
            date_key = current_date.strftime('%Y-%m-%d')
            daily_stats[date_key] = {'date': date_key, 'count': 0}
            current_date += timedelta(days=1)

        # 실제 데이터로 업데이트
        for order in data.data:
            date_key = order['created_at'][:10]
            if date_key in daily_stats:
                daily_stats[date_key]['count'] += 1

        trend_data = []
        for date_key in sorted(daily_stats.keys()):
            trend_data.append({
                'date': daily_stats[date_key]['date'],
                'count': daily_stats[date_key]['count']
            })

        return {"trend": trend_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
