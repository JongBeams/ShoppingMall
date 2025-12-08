from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.services.jwt_auth import verify_token
from app.services.supabase import get_supabase_admin_client
import logging


logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    JWT 토큰을 검증하고 현재 관리자 정보를 반환하는 의존성

    Args:
        credentials: HTTP Authorization Bearer 토큰

    Returns:
        관리자 정보 딕셔너리

    Raises:
        HTTPException: 토큰이 유효하지 않거나 관리자가 아닌 경우
    """
    token = credentials.credentials

    # JWT 토큰 검증
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 관리자 타입 확인
    if payload.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 데이터베이스에서 관리자 정보 조회
    supabase_admin = get_supabase_admin_client()
    try:
        response = supabase_admin.table("admin_users").select("*").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="관리자를 찾을 수 없습니다.",
            )

        admin_user = response.data[0]

        # 활성화 상태 확인
        if not admin_user.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비활성화된 계정입니다.",
            )

        return admin_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"관리자 정보 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="관리자 정보 조회 중 오류가 발생했습니다.",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    JWT 토큰을 검증하고 현재 사용자 정보를 반환하는 의존성

    Args:
        credentials: HTTP Authorization Bearer 토큰

    Returns:
        사용자 정보 딕셔너리

    Raises:
        HTTPException: 토큰이 유효하지 않은 경우
    """
    token = credentials.credentials

    # JWT 토큰 검증
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 데이터베이스에서 사용자 정보 조회
    supabase_admin = get_supabase_admin_client()
    try:
        response = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다.",
            )

        user = response.data[0]

        # 활성화 상태 확인
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비활성화된 계정입니다. 관리자에게 문의해주세요. (wwhow2003@naver.com)",
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"[ERROR] 사용자 정보 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 정보 조회 중 오류가 발생했습니다.",
        )


async def get_optional_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """
    선택적으로 관리자 정보를 반환하는 의존성 (토큰이 없어도 에러를 발생시키지 않음)

    Args:
        credentials: HTTP Authorization Bearer 토큰 (선택)

    Returns:
        관리자 정보 딕셔너리 또는 None
    """
    if not credentials:
        return None

    try:
        return await get_current_admin(credentials)
    except HTTPException:
        return None
