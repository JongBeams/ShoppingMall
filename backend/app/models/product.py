from decimal import Decimal
import string
from typing import Optional
from xmlrpc.client import boolean
from datetime import datetime
from uuid import UUID

#
from pydantic import BaseModel, Field


# ============================================
# REQUEST MODELS
# ============================================

class CreateProductRequset(BaseModel):
    """상품정보 요청 모델"""

    #상품명
    name: str = Field(..., min_length=1)

    #설명
    description: Optional[str] = Field(..., min_length=20)

    #판매가
    price: Decimal = Field(..., gt=0)

    #카테고리
    category:str

    #재고, 재고부족 기준 수량
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)

    #이미지 URL
    # image_url: Optional[str] = None




# ============================================
# RESPONSE MODELS
# ============================================

class CategoryResponse(BaseModel):
    """카테고리 응답 모델"""
    id: str
    name: str
    slug: str
    parent_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True