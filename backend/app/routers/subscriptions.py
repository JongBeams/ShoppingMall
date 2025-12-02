# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.services.supabase import get_supabase_client
from app.models.subscriptions import SubscriptionPlanResponse, SubscriptionPlansResponse
from app.services.subscriptions import get_plans, get_plan_by_id, get_plan_by_slug
from typing import Optional

router = APIRouter(prefix="/subscription", tags=["subscriptions"])


@router.get("/plans", response_model=SubscriptionPlansResponse)
async def get_subscription_plans(
    is_buyer: Optional[bool] = None,
    is_active: Optional[bool] = True,
    supabase: Client = Depends(get_supabase_client)
):
    """
    구독 플랜 목록 조회

    - is_buyer: True(구매자용), False(판매자용), None(전체)
    - is_active: True(활성), False(비활성), None(전체)
    """
    try:
        plans = await get_plans(
            supabase=supabase,
            is_buyer=is_buyer,
            is_active=is_active
        )
        return SubscriptionPlansResponse(plans=plans, count=len(plans))

    except Exception as e:
        print(f"구독 플랜 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독 플랜 조회 실패: {str(e)}")


@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_subscription_plan(
    plan_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    특정 구독 플랜 조회
    """
    try:
        plan = await get_plan_by_id(
            supabase=supabase,
            plan_id=plan_id
        )

        if not plan:
            raise HTTPException(status_code=404, detail="구독 플랜을 찾을 수 없습니다")

        return plan

    except HTTPException:
        raise
    except Exception as e:
        print(f"구독 플랜 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독 플랜 조회 실패: {str(e)}")


@router.get("/plans/slug/{slug}", response_model=SubscriptionPlanResponse)
async def get_subscription_plan_by_slug(
    slug: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    slug로 구독 플랜 조회
    """
    try:
        plan = await get_plan_by_slug(
            supabase=supabase,
            slug=slug
        )

        if not plan:
            raise HTTPException(status_code=404, detail="구독 플랜을 찾을 수 없습니다")

        return plan

    except HTTPException:
        raise
    except Exception as e:
        print(f"구독 플랜 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독 플랜 조회 실패: {str(e)}")
