from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_middleware import get_current_user
from app.services.supabase import get_supabase_admin_client
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from uuid import UUID

router = APIRouter(prefix="/cart", tags=["cart"])


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class AddToCartRequest(BaseModel):
    """장바구니 담기 요청"""
    product_id: str
    quantity: int = 1


class UpdateCartItemRequest(BaseModel):
    """장바구니 수량 변경 요청"""
    quantity: int


class CartItemResponse(BaseModel):
    """장바구니 아이템 응답"""
    id: str
    product_id: str
    product_name: str
    product_price: Decimal
    product_thumbnail: Optional[str]
    quantity: int
    total_price: Decimal
    created_at: str


# ============================================
# CART ENDPOINTS
# ============================================

@router.get("", summary="장바구니 조회")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """
    로그인한 사용자의 장바구니를 조회합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        # 장바구니 아이템 조회
        cart_response = (
            supabase.table("cart_items")
            .select("id, product_id, quantity, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        cart_items = cart_response.data or []

        # 상품 정보 조회
        if not cart_items:
            return {"items": [], "total": 0, "count": 0}

        product_ids = [item["product_id"] for item in cart_items]
        products_response = (
            supabase.table("products")
            .select("id, name, price, thumbnail_url")
            .in_("id", product_ids)
            .execute()
        )

        # 상품 정보를 딕셔너리로 매핑
        products_map = {p["id"]: p for p in products_response.data or []}

        # 장바구니 아이템에 상품 정보 결합
        items = []
        total = 0

        for cart_item in cart_items:
            product = products_map.get(cart_item["product_id"])
            if not product:
                continue

            item_total = float(product["price"]) * cart_item["quantity"]
            total += item_total

            items.append({
                "id": cart_item["id"],
                "product_id": cart_item["product_id"],
                "product_name": product["name"],
                "product_price": float(product["price"]),
                "product_thumbnail": product.get("thumbnail_url"),
                "quantity": cart_item["quantity"],
                "total_price": item_total,
                "created_at": cart_item["created_at"]
            })

        return {
            "items": items,
            "total": total,
            "count": len(items)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"장바구니 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("", status_code=status.HTTP_201_CREATED, summary="장바구니 담기")
async def add_to_cart(
    request: AddToCartRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    상품을 장바구니에 담습니다.
    이미 담긴 상품이면 수량을 증가시킵니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    if request.quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="수량은 1개 이상이어야 합니다."
        )

    try:
        # 상품 존재 여부 및 재고 확인
        product_response = (
            supabase.table("products")
            .select("id, name, stock_quantity, is_active")
            .eq("id", request.product_id)
            .single()
            .execute()
        )

        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="상품을 찾을 수 없습니다."
            )

        product = product_response.data

        if not product["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="판매 중단된 상품입니다."
            )

        if product["stock_quantity"] < request.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"재고가 부족합니다. (현재 재고: {product['stock_quantity']}개)"
            )

        # 이미 장바구니에 있는지 확인
        existing_response = (
            supabase.table("cart_items")
            .select("id, quantity")
            .eq("user_id", user_id)
            .eq("product_id", request.product_id)
            .execute()
        )

        if existing_response.data:
            # 이미 있으면 수량 증가
            existing_item = existing_response.data[0]
            new_quantity = existing_item["quantity"] + request.quantity

            if product["stock_quantity"] < new_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"재고가 부족합니다. (현재 재고: {product['stock_quantity']}개, 장바구니: {existing_item['quantity']}개)"
                )

            update_response = (
                supabase.table("cart_items")
                .update({"quantity": new_quantity})
                .eq("id", existing_item["id"])
                .execute()
            )

            return {
                "message": "장바구니에 담긴 상품의 수량이 증가되었습니다.",
                "item_id": existing_item["id"],
                "quantity": new_quantity
            }
        else:
            # 새로 추가
            insert_response = (
                supabase.table("cart_items")
                .insert({
                    "user_id": user_id,
                    "product_id": request.product_id,
                    "quantity": request.quantity
                })
                .execute()
            )

            return {
                "message": "장바구니에 담겼습니다.",
                "item_id": insert_response.data[0]["id"],
                "quantity": request.quantity
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"장바구니 담기 중 오류가 발생했습니다: {str(e)}"
        )


@router.patch("/{item_id}", summary="장바구니 수량 변경")
async def update_cart_item(
    item_id: str,
    request: UpdateCartItemRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    장바구니 아이템의 수량을 변경합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    if request.quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="수량은 1개 이상이어야 합니다."
        )

    try:
        # 장바구니 아이템 조회
        cart_item_response = (
            supabase.table("cart_items")
            .select("id, user_id, product_id")
            .eq("id", item_id)
            .single()
            .execute()
        )

        if not cart_item_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="장바구니 아이템을 찾을 수 없습니다."
            )

        cart_item = cart_item_response.data

        # 소유권 확인
        if cart_item["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 장바구니만 수정할 수 있습니다."
            )

        # 상품 재고 확인
        product_response = (
            supabase.table("products")
            .select("stock_quantity")
            .eq("id", cart_item["product_id"])
            .single()
            .execute()
        )

        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="상품을 찾을 수 없습니다."
            )

        if product_response.data["stock_quantity"] < request.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"재고가 부족합니다. (현재 재고: {product_response.data['stock_quantity']}개)"
            )

        # 수량 변경
        update_response = (
            supabase.table("cart_items")
            .update({"quantity": request.quantity})
            .eq("id", item_id)
            .execute()
        )

        return {
            "message": "수량이 변경되었습니다.",
            "quantity": request.quantity
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"수량 변경 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/{item_id}", summary="장바구니 아이템 삭제")
async def delete_cart_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    장바구니에서 아이템을 삭제합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        # 장바구니 아이템 조회
        cart_item_response = (
            supabase.table("cart_items")
            .select("id, user_id")
            .eq("id", item_id)
            .single()
            .execute()
        )

        if not cart_item_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="장바구니 아이템을 찾을 수 없습니다."
            )

        # 소유권 확인
        if cart_item_response.data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 장바구니만 삭제할 수 있습니다."
            )

        # 삭제
        supabase.table("cart_items").delete().eq("id", item_id).execute()

        return {"message": "장바구니에서 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("", summary="장바구니 전체 비우기")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """
    장바구니를 전체 비웁니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        supabase.table("cart_items").delete().eq("user_id", user_id).execute()
        return {"message": "장바구니가 비워졌습니다."}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"장바구니 비우기 중 오류가 발생했습니다: {str(e)}"
        )
