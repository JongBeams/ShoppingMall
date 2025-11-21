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

class SelectedOption(BaseModel):
    """선택된 옵션"""
    option_id: Optional[str] = None
    option_name: str
    value_id: Optional[str] = None
    value_name: str
    price: float = 0


class OrderItemRequest(BaseModel):
    """주문 아이템 요청"""
    product_id: str
    quantity: int
    price: float
    selected_options: Optional[List[dict]] = []


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

        # 주문 생성 (기존 DB 스키마에 맞춤)
        order_data = {
            "buyer_id": user_id,  # user_id -> buyer_id
            "order_number": order_number,
            "status": "paid",  # 주문과 동시에 결제 완료 처리
            "subtotal": request.total_amount,
            "shipping_fee": 0,
            "tax": 0,
            "discount": 0,
            "total": request.total_amount,  # total_amount -> total
            "shipping_address": {  # JSONB 형식으로 변경
                "recipient_name": request.recipient_name,
                "recipient_phone": request.recipient_phone,
                "postal_code": request.postal_code,
                "address": request.address,
                "address_detail": request.address_detail,
            },
            "notes": request.delivery_message,  # delivery_message -> notes
            "payment_method": request.payment_method,
            "payment_status": "completed",  # 결제 완료 상태로 변경
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
                .select("id, name, vendor_id")  # seller_id -> vendor_id
                .eq("id", item.product_id)
                .single()
                .execute()
            )

            product = product_response.data

            order_items.append({
                "order_id": order_id,
                "product_id": item.product_id,
                "product_name": product["name"],
                "vendor_id": product["vendor_id"],  # seller_id -> vendor_id
                "quantity": item.quantity,
                "price": item.price,
                "subtotal": item.price * item.quantity,  # total_price -> subtotal
                "commission_rate": 0.1,  # 10% 수수료
                "commission_amount": item.price * item.quantity * 0.1,
                "vendor_payout": item.price * item.quantity * 0.9,
                "status": "pending",
                "selected_options": item.selected_options or [],  # 선택 옵션 저장
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


@router.get("/admin/all", summary="[관리자] 전체 주문 목록 조회")
async def get_all_orders_admin(
    limit: int = 100,
    offset: int = 0
):
    """
    관리자용 전체 주문 목록을 조회합니다.
    """
    supabase = get_supabase_admin_client()

    try:
        # 전체 주문 조회
        orders_response = (
            supabase.table("orders")
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        orders = orders_response.data or []

        # 각 주문의 아이템 및 사용자 정보 조회
        for order in orders:
            # 주문 아이템 조회
            order_items_response = (
                supabase.table("order_items")
                .select("*")
                .eq("order_id", order["id"])
                .execute()
            )
            order_items = order_items_response.data or []

            # 각 아이템에 상품 이미지 추가
            for item in order_items:
                product_response = (
                    supabase.table("products")
                    .select("thumbnail_url")
                    .eq("id", item["product_id"])
                    .single()
                    .execute()
                )
                if product_response.data:
                    item["product_thumbnail"] = product_response.data.get("thumbnail_url")

            order["items"] = order_items

            # 사용자 정보 조회
            if order.get("buyer_id"):
                user_response = (
                    supabase.table("profiles")
                    .select("full_name, email")
                    .eq("id", order["buyer_id"])
                    .single()
                    .execute()
                )
                if user_response.data:
                    order["user_name"] = user_response.data.get("full_name")
                    order["user_email"] = user_response.data.get("email")

        return {
            "orders": orders,
            "count": len(orders)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 조회 중 오류가 발생했습니다: {str(e)}"
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
        # 주문 조회 (buyer_id 사용)
        orders_response = (
            supabase.table("orders")
            .select("*")
            .eq("buyer_id", user_id)  # user_id -> buyer_id
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        orders = orders_response.data or []

        # 각 주문의 아이템 조회 및 상품 이미지 추가
        for order in orders:
            order_items_response = (
                supabase.table("order_items")
                .select("*")
                .eq("order_id", order["id"])
                .execute()
            )
            order_items = order_items_response.data or []

            # 각 아이템에 상품 이미지 추가
            for item in order_items:
                product_response = (
                    supabase.table("products")
                    .select("thumbnail_url")
                    .eq("id", item["product_id"])
                    .single()
                    .execute()
                )
                if product_response.data:
                    item["product_thumbnail"] = product_response.data.get("thumbnail_url")

            order["items"] = order_items

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

        # 본인 주문인지 확인 (buyer_id 사용)
        if order["buyer_id"] != user_id:  # user_id -> buyer_id
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
        order_items = order_items_response.data or []

        # 각 아이템에 상품 이미지 추가
        for item in order_items:
            product_response = (
                supabase.table("products")
                .select("thumbnail_url")
                .eq("id", item["product_id"])
                .single()
                .execute()
            )
            if product_response.data:
                item["product_thumbnail"] = product_response.data.get("thumbnail_url")

        order["items"] = order_items

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

        # 본인 주문인지 확인 (buyer_id 사용)
        if order["buyer_id"] != user_id:  # user_id -> buyer_id
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


# ============================================
# ADMIN ENDPOINTS
# ============================================

class UpdateOrderStatusRequest(BaseModel):
    """주문 상태 변경 요청"""
    status: str  # paid, preparing, shipping, delivered, cancelled


@router.patch("/{order_id}/status", summary="[관리자] 주문 상태 변경")
async def update_order_status_admin(
    order_id: str,
    request: UpdateOrderStatusRequest
):
    """
    관리자가 주문 상태를 변경합니다.
    """
    supabase = get_supabase_admin_client()

    valid_statuses = ["paid", "shipping", "delivered", "cancelled"]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"유효하지 않은 상태입니다. ({', '.join(valid_statuses)})"
        )

    try:
        # 주문 존재 확인
        order_response = (
            supabase.table("orders")
            .select("id, status")
            .eq("id", order_id)
            .single()
            .execute()
        )

        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="주문을 찾을 수 없습니다."
            )

        old_status = order_response.data["status"]

        # 주문 상태 변경
        update_data = {"status": request.status}

        # 취소 시 취소 시간 기록
        if request.status == "cancelled" and old_status != "cancelled":
            update_data["cancelled_at"] = datetime.now().isoformat()

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

        supabase.table("orders").update(update_data).eq("id", order_id).execute()

        return {
            "message": "주문 상태가 변경되었습니다.",
            "order_id": order_id,
            "old_status": old_status,
            "new_status": request.status
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 상태 변경 중 오류가 발생했습니다: {str(e)}"
        )
