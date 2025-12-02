from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ============================================
# REQUEST MODELS
# ============================================

class GiftWizardAnswers(BaseModel):
    """선물 마법사 질문 답변 모델"""
    relationship: str = Field(..., description="관계: 연인_남, 연인_여, 부모, 형제, 친구, 동료")
    gender: Optional[str] = Field(None, description="성별: male, female")
    age_range: str = Field(..., description="연령대: 20대, 30대, 40대, 50대+")
    style: str = Field(..., description="스타일: 미니멀, 화려한, 빈티지, 모던, 캐주얼")
    interests: Optional[List[str]] = Field(None, description="관심사: 운동, 독서, 게임, 여행, 요리, 음악, 패션")
    occasion: str = Field(..., description="목적: 생일, 기념일, 축하, 위로, 감사, 그냥")
    budget_min: int = Field(..., description="최소 예산")
    budget_max: int = Field(..., description="최대 예산")
    special_request: Optional[str] = Field(None, description="특별 요청: 각인, 실용적, 의미있는, 유니크한")
    user_id: Optional[str] = Field(None, description="로그인한 사용자 ID (선택)")


class GiftMessageRequest(BaseModel):
    """선물 메시지 생성 요청 모델"""
    product_id: str
    product_name: str
    relationship: str
    occasion: str
    tone: str = Field("감성적", description="톤: 감성적, 위트있는, 진지한")


# ============================================
# RESPONSE MODELS
# ============================================

class ProductRecommendation(BaseModel):
    """추천 상품 모델"""
    product_id: str
    product_name: str
    price: float
    image_url: Optional[str]
    rating: float
    review_count: int
    tags: Optional[List[str]]


class GiftRecommendationReason(BaseModel):
    """추천 이유 모델"""
    reason_1: str
    reason_2: str
    reason_3: str
    caution: Optional[str] = None


class GiftRecommendationResponse(BaseModel):
    """선물 추천 응답 모델"""
    rank: int
    product: ProductRecommendation
    reasons: GiftRecommendationReason
    gift_messages: List[str]
    packaging_tip: Optional[str] = None
    delivery_tip: Optional[str] = None


class GiftWizardResult(BaseModel):
    """선물 마법사 전체 결과 모델"""
    recommendations: List[GiftRecommendationResponse]
    overall_advice: str


class GiftHistoryResponse(BaseModel):
    """선물 히스토리 응답 모델"""
    id: str
    user_id: str
    recipient_relationship: str
    occasion: str
    product_id: str
    product_name: str
    product_image: Optional[str]
    price: float
    given_date: datetime
    created_at: datetime


class AnniversaryResponse(BaseModel):
    """기념일 응답 모델"""
    id: str
    user_id: str
    name: str
    date: str
    auto_remind: bool
    remind_days_before: int
    created_at: datetime
