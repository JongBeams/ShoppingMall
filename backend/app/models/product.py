from decimal import Decimal
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

    #상품명/URL용 슬러그
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)

    #설명
    description: Optional[str] = Field(..., min_length=20)

    #판매가,정가, 입고가
    price: Decimal = Field(..., gt=0)
    compare_at_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    
    #재고관리용 코드
    sku: Optional[str] = None
    #재고, 재고부족 기준 수량
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)

    #판매여부
    is_active :boolean = True
    is_featured :boolean = False



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