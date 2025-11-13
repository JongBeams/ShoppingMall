from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import re


# ============================================
# REQUEST MODELS
# ============================================

class UserRegisterRequest(BaseModel):
    """회원가입 요청 모델"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=1)
    user_type: Literal["buyer", "seller"] = "buyer"

    # 판매자 추가 정보
    business_name: Optional[str] = None
    business_number: Optional[str] = None
    business_address: Optional[str] = None
    store_name: Optional[str] = None
    store_description: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('비밀번호는 6자 이상이어야 합니다.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('비밀번호에 특수문자를 포함해야 합니다.')
        return v


class UserLoginRequest(BaseModel):
    """로그인 요청 모델"""
    email: EmailStr
    password: str


class SendOTPRequest(BaseModel):
    """OTP 전송 요청 모델"""
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    """OTP 검증 요청 모델"""
    email: EmailStr
    token: str = Field(..., min_length=6, max_length=6)


# ============================================
# RESPONSE MODELS
# ============================================

class ProfileResponse(BaseModel):
    """사용자 프로필 응답 모델"""
    id: str
    email: str
    full_name: str
    phone: str
    avatar_url: Optional[str]
    user_type: str
    created_at: datetime
    updated_at: datetime


class VendorResponse(BaseModel):
    """판매자 정보 응답 모델"""
    id: str
    user_id: str
    business_name: str
    business_number: str
    business_address: str
    store_name: str
    store_description: Optional[str]
    store_logo_url: Optional[str]
    store_banner_url: Optional[str]
    subscription_plan: str
    is_active: bool
    is_verified: bool
    rating: float
    review_count: int
    created_at: datetime


class AuthResponse(BaseModel):
    """인증 응답 모델"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str
    user: ProfileResponse
    vendor: Optional[VendorResponse] = None


class MessageResponse(BaseModel):
    """일반 메시지 응답 모델"""
    message: str
