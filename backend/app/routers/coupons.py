"""
쿠폰 관리 라우터
"""
from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
from typing import Optional, Literal
from app.models.coupons import (
    CouponCreateRequest,
    CouponUpdateRequest,
    CouponResponse,
    CouponListResponse,
    UserCouponResponse,
    UserCouponListResponse,
    CouponIssueResponse,
    CouponUseResponse,
    UserCouponIssueRequest,
    UserCouponUseRequest
)
from app.services.coupons import get_coupon_service
from app.services.auth_middleware import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coupons", tags=["Coupons"])


# ============================================
# 쿠폰 관리 API (관리자용)
# ============================================

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_data: CouponCreateRequest,
    auto_issue_to_all: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 생성 (관리자/판매자 전용)

    **Request Body:**
    - name: 쿠폰 이름 (관리용)
    - code: 공개/입력 코드 (선택, 비워두면 자동 생성)
    - discount_type: 할인 타입 (percent/fixed)
    - discount_value: 할인율(%) 또는 정액
    - max_discount_amount: 최대 할인 금액 (선택, percent일 때 상한)
    - min_order_amount: 최소 주문금액 (선택)
    - validity_days: 쿠폰 만료 기간(일 단위)
    - start_at: 유효 시작 시각
    - end_at: 유효 종료 시각
    - vendor_id: 판매자 ID (선택)

    **Query Parameters:**
    - auto_issue_to_all: true일 경우 모든 구매자에게 자동 발급 (기본: false)

    **Returns:**
    - 생성된 쿠폰 정보 (code 포함)
    """
    try:
        # TODO: 관리자 권한 확인 (현재는 로그인 사용자만 확인)
        # if current_user.get("role") != "admin":
        #     raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

        logger.info(f"쿠폰 생성 요청 - auto_issue_to_all: {auto_issue_to_all}, 쿠폰명: {coupon_data.name}")

        coupon_service = get_coupon_service()
        return await coupon_service.create_coupon(coupon_data, auto_issue_to_all=auto_issue_to_all)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"쿠폰 생성 실패: {str(e)}")
        if "이미 존재합니다" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("", response_model=CouponListResponse)
async def get_coupons(
    vendor_id: Optional[str] = None,
    discount_type: Optional[Literal["percent", "fixed"]] = None,
    is_active: Optional[bool] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 목록 조회

    **Query Parameters:**
    - vendor_id: 판매자 ID 필터 (선택)
    - discount_type: 할인 타입 필터 (percent/fixed, 선택)
    - is_active: 현재 유효한 쿠폰만 조회 (선택)
    - limit: 페이지당 개수 (기본: 20, 최대: 100)
    - offset: 오프셋 (기본: 0)

    **Returns:**
    - coupons: 쿠폰 목록
    - total: 전체 쿠폰 개수
    """
    try:
        coupon_service = get_coupon_service()

        vendor_uuid = UUID(vendor_id) if vendor_id else None

        return await coupon_service.get_coupons(
            vendor_id=vendor_uuid,
            discount_type=discount_type,
            is_active=is_active,
            limit=min(limit, 100),
            offset=offset
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"쿠폰 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="쿠폰 목록 조회 중 오류가 발생했습니다."
        )


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 상세 조회

    **Path Parameters:**
    - coupon_id: 쿠폰 ID

    **Returns:**
    - 쿠폰 상세 정보
    """
    try:
        coupon_service = get_coupon_service()
        return await coupon_service.get_coupon_by_id(UUID(coupon_id))

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 쿠폰 ID 형식입니다."
        )
    except Exception as e:
        logger.error(f"쿠폰 조회 실패: {str(e)}")
        if "찾을 수 없습니다" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="쿠폰 조회 중 오류가 발생했습니다."
        )


@router.get("/{coupon_id}/stats")
async def get_coupon_stats(
    coupon_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 사용 통계 조회

    **Path Parameters:**
    - coupon_id: 쿠폰 ID

    **Returns:**
    - total: 총 발급된 쿠폰 수
    - unused: 사용되지 않은 쿠폰 수 (is_using = false)
    - used: 사용된 쿠폰 수 (is_using = true)
    """
    try:
        coupon_service = get_coupon_service()
        return await coupon_service.get_coupon_stats(UUID(coupon_id))

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 쿠폰 ID 형식입니다."
        )
    except Exception as e:
        logger.error(f"쿠폰 통계 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="쿠폰 통계 조회 중 오류가 발생했습니다."
        )


@router.get("/code/{code}", response_model=CouponResponse)
async def get_coupon_by_code(
    code: str,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 코드로 쿠폰 조회

    **Path Parameters:**
    - code: 쿠폰 코드

    **Returns:**
    - 쿠폰 정보
    """
    try:
        coupon_service = get_coupon_service()
        return await coupon_service.get_coupon_by_code(code)

    except Exception as e:
        logger.error(f"쿠폰 코드 조회 실패: {str(e)}")
        if "찾을 수 없습니다" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="쿠폰 조회 중 오류가 발생했습니다."
        )


@router.patch("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    update_data: CouponUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 정보 수정 (관리자 전용)

    **Path Parameters:**
    - coupon_id: 쿠폰 ID

    **Request Body:**
    - 수정할 필드만 포함 (모든 필드 선택 사항)

    **Returns:**
    - 수정된 쿠폰 정보
    """
    try:
        # TODO: 관리자 권한 확인
        coupon_service = get_coupon_service()
        return await coupon_service.update_coupon(UUID(coupon_id), update_data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"쿠폰 수정 실패: {str(e)}")
        if "이미 존재합니다" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 수정 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 삭제 (관리자 전용)

    **Path Parameters:**
    - coupon_id: 쿠폰 ID

    **Returns:**
    - success: 삭제 성공 여부
    - message: 결과 메시지
    """
    try:
        # TODO: 관리자 권한 확인
        coupon_service = get_coupon_service()
        await coupon_service.delete_coupon(UUID(coupon_id))

        return {
            "success": True,
            "message": "쿠폰이 삭제되었습니다."
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 쿠폰 ID 형식입니다."
        )
    except Exception as e:
        logger.error(f"쿠폰 삭제 실패: {str(e)}")
        if "발급된 쿠폰" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 삭제 중 오류가 발생했습니다: {str(e)}"
        )


# ============================================
# 사용자 쿠폰 API
# ============================================

@router.post("/issue", response_model=CouponIssueResponse)
async def issue_coupon(
    issue_data: UserCouponIssueRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    사용자에게 쿠폰 발급

    **Request Body:**
    - coupon_id: 쿠폰 ID
    - user_id: 사용자 ID

    **Returns:**
    - success: 발급 성공 여부
    - message: 결과 메시지
    - user_coupon: 발급된 쿠폰 정보
    """
    try:
        # TODO: 관리자 권한 확인 또는 본인 확인
        coupon_service = get_coupon_service()
        return await coupon_service.issue_coupon(
            coupon_id=issue_data.coupon_id,
            user_id=issue_data.user_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"쿠폰 발급 실패: {str(e)}")
        if "사용할 수 없는" in str(e) or "만료된" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 발급 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/user/my-coupons", response_model=UserCouponListResponse)
async def get_my_coupons(
    is_using: Optional[bool] = None,
    include_expired: bool = False,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    내 쿠폰 목록 조회

    **Query Parameters:**
    - is_using: 사용 여부 필터 (선택)
    - include_expired: 만료된 쿠폰 포함 여부 (기본: false)
    - limit: 페이지당 개수 (기본: 20, 최대: 100)
    - offset: 오프셋 (기본: 0)

    **Returns:**
    - user_coupons: 사용자 쿠폰 목록 (쿠폰 정보 포함)
    - total: 전체 개수
    """
    try:
        user_id = UUID(current_user["id"])
        coupon_service = get_coupon_service()

        return await coupon_service.get_user_coupons(
            user_id=user_id,
            is_using=is_using,
            include_expired=include_expired,
            limit=min(limit, 100),
            offset=offset
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"내 쿠폰 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="쿠폰 목록 조회 중 오류가 발생했습니다."
        )


@router.post("/use", response_model=CouponUseResponse)
async def use_coupon(
    use_data: UserCouponUseRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 사용

    **Request Body:**
    - user_coupon_id: 발급된 쿠폰 ID
    - order_id: 주문 ID
    - discount_amount: 실제 할인 금액

    **Returns:**
    - success: 사용 성공 여부
    - message: 결과 메시지
    - discount_amount: 할인 금액
    """
    try:
        # TODO: 본인의 쿠폰인지 확인
        coupon_service = get_coupon_service()
        return await coupon_service.use_coupon(
            user_coupon_id=use_data.user_coupon_id,
            order_id=use_data.order_id,
            discount_amount=use_data.discount_amount
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"쿠폰 사용 실패: {str(e)}")
        if "사용된" in str(e) or "만료된" in str(e) or "찾을 수 없습니다" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 사용 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/cancel/{user_coupon_id}")
async def cancel_coupon_use(
    user_coupon_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    쿠폰 사용 취소 (주문 취소 시)

    **Path Parameters:**
    - user_coupon_id: 발급된 쿠폰 ID

    **Returns:**
    - success: 취소 성공 여부
    - message: 결과 메시지
    """
    try:
        # TODO: 본인의 쿠폰인지 확인
        coupon_service = get_coupon_service()
        await coupon_service.cancel_coupon_use(UUID(user_coupon_id))

        return {
            "success": True,
            "message": "쿠폰 사용이 취소되었습니다."
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 쿠폰 ID 형식입니다."
        )
    except Exception as e:
        logger.error(f"쿠폰 사용 취소 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"쿠폰 사용 취소 중 오류가 발생했습니다: {str(e)}"
        )
