from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_middleware import get_current_user
from app.services.supabase import get_supabase_admin_client
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/cart", tags=["cart"])


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class SelectedOption(BaseModel):
    """선택된 옵션"""
    option_id: str
    value_id: str


class AddToCartRequest(BaseModel):
    """장바구니 담기 요청"""
    product_id: str
    quantity: int = 1
    selected_options: Optional[List[SelectedOption]] = None


class UpdateCartItemRequest(BaseModel):
    """장바구니 수량 변경 요청"""
    quantity: int


class SelectedOptionResponse(BaseModel):
    """선택된 옵션 응답"""
    option_id: str
    option_name: str
    value_id: str
    value_name: str
    price: float


class CartItemResponse(BaseModel):
    """장바구니 아이템 응답"""
    id: str
    product_id: str
    product_name: str
    product_price: Decimal
    product_thumbnail: Optional[str]
    vendor_id: Optional[str]
    quantity: int
    total_price: Decimal
    selected_options: Optional[List[SelectedOptionResponse]] = None
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
        # 장바구니 아이템 조회 (옵션 정보 포함)
        cart_response = (
            supabase.table("cart_items")
            .select("id, product_id, quantity, selected_options, created_at")
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
            .select("id, name, price, thumbnail_url, discount_price, discount_start, discount_end, vendor_id")
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

            # 할인 적용 여부 확인
            original_price = float(product["price"])
            discount_price = product.get("discount_price")
            discount_start = product.get("discount_start")
            discount_end = product.get("discount_end")

            is_on_sale = False
            if discount_price and discount_start and discount_end:
                now = datetime.now()
                start = datetime.fromisoformat(discount_start.replace('Z', '+00:00')) if isinstance(discount_start, str) else discount_start
                end = datetime.fromisoformat(discount_end.replace('Z', '+00:00')) if isinstance(discount_end, str) else discount_end
                if start.replace(tzinfo=None) <= now <= end.replace(tzinfo=None):
                    is_on_sale = True

            # 기본 가격 (할인 중이면 할인가 적용)
            base_price = float(discount_price) if is_on_sale else original_price
            option_total_price = 0

            # 선택된 옵션 정보 처리
            selected_options_data = []
            if cart_item.get("selected_options"):
                for option_info in cart_item["selected_options"]:
                    option_id = option_info.get("option_id")
                    value_id = option_info.get("value_id")

                    if option_id and value_id:
                        # 옵션 정보 조회
                        option_response = (
                            supabase.table("product_options")
                            .select("custom_type")
                            .eq("id", option_id)
                            .single()
                            .execute()
                        )

                        value_response = (
                            supabase.table("product_option_values")
                            .select("value, price")
                            .eq("id", value_id)
                            .single()
                            .execute()
                        )

                        if option_response.data and value_response.data:
                            option_price = float(value_response.data.get("price", 0))
                            option_total_price += option_price

                            selected_options_data.append({
                                "option_id": option_id,
                                "option_name": option_response.data["custom_type"],
                                "value_id": value_id,
                                "value_name": value_response.data["value"],
                                "price": option_price
                            })

            # 총 가격 = (상품 가격 + 옵션 가격) * 수량
            item_total = (base_price + option_total_price) * cart_item["quantity"]
            total += item_total

            items.append({
                "id": cart_item["id"],
                "product_id": cart_item["product_id"],
                "product_name": product["name"],
                "product_price": base_price,
                "product_original_price": original_price,
                "is_on_sale": is_on_sale,
                "product_thumbnail": product.get("thumbnail_url"),
                "vendor_id": product.get("vendor_id"),
                "quantity": cart_item["quantity"],
                "total_price": item_total,
                "selected_options": selected_options_data if selected_options_data else None,
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

        # 선택된 옵션을 JSONB 형태로 변환
        selected_options_json = None
        if request.selected_options:
            selected_options_json = [
                {"option_id": opt.option_id, "value_id": opt.value_id}
                for opt in request.selected_options
            ]

        # 이미 장바구니에 있는지 확인 (같은 상품 + 같은 옵션)
        existing_response = (
            supabase.table("cart_items")
            .select("id, quantity, selected_options")
            .eq("user_id", user_id)
            .eq("product_id", request.product_id)
            .execute()
        )

        # 같은 상품에 같은 옵션 조합이 있는지 확인
        existing_item = None
        if existing_response.data:
            for item in existing_response.data:
                # 옵션이 동일한지 비교
                if item.get("selected_options") == selected_options_json:
                    existing_item = item
                    break

        if existing_item:
            # 이미 있으면 수량 증가
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
            insert_data = {
                "user_id": user_id,
                "product_id": request.product_id,
                "quantity": request.quantity
            }

            # 옵션이 있으면 추가
            if selected_options_json:
                insert_data["selected_options"] = selected_options_json

            insert_response = (
                supabase.table("cart_items")
                .insert(insert_data)
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
