from decimal import Decimal
from typing import Optional
from datetime import datetime
from uuid import UUID

#
from pydantic import BaseModel, Field


# ============================================
# REQUEST MODELS
# ============================================

class ProductOptionValueRequest(BaseModel):
    """상품 옵션 값 요청 모델"""
    value: str = Field(..., min_length=1)
    price: str
    stock: str

class ProductOptionRequest(BaseModel):
    """상품 옵션 요청 모델"""
    customType: str = Field(..., min_length=1)
    values: list[ProductOptionValueRequest]

class CreateProductRequset(BaseModel):
    """상품정보 요청 모델"""
    #상품 ID값 -1일땐 신규 나머지 값은 조회 후 수정으로 진행
    id: Optional[str] = None

    #상품명
    name: str = Field(..., min_length=1)

    #간단설명 (meta_description)
    meta_description: str = Field(..., min_length=1, max_length=20)

    #설명
    description: Optional[str] = Field(..., min_length=20)

    #판매가
    price: Decimal = Field(..., gt=0)

    #카테고리
    category:str

    #재고, 재고부족 기준 수량
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)

    #이미지 URL (대표 이미지 - thumbnail_url에 저장됨)
    image_url: Optional[str] = None

    #추가 이미지 URLs (images JSONB에 배열로 저장됨)
    image_urls: Optional[list[str]] = None

    #해시태그
    tags: Optional[list[str]] = None

    #상품 옵션
    options: Optional[list[ProductOptionRequest]] = None




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


class ProductResponse(BaseModel):
    """상품 응답 모델"""
    id: UUID
    vendor_id: UUID
    category_id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    sku: Optional[str] = None
    stock_quantity: int
    low_stock_threshold: int
    images: Optional[dict] = None
    thumbnail_url: Optional[str] = None
    is_active: bool
    is_featured: bool
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    view_count: int
    sale_count: int
    rating: Decimal
    review_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



class VendorProductResponse(BaseModel):
    """판매자 상품 조회 응답 모델"""
    id: UUID
    name: str
    category_slug: str
    meta_description: Optional[str] = None
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    low_stock_threshold: int
    # Supabase JSONB 필드는 문자열이나 배열 모두 들어올 수 있으므로 넓게 허용
    images: Optional[list[str] | str] = None
    thumbnail_url: Optional[str] = None
    is_active: bool
    view_count: int
    sale_count: int
    rating: Decimal
    review_count: int
    tags: Optional[list[str]] = None
    options: Optional[list[dict]] = None
    created_at: datetime
    updated_at: datetime
    # 할인 관련 필드
    discount_price: Optional[Decimal] = None
    discount_start: Optional[datetime] = None
    discount_end: Optional[datetime] = None

    class Config:
        from_attributes = True
