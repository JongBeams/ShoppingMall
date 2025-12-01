from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.services.supabase import get_supabase_admin_client
from app.services.email import send_otp_email, send_vendor_approval_email
from app.services.otp_store import get_otp_store
from app.services.auth_middleware import get_current_admin
import bcrypt
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

# Supabase 클라이언트 초기화
supabase = get_supabase_admin_client()


class AdminSendOTPRequest(BaseModel):
    email: EmailStr


class AdminVerifyOTPRequest(BaseModel):
    email: EmailStr
    token: str


class AdminRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: str


class AdminAuthResponse(BaseModel):
    access_token: str
    user: AdminResponse


class MessageResponse(BaseModel):
    message: str


@router.post("/send-otp", response_model=MessageResponse)
async def send_admin_otp(request: AdminSendOTPRequest):
    """관리자 이메일로 OTP 인증번호 전송 (일반/사업자 회원과 중복 가능)"""
    supabase_admin = get_supabase_admin_client()

    try:
        # admin_users 테이블에만 중복 체크
        existing_admin = supabase_admin.table("admin_users").select("id").eq("email", request.email).execute()
        if existing_admin.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 관리자 이메일입니다."
            )

        # OTP 코드 생성
        import random
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        # 메모리에 OTP 저장 (관리자용 prefix 추가)
        otp_store = get_otp_store()
        otp_store.set(f"admin:{request.email}", otp_code, ttl_seconds=300)
        print(f"[ADMIN OTP] {request.email} 인증번호 생성 및 저장: {otp_code}")

        # 이메일 발송
        await send_otp_email(request.email, otp_code)

        return MessageResponse(message=f"{request.email}로 인증번호가 전송되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 관리자 OTP 전송 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증번호 전송에 실패했습니다: {str(e)}"
        )


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_admin_otp(request: AdminVerifyOTPRequest):
    """관리자 OTP 인증번호 확인"""
    try:
        # 메모리에서 관리자용 OTP 조회
        otp_store = get_otp_store()
        stored_otp = otp_store.get(f"admin:{request.email}")

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
        otp_store.delete(f"admin:{request.email}")
        print(f"[ADMIN OTP] {request.email} 인증 성공")

        return MessageResponse(message="이메일 인증이 완료되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 관리자 OTP 검증 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증번호 확인에 실패했습니다. 올바른 인증번호를 입력하세요."
        )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(admin_data: AdminRegisterRequest):
    """관리자 회원가입"""
    supabase_admin = get_supabase_admin_client()

    try:
        # admin_users 테이블에 중복 확인
        existing_admin = supabase_admin.table("admin_users").select("id").eq("email", admin_data.email).execute()
        if existing_admin.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 관리자 이메일입니다."
            )

        # 비밀번호 해싱
        password_bytes = admin_data.password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

        # admin_users 테이블에 삽입
        admin_insert_data = {
            "email": admin_data.email,
            "password_hash": hashed_password,
            "full_name": admin_data.full_name,
            "phone": admin_data.phone,
            "role": "admin",
            "is_active": True,
        }

        response = supabase_admin.table("admin_users").insert(admin_insert_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="관리자 계정 생성에 실패했습니다."
            )

        return MessageResponse(message="관리자 계정이 생성되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 관리자 회원가입 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"관리자 회원가입 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/login", response_model=AdminAuthResponse)
async def login_admin(credentials: AdminLoginRequest):
    """관리자 로그인"""
    supabase_admin = get_supabase_admin_client()

    try:
        # admin_users 테이블에서 이메일로 조회
        response = supabase_admin.table("admin_users").select("*").eq("email", credentials.email).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )

        admin_user = response.data[0]

        # 비밀번호 검증
        password_bytes = credentials.password.encode('utf-8')
        stored_hash = admin_user["password_hash"].encode('utf-8')
        if not bcrypt.checkpw(password_bytes, stored_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )

        # is_active 확인
        if not admin_user.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비활성화된 계정입니다. 관리자에게 문의하세요."
            )

        # last_login_at 업데이트
        supabase_admin.table("admin_users").update({
            "last_login_at": datetime.utcnow().isoformat()
        }).eq("id", admin_user["id"]).execute()

        # JWT 토큰 생성
        from app.services.jwt_auth import create_access_token
        from datetime import timedelta

        token_data = {
            "sub": admin_user["id"],
            "email": admin_user["email"],
            "role": admin_user["role"],
            "type": "admin"
        }
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(hours=8)
        )

        admin_response = AdminResponse(
            id=admin_user["id"],
            email=admin_user["email"],
            full_name=admin_user["full_name"],
            phone=admin_user.get("phone"),
            role=admin_user["role"],
            is_active=admin_user["is_active"],
            created_at=admin_user["created_at"],
        )

        return AdminAuthResponse(
            access_token=access_token,
            user=admin_response
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 관리자 로그인 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")

        # bcrypt 에러 처리
        error_message = str(e).lower()
        if "invalid" in error_message or "password" in error_message or "hash" in error_message:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )


@router.get("/me", response_model=AdminResponse)
async def get_current_admin_info(current_admin: dict = Depends(get_current_admin)):
    """현재 로그인한 관리자 정보 조회"""
    return AdminResponse(
        id=current_admin["id"],
        email=current_admin["email"],
        full_name=current_admin["full_name"],
        phone=current_admin.get("phone"),
        role=current_admin["role"],
        is_active=current_admin["is_active"],
        created_at=current_admin["created_at"],
    )


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    user_type: str  # "buyer" or "seller"
    is_active: bool
    created_at: str
    vendor_status: Optional[str] = None  # "pending", "approved", "rejected"


class UsersListResponse(BaseModel):
    users: list[UserResponse]
    total: int


@router.get("/users", response_model=UsersListResponse)
async def get_users_list(current_admin: dict = Depends(get_current_admin)):
    """사용자 조회"""
    supabase_admin = get_supabase_admin_client()

    try:
        response = supabase_admin.table("profiles").select("*").order("created_at", desc=True).execute()

        if not response.data:
            return UsersListResponse(users=[], total=0)

        users_list = []
        for user in response.data:
            users_list.append(UserResponse(
                id=user["id"],
                email=user["email"],
                full_name=user["full_name"],
                phone=user.get("phone"),
                user_type=user["user_type"],
                is_active=user.get("is_active", True),
                created_at=user["created_at"],
                vendor_status=user.get("vendor_status") if user["user_type"] == "seller" else None
            ))

        return UsersListResponse(users=users_list, total=len(users_list))

    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


class UserDetailResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    user_type: str
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None
    vendor_status: Optional[str] = None
    address: Optional[str] = None
    business_number: Optional[str] = None
    store_name: Optional[str] = None


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(user_id: str, current_admin: dict = Depends(get_current_admin)):
    """사용자 상세 조회"""
    supabase_admin = get_supabase_admin_client()

    try:
        response = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다."
            )

        user = response.data[0]
        return UserDetailResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            phone=user.get("phone"),
            user_type=user["user_type"],
            is_active=user.get("is_active", True),
            created_at=user["created_at"],
            updated_at=user.get("updated_at"),
            vendor_status=user.get("vendor_status") if user["user_type"] == "seller" else None,
            address=user.get("address"),
            business_number=user.get("business_number"),
            store_name=user.get("store_name"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 조회 중 오류가 발생했습니다: {str(e)}"
        )


class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


@router.patch("/users/{user_id}", response_model=MessageResponse)
async def update_user(user_id: str, request: UserUpdateRequest, current_admin: dict = Depends(get_current_admin)):
    """사용자 정보 수정 (이메일, 전화번호)"""
    supabase_admin = get_supabase_admin_client()

    try:
        # 사용자 존재 확인
        existing = supabase_admin.table("profiles").select("id").eq("id", user_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다."
            )

        # 업데이트할 데이터 구성
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if request.email is not None:
            update_data["email"] = request.email
        if request.phone is not None:
            update_data["phone"] = request.phone

        # 정보 업데이트
        supabase_admin.table("profiles").update(update_data).eq("id", user_id).execute()

        return MessageResponse(message="사용자 정보가 수정되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 정보 수정 중 오류가 발생했습니다: {str(e)}"
        )


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}/status", response_model=MessageResponse)
async def update_user_status(user_id: str, request: UserStatusUpdateRequest, current_admin: dict = Depends(get_current_admin)):
    """사용자 활성화/비활성화"""
    supabase_admin = get_supabase_admin_client()

    try:
        # 사용자 존재 확인
        existing = supabase_admin.table("profiles").select("id").eq("id", user_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다."
            )

        # 상태 업데이트
        response = supabase_admin.table("profiles").update({
            "is_active": request.is_active,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        status_text = "활성화" if request.is_active else "비활성화"
        return MessageResponse(message=f"사용자가 {status_text}되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 상태 변경 중 오류가 발생했습니다: {str(e)}"
        )


# ========== 판매자 관리 ==========

@router.get("/vendors")
async def get_all_vendors(
    status: Optional[str] = None,  # pending, approved, rejected
    search: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """관리자용 - 전체 판매자 목록 조회"""
    try:
        # 기본 쿼리
        query = supabase.table("vendors").select(
            "id, user_id, business_name, business_number, owner_name, "
            "phone, email, category, approval_status, created_at, updated_at, "
            "approved_at, rejected_at, rejection_reason, "
            "store_name, store_logo_url, store_banner_url"
        )

        # 상태 필터
        if status:
            query = query.eq("approval_status", status)

        # 검색 필터 (상호명, 대표자명, 사업자번호)
        if search:
            query = query.or_(
                f"business_name.ilike.%{search}%,"
                f"owner_name.ilike.%{search}%,"
                f"business_number.ilike.%{search}%"
            )

        # 최신순 정렬
        query = query.order("created_at", desc=True)

        response = query.execute()
        return response.data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.patch("/vendors/{vendor_id}/approve")
async def approve_vendor(
    vendor_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """판매자 승인"""
    try:
        # 판매자 존재 확인
        vendor_response = supabase.table("vendors").select("*").eq("id", vendor_id).execute()

        if not vendor_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자를 찾을 수 없습니다."
            )

        vendor = vendor_response.data[0]

        # 이미 승인된 경우
        if vendor["approval_status"] == "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 승인된 판매자입니다."
            )

        # 승인 처리
        from datetime import datetime, timezone
        update_response = supabase.table("vendors").update({
            "approval_status": "approved",
            "is_active": True,  # 승인 시 활성화
            "is_verified": True,  # 승인 시 검증됨으로 표시
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "rejected_at": None,
            "rejection_reason": None
        }).eq("id", vendor_id).execute()

        # 승인 완료 이메일 발송
        try:
            if vendor.get("email") and vendor.get("owner_name"):
                await send_vendor_approval_email(
                    to_email=vendor["email"],
                    vendor_name=vendor["owner_name"]
                )
                print(f"[INFO] 판매자 승인 이메일 발송 완료: {vendor['email']}")
        except Exception as e:
            print(f"[ERROR] 판매자 승인 이메일 발송 실패: {str(e)}")
            # 이메일 실패해도 승인은 진행

        return MessageResponse(message="판매자가 승인되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 승인 중 오류가 발생했습니다: {str(e)}"
        )


@router.patch("/vendors/{vendor_id}/reject")
async def reject_vendor(
    vendor_id: str,
    rejection_reason: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """판매자 반려"""
    try:
        # 판매자 존재 확인
        vendor_response = supabase.table("vendors").select("*").eq("id", vendor_id).execute()

        if not vendor_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자를 찾을 수 없습니다."
            )

        vendor = vendor_response.data[0]

        # 이미 반려된 경우
        if vendor["approval_status"] == "rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 반려된 판매자입니다."
            )

        # 반려 처리
        from datetime import datetime, timezone
        update_response = supabase.table("vendors").update({
            "approval_status": "rejected",
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "approved_at": None,
            "rejection_reason": rejection_reason
        }).eq("id", vendor_id).execute()

        return MessageResponse(message="판매자 신청이 반려되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 반려 중 오류가 발생했습니다: {str(e)}"
        )


@router.patch("/vendors/{vendor_id}/cancel-approval")
async def cancel_vendor_approval(
    vendor_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """판매자 승인 취소"""
    try:
        # 판매자 존재 확인
        vendor_response = supabase.table("vendors").select("*").eq("id", vendor_id).execute()

        if not vendor_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자를 찾을 수 없습니다."
            )

        vendor = vendor_response.data[0]

        # 승인된 상태가 아닌 경우
        if vendor["approval_status"] != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="승인된 판매자만 승인 취소할 수 있습니다."
            )

        # 승인 취소 처리 - pending 상태로 되돌림
        update_response = supabase.table("vendors").update({
            "approval_status": "pending",
            "is_active": False,
            "is_verified": False,
            "approved_at": None
        }).eq("id", vendor_id).execute()

        return MessageResponse(message="판매자 승인이 취소되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 승인 취소 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/vendors/migrate-existing")
async def migrate_existing_vendors(
    current_admin: dict = Depends(get_current_admin)
):
    """기존 판매자 데이터 마이그레이션 (1회성 실행용)"""
    try:
        # 모든 vendors 조회
        vendors_response = supabase.table("vendors").select("*").execute()

        if not vendors_response.data:
            return MessageResponse(message="마이그레이션할 판매자가 없습니다.")

        updated_count = 0

        for vendor in vendors_response.data:
            # 이미 업데이트된 경우 스킵
            if vendor.get("approval_status") and vendor.get("email"):
                continue

            # profiles에서 사용자 정보 조회
            profile_response = supabase.table("profiles").select("*").eq("id", vendor["user_id"]).execute()

            if not profile_response.data:
                continue

            profile = profile_response.data[0]

            # 업데이트할 데이터
            update_data = {
                "owner_name": profile.get("full_name"),
                "phone": profile.get("phone"),
                "email": profile.get("email"),
                "approval_status": "approved" if vendor.get("is_active") else "pending",
            }

            # 승인된 경우 approved_at 설정
            if update_data["approval_status"] == "approved" and not vendor.get("approved_at"):
                from datetime import datetime, timezone
                update_data["approved_at"] = datetime.now(timezone.utc).isoformat()

            # 업데이트 실행
            supabase.table("vendors").update(update_data).eq("id", vendor["id"]).execute()
            updated_count += 1

        return MessageResponse(message=f"{updated_count}개 판매자 데이터가 업데이트되었습니다.")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"마이그레이션 중 오류가 발생했습니다: {str(e)}"
        )