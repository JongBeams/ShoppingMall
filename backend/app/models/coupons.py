from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from decimal import Decimal


# ============================================
# REQUEST MODELS
# ============================================

class CouponCreateRequest(BaseModel):
    """쿠폰 생성 요청 모델"""
    name: str = Field(..., min_length=1, max_length=200, description="쿠폰 이름(관리용)")
    code: Optional[str] = Field(None, max_length=50, description="공개/입력 코드")
    discount_type: Literal["percent", "fixed"] = Field(..., description="할인 타입: percent(%), fixed(정액)")
    discount_value: Decimal = Field(..., gt=0, description="할인율(%) 또는 정액")
    max_discount_amount: Optional[Decimal] = Field(None, ge=0, description="최대 할인 금액(%일 때 상한)")
    min_order_amount: Optional[Decimal] = Field(None, ge=0, description="최소 주문금액")
    validity_days: int = Field(..., gt=0, description="쿠폰 만료 기간(일 단위)")
    start_at: datetime = Field(..., description="유효 시작 시각")
    end_at: datetime = Field(..., description="유효 종료 시각")
    vendor_id: Optional[UUID] = Field(None, description="판매자(쿠폰 발급자) ID")

    @field_validator('discount_value')
    @classmethod
    def validate_discount_value(cls, v, info):
        """할인 값 검증"""
        discount_type = info.data.get('discount_type')
        if discount_type == 'percent' and (v <= 0 or v > 100):
            raise ValueError('Percent discount must be between 0 and 100')
        if discount_type == 'fixed' and v <= 0:
            raise ValueError('Fixed discount must be greater than 0')
        return v

    @field_validator('end_at')
    @classmethod
    def validate_end_at(cls, v, info):
        """종료 시각이 시작 시각보다 나중인지 검증"""
        start_at = info.data.get('start_at')
        if start_at and v <= start_at:
            raise ValueError('end_at must be after start_at')
        return v


class CouponUpdateRequest(BaseModel):
    """쿠폰 수정 요청 모델"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    discount_type: Optional[Literal["percent", "fixed"]] = None
    discount_value: Optional[Decimal] = Field(None, gt=0)
    max_discount_amount: Optional[Decimal] = Field(None, ge=0)
    min_order_amount: Optional[Decimal] = Field(None, ge=0)
    validity_days: Optional[int] = Field(None, gt=0)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    vendor_id: Optional[UUID] = None


class CouponFilterRequest(BaseModel):
    """쿠폰 필터 요청 모델"""
    vendor_id: Optional[UUID] = None
    discount_type: Optional[Literal["percent", "fixed"]] = None
    is_active: Optional[bool] = None  # 현재 유효한 쿠폰만 조회
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class UserCouponIssueRequest(BaseModel):
    """사용자 쿠폰 발급 요청 모델"""
    coupon_id: UUID = Field(..., description="쿠폰 ID")
    user_id: UUID = Field(..., description="사용자 ID")


class UserCouponUseRequest(BaseModel):
    """사용자 쿠폰 사용 요청 모델"""
    user_coupon_id: UUID = Field(..., description="발급된 쿠폰 ID")
    order_id: UUID = Field(..., description="주문 ID")
    discount_amount: Decimal = Field(..., ge=0, description="실제 할인 금액")


# ============================================
# RESPONSE MODELS
# ============================================

class CouponResponse(BaseModel):
    """쿠폰 응답 모델"""
    id: UUID
    name: str
    code: Optional[str]
    discount_type: str
    discount_value: Decimal
    max_discount_amount: Optional[Decimal]
    min_order_amount: Optional[Decimal]
    validity_days: int
    start_at: datetime
    end_at: datetime
    vendor_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CouponListResponse(BaseModel):
    """쿠폰 목록 응답 모델"""
    coupons: list[CouponResponse]
    total: int


class UserCouponResponse(BaseModel):
    """사용자 쿠폰 응답 모델"""
    id: UUID
    coupon_id: UUID
    user_id: UUID
    is_using: bool
    order_id: Optional[UUID]
    discount_amount: Optional[Decimal]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # 쿠폰 정보 포함
    coupon: Optional[CouponResponse] = None

    class Config:
        from_attributes = True


class UserCouponListResponse(BaseModel):
    """사용자 쿠폰 목록 응답 모델"""
    user_coupons: list[UserCouponResponse]
    total: int


class CouponIssueResponse(BaseModel):
    """쿠폰 발급 응답 모델"""
    success: bool
    message: str
    user_coupon: Optional[UserCouponResponse] = None


class CouponUseResponse(BaseModel):
    """쿠폰 사용 응답 모델"""
    success: bool
    message: str
    discount_amount: Optional[Decimal] = None
