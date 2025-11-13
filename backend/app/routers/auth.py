from fastapi import APIRouter, HTTPException, status
from app.models.user import (
    UserRegisterRequest,
    UserLoginRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    AuthResponse,
    ProfileResponse,
    VendorResponse,
    MessageResponse,
)
from app.services.supabase import get_supabase_client, get_supabase_admin_client
from app.services.email import send_otp_email
from datetime import datetime
import redis
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(request: SendOTPRequest):
    """이메일로 OTP 인증번호 전송"""
    supabase = get_supabase_client()
    supabase_admin = get_supabase_admin_client()

    try:
        # profiles 테이블에 이미 가입된 이메일인지 확인
        existing_user = supabase_admin.table("profiles").select("id").eq("email", request.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 이메일입니다."
            )

        # Auth에만 있고 profiles에 없는 경우 (미완료 회원가입) - Auth에서도 삭제
        try:
            auth_users = supabase_admin.auth.admin.list_users()
            for user in auth_users:
                if hasattr(user, 'email') and user.email == request.email:
                    print(f"[DEBUG] Auth에만 존재하는 사용자 삭제: {request.email}")
                    supabase_admin.auth.admin.delete_user(user.id)
        except Exception as e:
            print(f"[DEBUG] Auth 사용자 확인 중 오류 (무시): {str(e)}")

        # OTP 코드 생성
        import random
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        # Redis에 OTP 저장 (TTL: 5분)
        settings = get_settings()
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True
        )
        redis_client.setex(f"otp:{request.email}", 300, otp_code)  # 5분 TTL
        print(f"[OTP] {request.email} 인증번호 생성 및 Redis 저장: {otp_code}")

        # 이메일 발송
        await send_otp_email(request.email, otp_code)

        return MessageResponse(message=f"{request.email}로 인증번호가 전송되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] OTP 전송 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증번호 전송에 실패했습니다: {str(e)}"
        )


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(request: VerifyOTPRequest):
    """OTP 인증번호 확인"""
    try:
        # Redis에서 OTP 조회
        settings = get_settings()
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True
        )

        stored_otp = redis_client.get(f"otp:{request.email}")

        if not stored_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="인증번호가 만료되었거나 존재하지 않습니다."
            )

        if stored_otp != request.token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="인증번호가 올바르지 않습니다."
            )

        # 인증 성공 - OTP 삭제
        redis_client.delete(f"otp:{request.email}")
        print(f"[OTP] {request.email} 인증 성공")

        return MessageResponse(message="이메일 인증이 완료되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] OTP 검증 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증번호 확인에 실패했습니다. 올바른 인증번호를 입력하세요."
        )


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

        # 이메일 확인이 필요한 경우 (세션이 없음)
        if not auth_response.session:
            print(f"[DEBUG] 이메일 확인 필요 - 세션 없음")
            # profiles 테이블에는 저장하되, 토큰 없이 응답
            profile_data = {
                "id": user_id,
                "email": user_data.email,
                "full_name": user_data.full_name,
                "phone": user_data.phone,
                "user_type": user_data.user_type,
            }

            profile_response = supabase_admin.table("profiles").insert(profile_data).execute()

            if not profile_response.data:
                supabase_admin.auth.admin.delete_user(user_id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="프로필 생성에 실패했습니다."
                )

            # seller인 경우 vendors 테이블에도 저장
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
                    "is_active": False,
                    "is_verified": False,
                }

                supabase_admin.table("vendors").insert(vendor_data).execute()

            # 이메일 확인 메시지 반환
            raise HTTPException(
                status_code=status.HTTP_201_CREATED,
                detail="회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요."
            )

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
