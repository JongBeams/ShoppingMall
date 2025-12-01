from fastapi import APIRouter, HTTPException, status, File, UploadFile, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.services.supabase import get_supabase_client

router = APIRouter(prefix="/vendors", tags=["Vendors"])
security = HTTPBearer()


class VendorUpdateRequest(BaseModel):
    """판매자 정보 업데이트 요청"""
    store_name: Optional[str] = None
    store_description: Optional[str] = None


class VendorResponse(BaseModel):
    """판매자 정보 응답"""
    id: str
    user_id: str
    business_name: str
    business_number: str
    business_address: str
    store_name: str
    store_description: Optional[str]
    store_logo_url: Optional[str]
    store_banner_url: Optional[str]
    subscription_plan: str
    is_active: bool
    is_verified: bool
    approval_status: str  # pending, approved, rejected
    rating: float
    review_count: int
    created_at: str


@router.get("/me", response_model=VendorResponse)
async def get_my_vendor_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 로그인한 판매자 정보 조회 (승인 여부와 관계없이 조회 가능)"""
    from app.services.jwt_auth import verify_token
    from app.services.supabase import get_supabase_admin_client
    supabase = get_supabase_admin_client()

    try:
        # JWT 토큰 검증
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # vendors 테이블에서 판매자 정보 조회
        response = supabase.table("vendors").select("*").eq("user_id", user_id).single().execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )

        vendor = response.data

        return VendorResponse(
            id=vendor["id"],
            user_id=vendor["user_id"],
            business_name=vendor["business_name"],
            business_number=vendor["business_number"],
            business_address=vendor["business_address"],
            store_name=vendor["store_name"],
            store_description=vendor.get("store_description"),
            store_logo_url=vendor.get("store_logo_url"),
            store_banner_url=vendor.get("store_banner_url"),
            subscription_plan=vendor["subscription_plan"],
            is_active=vendor["is_active"],
            is_verified=vendor["is_verified"],
            approval_status=vendor.get("approval_status", "pending"),
            rating=float(vendor["rating"]),
            review_count=vendor["review_count"],
            created_at=vendor["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 판매자 정보 조회 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.put("/me", response_model=VendorResponse)
async def update_my_vendor_info(
    vendor_data: VendorUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """현재 로그인한 판매자 정보 업데이트 (승인 여부와 관계없이 수정 가능)"""
    from app.services.jwt_auth import verify_token
    from app.services.supabase import get_supabase_admin_client
    supabase = get_supabase_admin_client()

    try:
        # JWT 토큰 검증
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # 업데이트할 데이터 준비
        update_data = {}
        if vendor_data.store_name is not None:
            update_data["store_name"] = vendor_data.store_name
        if vendor_data.store_description is not None:
            update_data["store_description"] = vendor_data.store_description

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="업데이트할 정보가 없습니다."
            )

        # vendors 테이블 업데이트
        response = supabase.table("vendors").update(update_data).eq("user_id", user_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )

        vendor = response.data[0]

        return VendorResponse(
            id=vendor["id"],
            user_id=vendor["user_id"],
            business_name=vendor["business_name"],
            business_number=vendor["business_number"],
            business_address=vendor["business_address"],
            store_name=vendor["store_name"],
            store_description=vendor.get("store_description"),
            store_logo_url=vendor.get("store_logo_url"),
            store_banner_url=vendor.get("store_banner_url"),
            subscription_plan=vendor["subscription_plan"],
            is_active=vendor["is_active"],
            is_verified=vendor["is_verified"],
            approval_status=vendor.get("approval_status", "pending"),
            rating=float(vendor["rating"]),
            review_count=vendor["review_count"],
            created_at=vendor["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 판매자 정보 업데이트 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 정보 업데이트 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/me/upload-logo")
async def upload_store_logo(
    file: UploadFile,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """스토어 로고 업로드 (승인 여부와 관계없이 업로드 가능)"""
    from app.services.jwt_auth import verify_token
    from app.services.supabase import get_supabase_admin_client
    from uuid import uuid4
    from pathlib import Path

    supabase = get_supabase_admin_client()

    try:
        # JWT 토큰 검증
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # 파일 유효성 검사
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미지 파일만 업로드 가능합니다."
            )

        # 파일 읽기
        file_content = await file.read()

        # 파일 크기 제한 (5MB)
        max_size = 5 * 1024 * 1024
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="파일 크기는 5MB를 초과할 수 없습니다."
            )

        # 파일 확장자 추출
        filename = Path(file.filename or "logo.jpg")
        ext = filename.suffix if filename.suffix else ".jpg"

        # Storage 경로: store-logos/{user_id}/{uuid4()}{ext}
        storage_path = f"store-logos/{user_id}/{uuid4()}{ext}"

        # Supabase Storage에 업로드 (ProductImage 버킷 사용)
        upload_response = supabase.storage.from_("ProductImage").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # Public URL 생성
        public_url = supabase.storage.from_("ProductImage").get_public_url(storage_path)

        # vendors 테이블에 URL 업데이트
        update_response = supabase.table("vendors").update({
            "store_logo_url": public_url
        }).eq("user_id", user_id).execute()

        return {"message": "로고가 업로드되었습니다.", "url": public_url}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 로고 업로드 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로고 업로드 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/me/upload-banner")
async def upload_store_banner(
    file: UploadFile,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """스토어 배너 업로드 (승인 여부와 관계없이 업로드 가능)"""
    from app.services.jwt_auth import verify_token
    from app.services.supabase import get_supabase_admin_client
    from uuid import uuid4
    from pathlib import Path

    supabase = get_supabase_admin_client()

    try:
        # JWT 토큰 검증
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # 파일 유효성 검사
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미지 파일만 업로드 가능합니다."
            )

        # 파일 읽기
        file_content = await file.read()

        # 파일 크기 제한 (5MB)
        max_size = 5 * 1024 * 1024
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="파일 크기는 5MB를 초과할 수 없습니다."
            )

        # 파일 확장자 추출
        filename = Path(file.filename or "banner.jpg")
        ext = filename.suffix if filename.suffix else ".jpg"

        # Storage 경로: store-banners/{user_id}/{uuid4()}{ext}
        storage_path = f"store-banners/{user_id}/{uuid4()}{ext}"

        # Supabase Storage에 업로드 (ProductImage 버킷 사용)
        upload_response = supabase.storage.from_("ProductImage").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # Public URL 생성
        public_url = supabase.storage.from_("ProductImage").get_public_url(storage_path)

        # vendors 테이블에 URL 업데이트
        update_response = supabase.table("vendors").update({
            "store_banner_url": public_url
        }).eq("user_id", user_id).execute()

        return {"message": "배너가 업로드되었습니다.", "url": public_url}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 배너 업로드 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"배너 업로드 중 오류가 발생했습니다: {str(e)}"
        )


# ===== 특가/할인 관리 =====

class DiscountRequest(BaseModel):
    """할인 설정 요청"""
    product_ids: List[str]
    discount_percent: Optional[float] = None
    discount_price: Optional[float] = None
    discount_start: str
    discount_end: str


@router.post("/products/discount")
async def set_product_discount(
    discount_data: DiscountRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """상품에 할인 설정"""
    from app.services.jwt_auth import verify_token
    supabase = get_supabase_client()

    try:
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # vendor_id 조회
        vendor_response = supabase.table("vendors").select("id").eq("user_id", user_id).single().execute()
        if not vendor_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )
        vendor_id = vendor_response.data["id"]

        # 각 상품에 대해 할인 설정
        updated_count = 0
        for product_id in discount_data.product_ids:
            # 해당 상품이 본인 소유인지 확인
            product_response = supabase.table("products").select("id, price, vendor_id").eq("id", product_id).single().execute()
            if not product_response.data:
                continue
            if product_response.data["vendor_id"] != vendor_id:
                continue

            original_price = float(product_response.data["price"])

            # 할인가 계산
            if discount_data.discount_percent:
                discount_price = round(original_price * (1 - discount_data.discount_percent / 100))
            elif discount_data.discount_price:
                discount_price = discount_data.discount_price
            else:
                continue

            # 상품 업데이트
            supabase.table("products").update({
                "discount_price": discount_price,
                "discount_start": discount_data.discount_start,
                "discount_end": discount_data.discount_end,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", product_id).execute()

            updated_count += 1

        return {"message": f"{updated_count}개 상품에 할인이 적용되었습니다.", "updated_count": updated_count}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 할인 설정 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"할인 설정 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/products/{product_id}/discount")
async def remove_product_discount(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """상품 할인 해제"""
    from app.services.jwt_auth import verify_token
    supabase = get_supabase_client()

    try:
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # vendor_id 조회
        vendor_response = supabase.table("vendors").select("id").eq("user_id", user_id).single().execute()
        if not vendor_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )
        vendor_id = vendor_response.data["id"]

        # 해당 상품이 본인 소유인지 확인
        product_response = supabase.table("products").select("id, vendor_id").eq("id", product_id).single().execute()
        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="상품을 찾을 수 없습니다."
            )
        if product_response.data["vendor_id"] != vendor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인 상품만 수정할 수 있습니다."
            )

        # 할인 정보 초기화
        supabase.table("products").update({
            "discount_price": None,
            "discount_start": None,
            "discount_end": None,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", product_id).execute()

        return {"message": "할인이 해제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 할인 해제 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"할인 해제 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/orders")
async def get_vendor_orders(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """판매자의 주문 목록 조회"""
    from app.services.jwt_auth import verify_token
    from app.services.supabase import get_supabase_admin_client
    supabase = get_supabase_admin_client()

    try:
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = payload.get("sub")

        # vendor_id 조회
        vendor_response = supabase.table("vendors").select("id").eq("user_id", user_id).single().execute()
        if not vendor_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )
        vendor_id = vendor_response.data["id"]

        # vendor_id로 직접 주문 아이템 조회 (order_items에 vendor_id가 있음)
        order_items_response = supabase.table("order_items").select(
            "order_id, product_id, product_name, quantity, price, subtotal, products(thumbnail_url)"
        ).eq("vendor_id", vendor_id).execute()

        if not order_items_response.data:
            return {"orders": [], "count": 0}

        # 주문 ID 목록
        order_ids = list(set([item["order_id"] for item in order_items_response.data]))

        # 주문 정보 조회 (실제 컬럼: total, shipping_address(JSONB), notes)
        orders_response = supabase.table("orders").select(
            "id, buyer_id, order_number, status, total, shipping_address, notes, created_at, updated_at"
        ).in_("id", order_ids).order("created_at", desc=True).execute()

        # 주문별 아이템 매핑 (이미지 URL 추출)
        order_items_map = {}
        for item in order_items_response.data:
            if item["order_id"] not in order_items_map:
                order_items_map[item["order_id"]] = []
            # products 조인 데이터에서 이미지 URL 추출
            product_data = item.pop("products", None) or {}
            item["thumbnail_url"] = product_data.get("thumbnail_url")
            order_items_map[item["order_id"]].append(item)

        # 응답 데이터 구성 (프론트엔드에 맞게 변환)
        orders = []
        for order in (orders_response.data or []):
            shipping = order.get("shipping_address") or {}
            order_data = {
                "id": order["id"],
                "order_number": order.get("order_number"),
                "buyer_id": order["buyer_id"],
                "status": order["status"],
                "total_amount": order.get("total", 0),
                "recipient_name": shipping.get("recipient_name", ""),
                "recipient_phone": shipping.get("recipient_phone", ""),
                "address": shipping.get("address", ""),
                "address_detail": shipping.get("address_detail", ""),
                "delivery_message": order.get("notes", ""),
                "created_at": order["created_at"],
                "updated_at": order.get("updated_at"),
                "items": order_items_map.get(order["id"], [])
            }
            orders.append(order_data)

        return {"orders": orders, "count": len(orders)}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 판매자 주문 조회 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"주문 조회 중 오류가 발생했습니다: {str(e)}"
        )
