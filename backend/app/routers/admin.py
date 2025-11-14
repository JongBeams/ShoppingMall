from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.services.supabase import get_supabase_admin_client
from app.services.email import send_otp_email
from app.services.otp_store import get_otp_store
from app.services.auth_middleware import get_current_admin
import bcrypt
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그인 중 오류가 발생했습니다: {str(e)}"
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