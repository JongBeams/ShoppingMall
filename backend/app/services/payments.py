import httpx
import os
import base64
from typing import Dict, Any
from fastapi import HTTPException, status
from app.services.supabase import get_supabase_admin_client
from dotenv import load_dotenv

# .env 파일 로드 (환경 변수 읽기 전 필수)
load_dotenv()

TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY")


async def confirm_toss_payment(payment_key: str, order_id: str, amount: int) -> Dict[str, Any]:
    """
    토스페이먼츠 결제 승인 API 호출

    Args:
        payment_key: 토스 결제 키
        order_id: 주문 번호 (orderId)
        amount: 결제 금액

    Returns:
        토스페이먼츠 응답 데이터

    Raises:
        HTTPException: 토스 API 호출 실패 시
    """
    if not TOSS_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TOSS_SECRET_KEY is not configured"
        )

    auth_header = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

    try:
        async with httpx.AsyncClient(base_url="https://api.tosspayments.com", timeout=10.0) as client:
            resp = await client.post(
                "/v1/payments/confirm",
                json={"paymentKey": payment_key, "orderId": order_id, "amount": amount},
                headers={"Authorization": f"Basic {auth_header}"}
            )

            if resp.status_code != 200:
                error_data = resp.json()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"토스 결제 승인 실패: {error_data.get('message', '알 수 없는 오류')}"
                )

            return resp.json()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="토스 결제 승인 요청 시간 초과"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"토스 결제 승인 요청 실패: {str(e)}"
        )


async def process_payment_success(
    payment_key: str,
    order_id: str,
    amount: int,
    user_id: str
) -> Dict[str, Any]:
    """
    결제 성공 처리: 토스 승인 + 금액 검증 + DB 업데이트

    Args:
        payment_key: 토스 결제 키 (paymentKey)
        order_id: 주문 번호 (orderId)
        amount: 프론트에서 전달받은 결제 금액
        user_id: 현재 로그인한 사용자 ID

    Returns:
        처리 결과 정보

    Raises:
        HTTPException: 처리 실패 시
    """
    supabase = get_supabase_admin_client()

    # 1. 주문 정보 조회 (toss_order_id로 검색)
    try:
        order_res = supabase.table("orders").select("*").eq("toss_order_id", order_id).single().execute()

        if not order_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="주문을 찾을 수 없습니다."
            )

        order = order_res.data

    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 조회 중 오류 발생: {str(e)}"
        )

    # 2. 권한 확인 (본인 주문인지)
    if order["buyer_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인의 주문만 결제할 수 있습니다."
        )

    # 3. 이미 결제 완료된 주문인지 확인
    if order.get("payment_status") == "completed" or order.get("payment_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 결제가 완료된 주문입니다."
        )

    # 4. 토스페이먼츠 결제 승인 호출
    toss_resp = await confirm_toss_payment(payment_key, order_id, amount)

    # 결제 승인 응답 (Payment 객체) 출력
    print("=" * 80)
    print("📦 토스페이먼츠 Payment 객체:")
    print("=" * 80)
    import json
    print(json.dumps(toss_resp, indent=2, ensure_ascii=False))
    print("=" * 80)
    print(f"✅ 결제수단 (method): {toss_resp.get('method')}")
    print(f"✅ 결제 상태 (status): {toss_resp.get('status')}")
    print(f"✅ 승인 시각 (approvedAt): {toss_resp.get('approvedAt')}")
    print(f"✅ 결제 금액 (totalAmount): {toss_resp.get('totalAmount')}")
    if toss_resp.get('card'):
        print(f"💳 카드 정보: {toss_resp.get('card')}")
    if toss_resp.get('easyPay'):
        print(f"💰 간편결제 정보: {toss_resp.get('easyPay')}")
    print("=" * 80)

    # 5. 금액 검증 (프론트 금액, 서버 주문 금액, 토스 응답 금액 일치 확인)
    server_amount = float(order["total"])
    toss_amount = float(toss_resp["totalAmount"])
    client_amount = float(amount)

    if not (abs(server_amount - toss_amount) < 0.01 and abs(client_amount - toss_amount) < 0.01):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"결제 금액 불일치 (서버: {server_amount}, 토스: {toss_amount}, 클라이언트: {client_amount})"
        )

    # 6. payment_status 매핑 (토스 status -> DB status)
    payment_status_map = {
        "DONE": "completed",
        "READY": "pending",
        "CANCELED": "cancelled",
        "ABORTED": "failed",
        "EXPIRED": "expired"
    }

    mapped_payment_status = payment_status_map.get(toss_resp["status"], toss_resp["status"].lower())

    # 7. DB 업데이트 (orders 테이블)
    try:
        update_data = {
            "payment_id": payment_key,
            "payment_status": mapped_payment_status,
            "payment_method": toss_resp.get("method"),
            "paid_at": toss_resp.get("approvedAt"),
            "status": "paid",
        }

        supabase.table("orders").update(update_data).eq("id", order["id"]).execute()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"결제 정보 업데이트 실패: {str(e)}"
        )

    # 8. 재고 차감 및 판매량 증가 (결제 승인 완료 후에만 실행)
    try:
        # 주문 아이템 조회
        order_items_response = (
            supabase.table("order_items")
            .select("product_id, quantity")
            .eq("order_id", order["id"])
            .execute()
        )

        for item in order_items_response.data or []:
            product_response = (
                supabase.table("products")
                .select("stock_quantity, sale_count")
                .eq("id", item["product_id"])
                .single()
                .execute()
            )

            if product_response.data:
                current_stock = product_response.data["stock_quantity"]
                current_sale_count = product_response.data.get("sale_count", 0) or 0
                new_stock = current_stock - item["quantity"]
                new_sale_count = current_sale_count + item["quantity"]

                supabase.table("products").update({
                    "stock_quantity": new_stock,
                    "sale_count": new_sale_count
                }).eq("id", item["product_id"]).execute()

    except Exception as e:
        # 재고 차감 실패 시 로그만 남기고 진행 (결제는 이미 완료됨)
        print(f"⚠️ 재고 차감 실패 (주문 ID: {order['id']}): {str(e)}")
        # 실패해도 결제는 완료된 상태이므로 에러를 발생시키지 않음

    # 9. 성공 응답 반환
    return {
        "message": "결제 승인이 완료되었습니다.",
        "order_id": order["id"],
        "order_number": order["order_number"],  # 실제 order_number 반환 (ORD-xxx 형식)
        "payment_key": payment_key,
        "payment_status": mapped_payment_status,
        "total_amount": toss_amount,
        "approved_at": toss_resp.get("approvedAt")
    }



#paymentkey로 결제 조회 테스트용 로직
import http.client

conn = http.client.HTTPSConnection("api.tosspayments.com")

headers = { 'Authorization': "Basic dGVzdF9za19lcVJHZ1lPMXI1NDZhSzZQeUdqNFZRbk4yRXlhOg==" }

conn.request("GET", "/v1/payments/5EnNZRJGvaBX7zk2yd8ydw26XvwXkLrx9POLqKQjmAw4b0e1", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
