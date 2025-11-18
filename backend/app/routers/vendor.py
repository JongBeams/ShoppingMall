from fastapi import APIRouter, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from typing import Optional
from app.services.supabase import get_supabase_client
from app.services.auth_middleware import get_current_user_from_token
import base64

router = APIRouter(prefix="/vendors", tags=["Vendors"])


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
async def get_my_vendor_info(token: str):
    """현재 로그인한 판매자 정보 조회"""
    supabase = get_supabase_client()

    try:
        # 토큰에서 사용자 정보 추출
        user = get_current_user_from_token(token)
        user_id = user["id"]

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
async def update_my_vendor_info(vendor_data: VendorUpdateRequest, token: str):
    """현재 로그인한 판매자 정보 업데이트"""
    supabase = get_supabase_client()

    try:
        # 토큰에서 사용자 정보 추출
        user = get_current_user_from_token(token)
        user_id = user["id"]

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
async def upload_store_logo(file: UploadFile, token: str):
    """스토어 로고 업로드"""
    supabase = get_supabase_client()

    try:
        # 토큰에서 사용자 정보 추출
        user = get_current_user_from_token(token)
        user_id = user["id"]

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
async def upload_store_banner(file: UploadFile, token: str):
    """스토어 배너 업로드"""
    supabase = get_supabase_client()

    try:
        # 토큰에서 사용자 정보 추출
        user = get_current_user_from_token(token)
        user_id = user["id"]

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
