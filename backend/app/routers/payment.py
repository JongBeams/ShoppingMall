from fastapi import APIRouter, HTTPException, status, Depends
from app.services.supabase import get_supabase_client
from app.services.auth_middleware import get_current_user
from app.models.payments import (
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodListResponse,
    RefundAccountCreate,
    RefundAccountResponse,
    RefundAccountListResponse,
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse,
)

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.get("/methods", response_model=PaymentMethodListResponse)
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """결제수단 목록 조회"""
    supabase = get_supabase_client()

    try:
        response = supabase.table("payment_methods").select("*").eq(
            "user_id", current_user["id"]
        ).order("created_at", desc=True).execute()

        return {"payment_methods": response.data or []}
    except Exception as e:
        print(f"[ERROR] 결제수단 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="결제수단 조회에 실패했습니다.")


@router.post("/methods", response_model=PaymentMethodResponse)
async def create_payment_method(
    data: PaymentMethodCreate,
    current_user: dict = Depends(get_current_user)
):
    """결제수단 추가"""
    supabase = get_supabase_client()

    try:
        # 마지막 4자리만 보이도록 마스킹
        card_number = data.card_number.replace(" ", "").replace("-", "")
        masked_number = f"**** **** **** {card_number[-4:]}"

        # 기본 결제수단으로 설정하면 기존 기본 해제
        if data.is_default:
            supabase.table("payment_methods").update({"is_default": False}).eq(
                "user_id", current_user["id"]
            ).execute()

        # 결제수단 추가
        response = supabase.table("payment_methods").insert({
            "user_id": current_user["id"],
            "card_company": data.card_company,
            "card_number": masked_number,
            "card_holder": data.card_holder,
            "expiry_date": data.expiry_date,
            "is_default": data.is_default
        }).execute()

        return response.data[0]
    except Exception as e:
        print(f"[ERROR] 결제수단 추가 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="결제수단 추가에 실패했습니다.")


@router.delete("/methods/{method_id}")
async def delete_payment_method(
    method_id: str,
    current_user: dict = Depends(get_current_user)
):
    """결제수단 삭제"""
    supabase = get_supabase_client()

    try:
        # 본인 것인지 확인
        check = supabase.table("payment_methods").select("id").eq(
            "id", method_id
        ).eq("user_id", current_user["id"]).execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="결제수단을 찾을 수 없습니다.")

        supabase.table("payment_methods").delete().eq("id", method_id).execute()

        return {"message": "결제수단이 삭제되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 결제수단 삭제 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="결제수단 삭제에 실패했습니다.")


@router.put("/methods/{method_id}/default")
async def set_default_payment_method(
    method_id: str,
    current_user: dict = Depends(get_current_user)
):
    """기본 결제수단 설정"""
    supabase = get_supabase_client()

    try:
        # 기존 기본 해제
        supabase.table("payment_methods").update({"is_default": False}).eq(
            "user_id", current_user["id"]
        ).execute()

        # 새 기본 설정
        supabase.table("payment_methods").update({"is_default": True}).eq(
            "id", method_id
        ).eq("user_id", current_user["id"]).execute()

        return {"message": "기본 결제수단이 설정되었습니다."}
    except Exception as e:
        print(f"[ERROR] 기본 결제수단 설정 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="기본 결제수단 설정에 실패했습니다.")


# ========== 환불계좌 ==========
@router.get("/refund-accounts", response_model=RefundAccountListResponse)
async def get_refund_accounts(current_user: dict = Depends(get_current_user)):
    """환불계좌 목록 조회"""
    supabase = get_supabase_client()

    try:
        response = supabase.table("refund_accounts").select("*").eq(
            "user_id", current_user["id"]
        ).order("created_at", desc=True).execute()

        return {"refund_accounts": response.data or []}
    except Exception as e:
        print(f"[ERROR] 환불계좌 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="환불계좌 조회에 실패했습니다.")


@router.post("/refund-accounts", response_model=RefundAccountResponse)
async def create_refund_account(
    data: RefundAccountCreate,
    current_user: dict = Depends(get_current_user)
):
    """환불계좌 추가"""
    supabase = get_supabase_client()

    try:
        # 기본 계좌로 설정하면 기존 기본 해제
        if data.is_default:
            supabase.table("refund_accounts").update({"is_default": False}).eq(
                "user_id", current_user["id"]
            ).execute()

        # 환불계좌 추가
        response = supabase.table("refund_accounts").insert({
            "user_id": current_user["id"],
            "bank_name": data.bank_name,
            "account_number": data.account_number,
            "account_holder": data.account_holder,
            "is_default": data.is_default
        }).execute()

        return response.data[0]
    except Exception as e:
        print(f"[ERROR] 환불계좌 추가 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="환불계좌 추가에 실패했습니다.")


@router.delete("/refund-accounts/{account_id}")
async def delete_refund_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """환불계좌 삭제"""
    supabase = get_supabase_client()

    try:
        # 본인 것인지 확인
        check = supabase.table("refund_accounts").select("id").eq(
            "id", account_id
        ).eq("user_id", current_user["id"]).execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="환불계좌를 찾을 수 없습니다.")

        supabase.table("refund_accounts").delete().eq("id", account_id).execute()

        return {"message": "환불계좌가 삭제되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 환불계좌 삭제 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="환불계좌 삭제에 실패했습니다.")


@router.put("/refund-accounts/{account_id}/default")
async def set_default_refund_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """기본 환불계좌 설정"""
    supabase = get_supabase_client()

    try:
        # 기존 기본 해제
        supabase.table("refund_accounts").update({"is_default": False}).eq(
            "user_id", current_user["id"]
        ).execute()

        # 새 기본 설정
        supabase.table("refund_accounts").update({"is_default": True}).eq(
            "id", account_id
        ).eq("user_id", current_user["id"]).execute()

        return {"message": "기본 환불계좌가 설정되었습니다."}
    except Exception as e:
        print(f"[ERROR] 기본 환불계좌 설정 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="기본 환불계좌 설정에 실패했습니다.")


# ========== 배송지 ==========
@router.get("/addresses", response_model=AddressListResponse)
async def get_addresses(current_user: dict = Depends(get_current_user)):
    """배송지 목록 조회"""
    supabase = get_supabase_client()

    try:
        response = supabase.table("delivery_addresses").select("*").eq(
            "user_id", current_user["id"]
        ).order("is_default", desc=True).order("created_at", desc=True).execute()

        return {"addresses": response.data or []}
    except Exception as e:
        print(f"[ERROR] 배송지 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="배송지 조회에 실패했습니다.")


@router.get("/addresses/default")
async def get_default_address(current_user: dict = Depends(get_current_user)):
    """기본 배송지 조회"""
    supabase = get_supabase_client()

    try:
        response = supabase.table("delivery_addresses").select("*").eq(
            "user_id", current_user["id"]
        ).eq("is_default", True).execute()

        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"[ERROR] 기본 배송지 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="기본 배송지 조회에 실패했습니다.")


@router.post("/addresses", response_model=AddressResponse)
async def create_address(
    data: AddressCreate,
    current_user: dict = Depends(get_current_user)
):
    """배송지 추가"""
    supabase = get_supabase_client()

    try:
        # 기본 배송지로 설정하면 기존 기본 해제
        if data.is_default:
            supabase.table("delivery_addresses").update({"is_default": False}).eq(
                "user_id", current_user["id"]
            ).execute()

        # 첫 번째 배송지면 자동으로 기본 설정
        existing = supabase.table("delivery_addresses").select("id").eq(
            "user_id", current_user["id"]
        ).execute()

        is_default = data.is_default or len(existing.data or []) == 0

        # 배송지 추가
        response = supabase.table("delivery_addresses").insert({
            "user_id": current_user["id"],
            "name": data.name,
            "recipient": data.recipient,
            "phone": data.phone,
            "postal_code": data.postal_code,
            "address": data.address,
            "detail_address": data.detail_address,
            "is_default": is_default
        }).execute()

        return response.data[0]
    except Exception as e:
        print(f"[ERROR] 배송지 추가 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="배송지 추가에 실패했습니다.")


@router.put("/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: str,
    data: AddressUpdate,
    current_user: dict = Depends(get_current_user)
):
    """배송지 수정"""
    supabase = get_supabase_client()

    try:
        # 본인 것인지 확인
        check = supabase.table("delivery_addresses").select("id").eq(
            "id", address_id
        ).eq("user_id", current_user["id"]).execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="배송지를 찾을 수 없습니다.")

        # 기본 배송지로 설정하면 기존 기본 해제
        if data.is_default:
            supabase.table("delivery_addresses").update({"is_default": False}).eq(
                "user_id", current_user["id"]
            ).execute()

        # 업데이트할 데이터만 추출
        update_data = {k: v for k, v in data.dict().items() if v is not None}

        response = supabase.table("delivery_addresses").update(update_data).eq(
            "id", address_id
        ).execute()

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 배송지 수정 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="배송지 수정에 실패했습니다.")


@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: str,
    current_user: dict = Depends(get_current_user)
):
    """배송지 삭제"""
    supabase = get_supabase_client()

    try:
        # 본인 것인지 확인
        check = supabase.table("delivery_addresses").select("id, is_default").eq(
            "id", address_id
        ).eq("user_id", current_user["id"]).execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="배송지를 찾을 수 없습니다.")

        was_default = check.data[0].get("is_default", False)

        supabase.table("delivery_addresses").delete().eq("id", address_id).execute()

        # 삭제한 게 기본 배송지였으면 다른 것을 기본으로
        if was_default:
            remaining = supabase.table("delivery_addresses").select("id").eq(
                "user_id", current_user["id"]
            ).order("created_at", desc=True).limit(1).execute()

            if remaining.data:
                supabase.table("delivery_addresses").update({"is_default": True}).eq(
                    "id", remaining.data[0]["id"]
                ).execute()

        return {"message": "배송지가 삭제되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 배송지 삭제 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="배송지 삭제에 실패했습니다.")


@router.put("/addresses/{address_id}/default")
async def set_default_address(
    address_id: str,
    current_user: dict = Depends(get_current_user)
):
    """기본 배송지 설정"""
    supabase = get_supabase_client()

    try:
        # 기존 기본 해제
        supabase.table("delivery_addresses").update({"is_default": False}).eq(
            "user_id", current_user["id"]
        ).execute()

        # 새 기본 설정
        supabase.table("delivery_addresses").update({"is_default": True}).eq(
            "id", address_id
        ).eq("user_id", current_user["id"]).execute()

        return {"message": "기본 배송지가 설정되었습니다."}
    except Exception as e:
        print(f"[ERROR] 기본 배송지 설정 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="기본 배송지 설정에 실패했습니다.")
