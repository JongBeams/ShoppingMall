# -*- coding: utf-8 -*-
from pydantic import BaseModel, Field
from typing import Optional, Union, Literal
from datetime import datetime
from uuid import UUID


# 구매자용 Features 모델
class BuyerFeatures(BaseModel):
    points: dict[str, Union[int, str]] = Field(
        ...,
        description="포인트 정보: amount(양), cycle(발급 주기)"
    )
    shipping: str = Field(..., description="무료 배송 여부: free, paid")
    coupon_tier: str = Field(..., description="쿠폰 등급: basic, premium, vip")
    priority_delivery: bool = Field(..., description="우선 배송 여부")
    early_access: bool = Field(..., description="신상품/특가 우선 구매 여부")
    cs_level: Literal["standard", "priority"] = Field(..., description="CS 응대 레벨")
    event_invites: bool = Field(..., description="이벤트 참여 여부")


# 판매자용 Features 모델
class SellerFeatures(BaseModel):
    product_limit: Union[int, str] = Field(
        ...,
        description="등록 가능한 상품 수 한도 (숫자 또는 'unlimited')"
    )
    coupon_issue: bool = Field(..., description="쿠폰 발행 가능 여부")
    promo_slots: Union[int, str] = Field(
        ...,
        description="메인/추천 노출 슬롯 수 (숫자 또는 'unlimited')"
    )
    ads_included: Union[int, str] = Field(
        ...,
        description="메인 페이지 광고 포함 횟수 (숫자 또는 'unlimited')"
    )
    api_access: bool = Field(..., description="API 연동 지원 여부")
    cs_level: Literal["standard", "priority", "dedicated"] = Field(
        ...,
        description="CS 지원 레벨"
    )


# 구독 플랜 테이블 모델 (DB 읽기용)
class SubscriptionPlan(BaseModel):
    id: UUID
    name: str
    slug: Optional[str] = None
    price: float
    duration_days: int
    commission_discount: float = 0
    description: Optional[str] = None
    features: Union[BuyerFeatures, SellerFeatures]  # jsonb 필드
    is_active: bool = True
    is_buyer: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# API 응답용 모델 (간소화된 버전)
class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    price: float
    duration_days: int
    commission_discount: float = 0
    description: Optional[str] = None
    features: dict  # 프론트엔드로 그대로 전달
    is_active: bool = True
    is_buyer: bool = False


# 구독 플랜 목록 응답 모델
class SubscriptionPlansResponse(BaseModel):
    plans: list[SubscriptionPlanResponse]
    count: int
