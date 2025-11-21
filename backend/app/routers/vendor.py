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
    rating: float
    review_count: int
    created_at: str


@router.get("/me", response_model=VendorResponse)
async def get_my_vendor_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 로그인한 판매자 정보 조회"""
    supabase = get_supabase_client()

    try:
        # Supabase 토큰으로 사용자 정보 가져오기
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = user_response.user.id

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
    """현재 로그인한 판매자 정보 업데이트"""
    supabase = get_supabase_client()

    try:
        # Supabase 토큰으로 사용자 정보 가져오기
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = user_response.user.id

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
    """스토어 로고 업로드"""
    supabase = get_supabase_client()

    try:
        # Supabase 토큰으로 사용자 정보 가져오기
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = user_response.user.id

        # 파일 읽기
        contents = await file.read()

        # Supabase Storage에 업로드
        file_path = f"store-logos/{user_id}/{file.filename}"
        storage_response = supabase.storage.from_("vendors").upload(
            file_path,
            contents,
            {"content-type": file.content_type}
        )

        # 업로드된 파일의 공개 URL 가져오기
        public_url = supabase.storage.from_("vendors").get_public_url(file_path)

        # vendors 테이블에 URL 업데이트
        update_response = supabase.table("vendors").update({
            "store_logo_url": public_url
        }).eq("user_id", user_id).execute()

        return {"message": "로고가 업로드되었습니다.", "url": public_url}

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
    """스토어 배너 업로드"""
    supabase = get_supabase_client()

    try:
        # Supabase 토큰으로 사용자 정보 가져오기
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )

        user_id = user_response.user.id

        # 파일 읽기
        contents = await file.read()

        # Supabase Storage에 업로드
        file_path = f"store-banners/{user_id}/{file.filename}"
        storage_response = supabase.storage.from_("vendors").upload(
            file_path,
            contents,
            {"content-type": file.content_type}
        )

        # 업로드된 파일의 공개 URL 가져오기
        public_url = supabase.storage.from_("vendors").get_public_url(file_path)

        # vendors 테이블에 URL 업데이트
        update_response = supabase.table("vendors").update({
            "store_banner_url": public_url
        }).eq("user_id", user_id).execute()

        return {"message": "배너가 업로드되었습니다.", "url": public_url}

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
