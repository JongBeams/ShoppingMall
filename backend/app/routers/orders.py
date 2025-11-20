from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_middleware import get_current_user
from app.services.supabase import get_supabase_admin_client
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import uuid

router = APIRouter(prefix="/orders", tags=["orders"])


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class OrderItemRequest(BaseModel):
    """주문 아이템 요청"""
    product_id: str
    quantity: int
    price: float


class CreateOrderRequest(BaseModel):
    """주문 생성 요청"""
    items: List[OrderItemRequest]
    total_amount: float
    recipient_name: str
    recipient_phone: str
    postal_code: str
    address: str
    address_detail: Optional[str] = ""
    delivery_message: Optional[str] = ""
    payment_method: str  # card, bank, kakao, toss


class OrderResponse(BaseModel):
    """주문 응답"""
    id: str
    order_number: str
    status: str
    total_amount: float
    recipient_name: str
    recipient_phone: str
    address: str
    payment_method: str
    created_at: str


# ============================================
# ORDER ENDPOINTS
# ============================================

@router.post("", status_code=status.HTTP_201_CREATED, summary="주문 생성")
async def create_order(
    request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    새로운 주문을 생성합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    if not request.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="주문할 상품이 없습니다."
        )

    try:
        # 주문 번호 생성 (ORD-YYYYMMDD-UUID)
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        # 상품 재고 확인
        for item in request.items:
            product_response = (
                supabase.table("products")
                .select("id, name, stock_quantity, is_active")
                .eq("id", item.product_id)
                .single()
                .execute()
            )

            if not product_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"상품을 찾을 수 없습니다. (ID: {item.product_id})"
                )

            product = product_response.data

            if not product["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"판매 중단된 상품입니다. ({product['name']})"
                )

            if product["stock_quantity"] < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"재고가 부족합니다. ({product['name']}, 현재 재고: {product['stock_quantity']}개)"
                )

        # 주문 생성
        order_data = {
            "user_id": user_id,
            "order_number": order_number,
            "status": "pending",  # pending, paid, preparing, shipping, delivered, cancelled
            "total_amount": request.total_amount,
            "recipient_name": request.recipient_name,
            "recipient_phone": request.recipient_phone,
            "postal_code": request.postal_code,
            "address": request.address,
            "address_detail": request.address_detail,
            "delivery_message": request.delivery_message,
            "payment_method": request.payment_method,
            "payment_status": "pending",  # pending, completed, failed, refunded
        }

        order_response = (
            supabase.table("orders")
            .insert(order_data)
            .execute()
        )

        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="주문 생성에 실패했습니다."
            )

        order = order_response.data[0]
        order_id = order["id"]

        # 주문 아이템 생성
        order_items = []
        for item in request.items:
            # 상품 정보 다시 조회 (최신 정보)
            product_response = (
                supabase.table("products")
                .select("id, name, seller_id")
                .eq("id", item.product_id)
                .single()
                .execute()
            )

            product = product_response.data

            order_items.append({
                "order_id": order_id,
                "product_id": item.product_id,
                "product_name": product["name"],
                "seller_id": product["seller_id"],
                "quantity": item.quantity,
                "price": item.price,
                "total_price": item.price * item.quantity,
            })

        # 주문 아이템 일괄 삽입
        supabase.table("order_items").insert(order_items).execute()

        # 재고 차감
        for item in request.items:
            product_response = (
                supabase.table("products")
                .select("stock_quantity")
                .eq("id", item.product_id)
                .single()
                .execute()
            )

            current_stock = product_response.data["stock_quantity"]
            new_stock = current_stock - item.quantity

            supabase.table("products").update(
                {"stock_quantity": new_stock}
            ).eq("id", item.product_id).execute()

        return {
            "message": "주문이 완료되었습니다.",
            "order_id": order_id,
            "order_number": order_number,
            "total_amount": request.total_amount,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("", summary="내 주문 목록 조회")
async def get_my_orders(
    current_user: dict = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    로그인한 사용자의 주문 목록을 조회합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        # 주문 조회
        orders_response = (
            supabase.table("orders")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        orders = orders_response.data or []

        # 각 주문의 아이템 조회
        for order in orders:
            order_items_response = (
                supabase.table("order_items")
                .select("*")
                .eq("order_id", order["id"])
                .execute()
            )
            order["items"] = order_items_response.data or []

        return {
            "orders": orders,
            "count": len(orders)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/{order_id}", summary="주문 상세 조회")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    특정 주문의 상세 정보를 조회합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        # 주문 조회
        order_response = (
            supabase.table("orders")
            .select("*")
            .eq("id", order_id)
            .single()
            .execute()
        )

        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="주문을 찾을 수 없습니다."
            )

        order = order_response.data

        # 본인 주문인지 확인
        if order["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 주문만 조회할 수 있습니다."
            )

        # 주문 아이템 조회
        order_items_response = (
            supabase.table("order_items")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        order["items"] = order_items_response.data or []

        return order

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.patch("/{order_id}/cancel", summary="주문 취소")
async def cancel_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    주문을 취소합니다. (배송 준비 전까지만 가능)
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        # 주문 조회
        order_response = (
            supabase.table("orders")
            .select("*")
            .eq("id", order_id)
            .single()
            .execute()
        )

        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="주문을 찾을 수 없습니다."
            )

        order = order_response.data

        # 본인 주문인지 확인
        if order["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 주문만 취소할 수 있습니다."
            )

        # 취소 가능 상태 확인
        if order["status"] not in ["pending", "paid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="배송 준비 중이거나 배송 완료된 주문은 취소할 수 없습니다."
            )

        # 주문 상태 변경
        supabase.table("orders").update({
            "status": "cancelled",
            "cancelled_at": datetime.now().isoformat()
        }).eq("id", order_id).execute()

        # 재고 복구
        order_items_response = (
            supabase.table("order_items")
            .select("product_id, quantity")
            .eq("order_id", order_id)
            .execute()
        )

        for item in order_items_response.data or []:
            product_response = (
                supabase.table("products")
                .select("stock_quantity")
                .eq("id", item["product_id"])
                .single()
                .execute()
            )

            if product_response.data:
                current_stock = product_response.data["stock_quantity"]
                new_stock = current_stock + item["quantity"]

                supabase.table("products").update(
                    {"stock_quantity": new_stock}
                ).eq("id", item["product_id"]).execute()

        return {
            "message": "주문이 취소되었습니다.",
            "order_id": order_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 취소 중 오류가 발생했습니다: {str(e)}"
        )
