from fastapi import APIRouter, HTTPException, status
from app.models.user import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    ProfileResponse,
    VendorResponse,
    MessageResponse,
)
from app.services.supabase import get_supabase_client, get_supabase_admin_client
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegisterRequest):
    """
    회원가입
    - buyer: 일반 회원
    - seller: 판매자 회원 (추가 정보 필요)
    """
    supabase = get_supabase_client()
    supabase_admin = get_supabase_admin_client()

    try:
        print(f"[DEBUG] 회원가입 요청: {user_data.email}, {user_data.user_type}")
        # 1. Supabase Auth에 사용자 등록
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="회원가입에 실패했습니다."
            )

        user_id = auth_response.user.id

        # 2. profiles 테이블에 사용자 정보 저장
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "user_type": user_data.user_type,
        }

        profile_response = supabase_admin.table("profiles").insert(profile_data).execute()

        if not profile_response.data:
            # profiles 생성 실패 시 auth 사용자도 삭제
            supabase_admin.auth.admin.delete_user(user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="프로필 생성에 실패했습니다."
            )

        profile = profile_response.data[0]

        # 3. seller인 경우 vendors 테이블에 판매자 정보 저장
        vendor = None
        if user_data.user_type == "seller":
            if not all([user_data.business_name, user_data.business_number,
                       user_data.business_address, user_data.store_name]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="판매자 회원가입에 필요한 정보가 부족합니다."
                )

            vendor_data = {
                "user_id": user_id,
                "business_name": user_data.business_name,
                "business_number": user_data.business_number,
                "business_address": user_data.business_address,
                "store_name": user_data.store_name,
                "store_description": user_data.store_description,
                "is_active": False,  # 관리자 승인 필요
                "is_verified": False,
            }

            vendor_response = supabase_admin.table("vendors").insert(vendor_data).execute()

            if not vendor_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="판매자 정보 생성에 실패했습니다."
                )

            vendor = vendor_response.data[0]

        # 4. 응답 생성
        profile_obj = ProfileResponse(
            id=profile["id"],
            email=profile["email"],
            full_name=profile["full_name"],
            phone=profile.get("phone"),
            avatar_url=profile.get("avatar_url"),
            user_type=profile["user_type"],
            created_at=profile["created_at"],
            updated_at=profile["updated_at"],
        )

        vendor_obj = None
        if vendor:
            vendor_obj = VendorResponse(
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

        return AuthResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            expires_in=auth_response.session.expires_in,
            user=profile_obj,
            vendor=vendor_obj,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 회원가입 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")

        # Rate limiting 에러 처리
        error_message = str(e)
        if "429" in error_message or "Too Many Requests" in error_message:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (10초 후)"
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원가입 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLoginRequest):
    """로그인"""
    supabase = get_supabase_client()

    try:
        # 1. Supabase Auth로 로그인
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )

        user_id = auth_response.user.id

        # 2. profiles 테이블에서 사용자 정보 조회
        profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자 정보를 찾을 수 없습니다."
            )

        profile = profile_response.data

        # 3. seller인 경우 vendors 테이블에서 판매자 정보 조회
        vendor = None
        if profile["user_type"] == "seller":
            vendor_response = supabase.table("vendors").select("*").eq("user_id", user_id).single().execute()
            if vendor_response.data:
                vendor = vendor_response.data

        # 4. 응답 생성
        profile_obj = ProfileResponse(
            id=profile["id"],
            email=profile["email"],
            full_name=profile["full_name"],
            phone=profile.get("phone"),
            avatar_url=profile.get("avatar_url"),
            user_type=profile["user_type"],
            created_at=profile["created_at"],
            updated_at=profile["updated_at"],
        )

        vendor_obj = None
        if vendor:
            vendor_obj = VendorResponse(
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

        return AuthResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            expires_in=auth_response.session.expires_in,
            user=profile_obj,
            vendor=vendor_obj,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그인 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """로그아웃"""
    supabase = get_supabase_client()

    try:
        supabase.auth.sign_out()
        return MessageResponse(message="로그아웃되었습니다.")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그아웃 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/me", response_model=ProfileResponse)
async def get_current_user():
    """현재 로그인한 사용자 정보 조회"""
    supabase = get_supabase_client()

    try:
        user = supabase.auth.get_user()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="인증되지 않은 사용자입니다."
            )

        # profiles 테이블에서 사용자 정보 조회
        profile_response = supabase.table("profiles").select("*").eq("id", user.user.id).single().execute()

        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자 정보를 찾을 수 없습니다."
            )

        profile = profile_response.data

        return ProfileResponse(
            id=profile["id"],
            email=profile["email"],
            full_name=profile["full_name"],
            phone=profile.get("phone"),
            avatar_url=profile.get("avatar_url"),
            user_type=profile["user_type"],
            created_at=profile["created_at"],
            updated_at=profile["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )
