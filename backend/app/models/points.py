# -*- coding: utf-8 -*-
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


# 포인트 트랜잭션 타입
ChangeType = Literal["earn", "use", "expire", "cancel", "adjust"]

# 포인트 적립/사용 사유
ReasonType = Literal[
    "order_reward",      # 주문 완료 적립
    "review",            # 리뷰 작성
    "photo_review",      # 포토 리뷰
    "referral",          # 친구 추천
    "subscription",      # 구독 포인트
    "payment_use",       # 결제 시 사용
    "expire_job",        # 자동 만료
    "order_cancel",      # 주문 취소 복구
    "admin_adjust"       # 관리자 조정
]


# DB 테이블 모델 (조회용)
class PointTransaction(BaseModel):
    id: UUID
    user_id: UUID
    order_id: Optional[UUID] = None
    change_amount: int
    balance_after: int
    change_type: ChangeType
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# 포인트 적립 요청
class PointEarnRequest(BaseModel):
    user_id: UUID
    change_amount: int = Field(..., gt=0, description="적립할 포인트 (양수)")
    reason: str = Field(..., description="적립 사유")
    order_id: Optional[UUID] = None
    expires_at: Optional[datetime] = None


# 포인트 사용 요청
class PointUseRequest(BaseModel):
    user_id: UUID
    change_amount: int = Field(..., gt=0, description="사용할 포인트 (양수로 입력, 내부에서 음수 처리)")
    reason: str = Field(default="payment_use", description="사용 사유")
    order_id: Optional[UUID] = None


# 포인트 취소 요청 (주문 취소 시)
class PointCancelRequest(BaseModel):
    user_id: UUID
    order_id: UUID
    reason: str = Field(default="order_cancel", description="취소 사유")


# 포인트 조정 요청 (관리자용)
class PointAdjustRequest(BaseModel):
    user_id: UUID
    change_amount: int = Field(..., description="조정할 포인트 (양수/음수)")
    reason: str = Field(default="admin_adjust", description="조정 사유")


# 포인트 잔액 응답
class PointBalanceResponse(BaseModel):
    user_id: UUID
    balance: int
    message: str = "포인트 잔액 조회 성공"


# 포인트 트랜잭션 응답 (단일)
class PointTransactionResponse(BaseModel):
    id: str
    user_id: str
    order_id: Optional[str] = None
    change_amount: int
    balance_after: int
    change_type: ChangeType
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


# 포인트 트랜잭션 목록 응답
class PointTransactionsResponse(BaseModel):
    transactions: list[PointTransactionResponse]
    total_count: int
    current_balance: int
    page: int
    limit: int


# 포인트 적립/사용 처리 응답
class PointOperationResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    balance_after: int
    change_amount: int


# 포인트 만료 예정 응답
class PointExpiringResponse(BaseModel):
    user_id: UUID
    expiring_points: int
    expires_at: datetime
    days_left: int
