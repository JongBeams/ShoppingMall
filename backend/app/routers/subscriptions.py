# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.services.supabase import get_supabase_client
from app.models.subscriptions import SubscriptionPlanResponse, SubscriptionPlansResponse
from app.services.subscriptions import get_plans, get_plan_by_id, get_plan_by_slug
from app.services.auth_middleware import get_current_user, get_current_admin
from app.config import get_settings
from app.services.points import earn_points
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID
import requests
import base64
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscription", tags=["subscriptions"])

# Settings 인스턴스
settings = get_settings()


# 프론트엔드로부터 받는 요청 모델 (camelCase)
class SubscriptionConfirmRequest(BaseModel):
    orderId: str
    paymentKey: str
    amount: int
    planId: str


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
        logger.info(f"구독 플랜 조회 오류: {str(e)}")
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
        logger.info(f"구독 플랜 조회 오류: {str(e)}")
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
        logger.info(f"구독 플랜 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독 플랜 조회 실패: {str(e)}")


@router.get("/current")
async def get_current_subscription(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    현재 사용자의 활성 구독 정보 조회
    """
    try:
        # 1. 사용자 profile_id 조회
        profile_response = supabase.table("profiles").select("id").eq("id", current_user["id"]).execute()

        if not profile_response.data:
            raise HTTPException(status_code=404, detail="사용자 프로필을 찾을 수 없습니다")

        profile_id = profile_response.data[0]["id"]

        # 2. 활성 구독 정보 조회
        subscription_response = supabase.table("subscription_users")\
            .select("*, subscription_plans(*)")\
            .eq("profile_id", profile_id)\
            .eq("is_active", True)\
            .execute()

        if not subscription_response.data:
            return {
                "has_subscription": False,
                "subscription": None,
                "message": "활성 구독이 없습니다"
            }

        subscription = subscription_response.data[0]

        return {
            "has_subscription": True,
            "subscription": subscription,
            "message": "구독 정보 조회 성공"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"구독 정보 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독 정보 조회 실패: {str(e)}")


@router.get("/admin/users")
async def get_all_subscription_users(
    current_admin: dict = Depends(get_current_admin),
    supabase: Client = Depends(get_supabase_client)
):
    """
    [관리자] 전체 구독자 목록 조회
    """
    try:
        # subscription_users와 profiles, subscription_plans를 조인하여 조회
        subscription_response = supabase.table("subscription_users")\
            .select("*, profiles(id, email, full_name, user_type), subscription_plans(*)")\
            .order("created_at", desc=True)\
            .execute()

        subscriptions = subscription_response.data or []

        # 각 구독에 대해 추가 정보 조회
        for sub in subscriptions:
            if sub.get("profiles"):
                profile = sub["profiles"]

                # user_type으로 판매자 여부 확인
                is_seller = profile.get("user_type") == "seller"

                # 판매자인 경우 vendor 정보 추가 조회
                if is_seller:
                    vendor_response = supabase.table("vendors")\
                        .select("store_name, owner_name")\
                        .eq("user_id", profile["id"])\
                        .execute()

                    if vendor_response.data:
                        sub["vendor_info"] = vendor_response.data[0]

                    # 등록 상품 수 조회
                    product_count_response = supabase.table("products")\
                        .select("id", count="exact")\
                        .eq("vendor_id", profile["id"])\
                        .execute()

                    sub["product_count"] = product_count_response.count or 0

                # role 필드를 user_type 기반으로 추가 (프론트엔드 호환성)
                profile["role"] = "seller" if is_seller else "buyer"
                # display_name을 full_name으로 대체 (프론트엔드 호환성)
                profile["display_name"] = profile.get("full_name")

        return {
            "success": True,
            "subscriptions": subscriptions,
            "count": len(subscriptions)
        }

    except Exception as e:
        logger.error(f"구독자 목록 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독자 목록 조회 실패: {str(e)}")


@router.post("/confirm")
async def confirm_subscription_payment(
    request: SubscriptionConfirmRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    구독 결제 승인 및 구독 생성
    """
    try:
        # 1. Toss Payments에 결제 승인 요청
        auth_string = base64.b64encode(f"{settings.TOSS_SECRET_KEY}:".encode()).decode()

        toss_response = requests.post(
            "https://api.tosspayments.com/v1/payments/confirm",
            headers={
                "Authorization": f"Basic {auth_string}",
                "Content-Type": "application/json",
            },
            json={
                "orderId": request.orderId,
                "paymentKey": request.paymentKey,
                "amount": request.amount,
            },
        )

        if toss_response.status_code != 200:
            error_data = toss_response.json()
            raise HTTPException(
                status_code=400,
                detail=f"결제 승인 실패: {error_data.get('message', '알 수 없는 오류')}"
            )

        payment_data = toss_response.json()

        # 2. 구독 플랜 정보 조회
        plan = await get_plan_by_id(supabase=supabase, plan_id=request.planId)
        if not plan:
            raise HTTPException(status_code=404, detail="구독 플랜을 찾을 수 없습니다")

        # 3. 사용자 profile_id 조회
        profile_response = supabase.table("profiles").select("id").eq("id", current_user["id"]).execute()

        if not profile_response.data:
            raise HTTPException(status_code=404, detail="사용자 프로필을 찾을 수 없습니다")

        profile_id = profile_response.data[0]["id"]

        # 4. 구독 종료일 계산
        start_date = datetime.now()
        end_date = start_date + timedelta(days=plan.duration_days)

        # 5. 기존 구독이 있으면 비활성화
        existing_subscription = supabase.table("subscription_users")\
            .select("*")\
            .eq("profile_id", profile_id)\
            .eq("is_active", True)\
            .execute()

        if existing_subscription.data:
            # 기존 구독 비활성화
            supabase.table("subscription_users")\
                .update({"is_active": False, "ended_at": datetime.now().isoformat()})\
                .eq("profile_id", profile_id)\
                .eq("is_active", True)\
                .execute()

        # 6. subscription_users 테이블에 새 구독 정보 저장
        subscription_data = {
            "profile_id": profile_id,
            "subscription_plan_id": str(plan.id),
            "started_at": start_date.isoformat(),
            "ended_at": end_date.isoformat(),
            "is_active": True,
            "features": plan.features if isinstance(plan.features, dict) else plan.features.model_dump(),
        }

        result = supabase.table("subscription_users").insert(subscription_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="구독 정보 저장 실패")

        # 7. 구독 플랜에 포인트 혜택이 있으면 자동 적립
        points_earned = 0
        transaction_id = None

        # 플랜의 features에서 포인트 정보 확인 (구매자 플랜만 해당)
        plan_features = plan.features if isinstance(plan.features, dict) else plan.features.model_dump()

        if "points" in plan_features and plan_features["points"]:
            point_amount = plan_features["points"].get("amount", 0)

            if point_amount > 0:
                try:
                    # 포인트 적립
                    transaction_id, new_balance = await earn_points(
                        supabase=supabase,
                        user_id=UUID(profile_id),
                        amount=point_amount,
                        reason="subscription",
                        order_id=None,
                        expires_days=plan.duration_days  # 구독 기간만큼 유효
                    )
                    points_earned = point_amount
                    logger.info(f"구독 포인트 적립 성공: user_id={profile_id}, amount={point_amount}")
                except Exception as e:
                    logger.info(f"구독 포인트 적립 실패 (무시): {str(e)}")
                    # 포인트 적립 실패해도 구독은 성공으로 처리

        return {
            "success": True,
            "message": "구독이 완료되었습니다",
            "subscription": result.data[0],
            "payment": payment_data,
            "points_earned": points_earned,
            "point_transaction_id": transaction_id,
        }

    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        logger.info(f"Toss Payments API 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="결제 승인 중 오류가 발생했습니다")
    except Exception as e:
        logger.info(f"구독 처리 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"구독 처리 실패: {str(e)}")
