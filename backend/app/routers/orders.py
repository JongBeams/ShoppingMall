from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_middleware import get_current_user
from app.services.supabase import get_supabase_admin_client
from app.services.payments import process_payment_success, cancel_toss_payment
from app.services.points import cancel_points
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from uuid import UUID
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
    toss_order_id: Optional[str] = None  # 토스페이먼츠에서 전달한 orderId (nanoid)
    points_used: Optional[int] = 0  # 사용한 포인트


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

        # 주문 생성 (결제 대기 상태)
        # subtotal = 포인트 사용 전 상품 금액 + 배송비 (total_amount + points_used)
        subtotal_before_points = request.total_amount + (request.points_used or 0)

        # 배송비 계산: 시스템 설정에서 배송비 정책 조회
        product_total = sum(item.price * item.quantity for item in request.items)
        shipping_fee = 0

        try:
            settings_response = supabase.table("crm_system_settings").select("delivery_fee, free_delivery_threshold").limit(1).execute()
            if settings_response.data:
                settings = settings_response.data[0]
                delivery_fee = settings.get("delivery_fee", 3000)
                free_delivery_threshold = settings.get("free_delivery_threshold", 30000)
                shipping_fee = 0 if product_total >= free_delivery_threshold else delivery_fee
            else:
                # 설정이 없으면 기본값 사용
                shipping_fee = 0 if product_total >= 30000 else 3000
        except Exception as e:
            print(f"[WARNING] 배송비 설정 조회 실패, 기본값 사용: {str(e)}")
            shipping_fee = 0 if product_total >= 30000 else 3000

        order_data = {
            "buyer_id": user_id,  # user_id -> buyer_id
            "order_number": order_number,
            "toss_order_id": request.toss_order_id,  # 토스 orderId (nanoid) 저장
            "status": "pending",  # 결제 대기 상태
            "subtotal": subtotal_before_points,  # 포인트 사용 전 총 금액 (상품금액 + 배송비)
            "shipping_fee": shipping_fee,  # 배송비
            "tax": 0,
            "discount": 0,
            "points_used": request.points_used or 0,  # 사용한 포인트
            "total": request.total_amount,  # 최종 결제 금액 (포인트 차감 후)
            "shipping_address": {  # JSONB 형식으로 변경
                "recipient_name": request.recipient_name,
                "recipient_phone": request.recipient_phone,
                "postal_code": request.postal_code,
                "address": request.address,
                "address_detail": request.address_detail,
            },
            "notes": request.delivery_message,  # delivery_message -> notes
            "payment_method": request.payment_method,
            "payment_status": None,  # 결제 대기 (아직 결제되지 않음)
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

        # 재고 차감은 결제 승인 성공 시 수행 (process_payment_success에서 처리)

        return {
            "message": "주문이 생성되었습니다. 결제를 진행해주세요.",
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

        # 주문 아이템 먼저 조회 (권한 확인에 사용)
        order_items_response = (
            supabase.table("order_items")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )
        order_items = order_items_response.data or []

        # 본인 주문인지 확인 (구매자 또는 판매자)
        is_buyer = order["buyer_id"] == user_id
        is_seller_with_items = False
        seller_vendor_id = None

        # 구매자가 아닌 경우, 판매자 권한 확인
        if not is_buyer:
            user_type = current_user.get("user_type")

            if user_type == "seller":
                # 판매자의 vendor_id 조회
                vendor_response = (
                    supabase.table("vendors")
                    .select("id")
                    .eq("user_id", user_id)
                    .single()
                    .execute()
                )

                if vendor_response.data:
                    seller_vendor_id = vendor_response.data["id"]

                    # order_items 중 하나라도 이 판매자의 상품이 있는지 확인
                    for item in order_items:
                        if item.get("vendor_id") == seller_vendor_id:
                            is_seller_with_items = True
                            break

        # 구매자도 아니고 관련 판매자도 아닌 경우 403
        if not is_buyer and not is_seller_with_items:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 주문 또는 본인 상품이 포함된 주문만 조회할 수 있습니다."
            )

        # 판매자인 경우, 자신의 상품만 필터링
        if is_seller_with_items and seller_vendor_id:
            order_items = [item for item in order_items if item.get("vendor_id") == seller_vendor_id]

            # 필터링된 상품들의 총액 재계산
            try:
                filtered_total = 0
                for item in order_items:
                    subtotal = item.get("subtotal", 0)
                    if subtotal:
                        filtered_total += float(subtotal)
                order["total_amount"] = filtered_total
            except Exception as e:
                print(f"필터링된 총액 계산 오류: {str(e)}")
                # 오류 발생 시 원래 총액 유지

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

        # 디버깅: 주문 데이터 확인
        print(f"주문 ID: {order.get('id')}")
        print(f"payment_id: {order.get('payment_id')}")
        print(f"payment_status: {order.get('payment_status')}")
        print(f"toss_order_id: {order.get('toss_order_id')}")

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

        # 디버깅: 주문 취소 요청 정보
        print(f"=== 주문 취소 요청 ===")
        print(f"주문 ID: {order.get('id')}")
        print(f"주문 상태 (status): {order.get('status')}")
        print(f"결제 상태 (payment_status): {order.get('payment_status')}")
        print(f"payment_id: {order.get('payment_id')}")

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

        # 결제가 완료된 경우 토스페이먼츠 결제 취소 처리
        if order["status"] == "paid" and order.get("payment_id"):
            try:
                # 토스페이먼츠 결제 취소 API 호출
                cancel_result = await cancel_toss_payment(
                    payment_key=order["payment_id"],
                    cancel_amount=None  # 전액 취소
                )
                print(f"토스페이먼츠 결제 취소 성공: {cancel_result}")
            except HTTPException as e:
                # 결제 취소 실패 시 에러 반환
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"결제 취소 실패: {e.detail}"
                )

        # 주문 상태 변경
        supabase.table("orders").update({
            "status": "cancelled",
            "cancelled_at": datetime.now().isoformat(),
            "payment_status": "cancelled"  # 결제 상태도 cancelled로 변경
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

        # 사용했던 포인트 환원 (있다면)
        points_refunded = 0
        point_transaction_id = None

        try:
            point_transaction_id, new_balance = await cancel_points(
                supabase=supabase,
                user_id=UUID(user_id),
                order_id=UUID(order_id)
            )
            # 환원된 포인트 계산
            transaction_response = supabase.table("point_transactions").select("change_amount").eq("id", point_transaction_id).execute()
            if transaction_response.data:
                points_refunded = transaction_response.data[0]["change_amount"]
            print(f"✅ 주문 취소 포인트 환원 성공: user_id={user_id}, amount={points_refunded}, order_id={order_id}")
        except ValueError as e:
            # 사용한 포인트가 없는 경우 (정상)
            print(f"ℹ️ 주문 취소 포인트 환원 대상 없음: {str(e)}")
        except Exception as e:
            print(f"⚠️ 주문 취소 포인트 환원 실패 (무시): {str(e)}")

        return {
            "message": "주문이 취소되었습니다.",
            "order_id": order_id,
            "points_refunded": points_refunded,
            "point_transaction_id": point_transaction_id,
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

        # 배송완료 시 포인트 적립 (시스템 설정에서 조회)
        if request.status == "delivered" and old_status != "delivered":
            try:
                # 주문 정보 조회
                order_full = (
                    supabase.table("orders")
                    .select("user_id, final_amount, points_used")
                    .eq("id", order_id)
                    .single()
                    .execute()
                )

                if order_full.data:
                    user_id = order_full.data["user_id"]
                    final_amount = order_full.data["final_amount"]
                    points_used = order_full.data.get("points_used", 0)

                    # 시스템 설정에서 포인트 정책 조회
                    settings_response = supabase.table("crm_system_settings").select("point_enabled, point_rate").limit(1).execute()
                    if settings_response.data:
                        settings = settings_response.data[0]
                        if settings.get("point_enabled") and settings.get("point_rate", 0) > 0:
                            from app.services.points import add_points
                            point_rate = float(settings["point_rate"])
                            # 포인트 사용액을 제외한 실제 결제금액에 대해서만 적립
                            earn_amount = final_amount - points_used
                            points_to_earn = int(earn_amount * point_rate / 100)

                            if points_to_earn > 0:
                                await add_points(
                                    user_id=user_id,
                                    amount=points_to_earn,
                                    description=f"주문 적립 (주문번호: {order_id[:8]})"
                                )
                                print(f"[INFO] 구매확정 포인트 적립: {user_id} - {points_to_earn}P")
            except Exception as e:
                print(f"[WARNING] 구매확정 포인트 적립 실패 (무시): {str(e)}")

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




# ============================================
# PAYMENTS ENDPOINTS
# ============================================

class PaymentSuccessRequest(BaseModel):
    paymentKey: str
    orderId: str
    amount: int

@router.post("/success", summary="주문 결제 성공 처리")
async def success_payment(
    req: PaymentSuccessRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    결제 성공 시 토스페이먼츠 승인 + DB 업데이트

    - 토스 /v1/payments/confirm 호출
    - 금액 검증 (프론트/서버/토스 3중 검증)
    - orders 테이블에 payment_id, payment_status, paid_at 등 업데이트
    """
    result = await process_payment_success(
        payment_key=req.paymentKey,
        order_id=req.orderId,
        amount=req.amount,
        user_id=current_user["id"]
    )

    return result

#주문 결제 취소는 주문 취소 안에 포함 