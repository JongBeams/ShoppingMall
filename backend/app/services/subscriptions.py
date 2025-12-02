# -*- coding: utf-8 -*-
from supabase import Client
from typing import Optional, List, Dict, Any
from app.models.subscriptions import SubscriptionPlanResponse


def convert_plan_to_response(plan: Dict[str, Any]) -> SubscriptionPlanResponse:
    """
    DB 플랜 데이터를 응답 모델로 변환하는 공통 로직
    """
    return SubscriptionPlanResponse(
        id=str(plan["id"]),
        name=plan["name"],
        slug=plan.get("slug"),
        price=float(plan["price"]),
        duration_days=plan["duration_days"],
        commission_discount=float(plan.get("commission_discount", 0)),
        description=plan.get("description"),
        features=plan.get("features", {}),
        is_active=plan.get("is_active", True),
        is_buyer=plan.get("is_buyer", False)
    )


async def get_plans(
    supabase: Client,
    is_buyer: Optional[bool] = None,
    is_active: Optional[bool] = True
) -> List[SubscriptionPlanResponse]:
    """
    구독 플랜 목록 조회

    Args:
        supabase: Supabase 클라이언트
        is_buyer: True(구매자용), False(판매자용), None(전체)
        is_active: True(활성), False(비활성), None(전체)

    Returns:
        구독 플랜 목록
    """
    # 쿼리 빌더 시작
    query = supabase.table("subscription_plans").select("*")

    # 필터 적용
    if is_buyer is not None:
        query = query.eq("is_buyer", is_buyer)

    if is_active is not None:
        query = query.eq("is_active", is_active)

    # 정렬 (가격 순)
    query = query.order("price", desc=False)

    # 실행
    response = query.execute()

    if not response.data:
        return []

    # 응답 데이터 변환
    return [convert_plan_to_response(plan) for plan in response.data]


async def get_plan_by_id(
    supabase: Client,
    plan_id: str
) -> Optional[SubscriptionPlanResponse]:
    """
    ID로 구독 플랜 조회

    Args:
        supabase: Supabase 클라이언트
        plan_id: 플랜 ID

    Returns:
        구독 플랜 또는 None
    """
    response = supabase.table("subscription_plans")\
        .select("*")\
        .eq("id", plan_id)\
        .single()\
        .execute()

    if not response.data:
        return None

    return convert_plan_to_response(response.data)


async def get_plan_by_slug(
    supabase: Client,
    slug: str
) -> Optional[SubscriptionPlanResponse]:
    """
    slug로 구독 플랜 조회

    Args:
        supabase: Supabase 클라이언트
        slug: 플랜 slug

    Returns:
        구독 플랜 또는 None
    """
    response = supabase.table("subscription_plans")\
        .select("*")\
        .eq("slug", slug)\
        .single()\
        .execute()

    if not response.data:
        return None

    return convert_plan_to_response(response.data)
