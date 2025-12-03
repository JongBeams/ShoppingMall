from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class WishlistItemResponse(BaseModel):
    """찜 목록 아이템 응답"""
    id: str
    product_id: str
    product_name: str
    product_price: Decimal
    product_thumbnail: Optional[str]
    category: Optional[str]
    description: Optional[str]
    stock_quantity: int
    is_active: bool
    created_at: str


class WishlistCheckResponse(BaseModel):
    """찜 상태 확인 응답"""
    is_wishlisted: bool
    wishlist_item_id: Optional[str] = None


class AddToWishlistResponse(BaseModel):
    """찜 추가 응답"""
    message: str
    wishlist_item_id: str


class RemoveFromWishlistResponse(BaseModel):
    """찜 삭제 응답"""
    message: str
