from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


# ============================================
# REQUEST MODELS
# ============================================

class NotificationCreateRequest(BaseModel):
    """알림 생성 요청 모델 (내부용)"""
    user_id: UUID
    type: Literal["order", "shipment", "coupon", "event"]
    resource_id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=200)
    summary: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)
    expires_at: Optional[datetime] = None


class NotificationFilterRequest(BaseModel):
    """알림 필터 요청 모델"""
    type: Optional[Literal["order", "shipment", "coupon", "event"]] = None
    is_read: Optional[bool] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ============================================
# RESPONSE MODELS
# ============================================

class NotificationResponse(BaseModel):
    """알림 응답 모델"""
    id: UUID
    user_id: UUID
    type: str
    resource_id: Optional[UUID]
    title: str
    summary: str
    body: str
    is_read: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """알림 목록 응답 모델"""
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class NotificationUnreadCountResponse(BaseModel):
    """읽지 않은 알림 개수 응답 모델"""
    unread_count: int


class NotificationMarkReadResponse(BaseModel):
    """알림 읽음 처리 응답 모델"""
    success: bool
    message: str
