"""
알림 관리 라우터
"""
from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
from typing import Optional
from app.models.notifications import (
    NotificationResponse,
    NotificationListResponse,
    NotificationUnreadCountResponse,
    NotificationMarkReadResponse
)
from app.services.notifications import get_notification_service
from app.services.auth_middleware import get_current_user


router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    type: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    사용자의 알림 목록 조회

    **Query Parameters:**
    - type: 알림 타입 필터 (order, shipment, coupon, event)
    - is_read: 읽음 상태 필터 (true/false)
    - limit: 페이지당 개수 (기본: 20, 최대: 100)
    - offset: 오프셋 (기본: 0)

    **Returns:**
    - notifications: 알림 목록
    - total: 전체 알림 개수
    - unread_count: 읽지 않은 알림 개수
    """
    try:
        user_id = UUID(current_user["id"])
        notification_service = get_notification_service()

        return await notification_service.get_notifications(
            user_id=user_id,
            type=type,
            is_read=is_read,
            limit=min(limit, 100),  # 최대 100개로 제한
            offset=offset
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청입니다: {str(e)}"
        )
    except Exception as e:
        print(f"[ERROR] 알림 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림 목록 조회 중 오류가 발생했습니다."
        )


@router.get("/unread-count", response_model=NotificationUnreadCountResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """
    읽지 않은 알림 개수 조회

    **Returns:**
    - unread_count: 읽지 않은 알림 개수
    """
    try:
        user_id = UUID(current_user["id"])
        notification_service = get_notification_service()

        return await notification_service.get_unread_count(user_id)
    except Exception as e:
        print(f"[ERROR] 읽지 않은 알림 개수 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="읽지 않은 알림 개수 조회 중 오류가 발생했습니다."
        )


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    알림 상세 조회

    **Path Parameters:**
    - notification_id: 알림 ID

    **Returns:**
    - 알림 상세 정보
    """
    try:
        user_id = UUID(current_user["id"])
        notification_service = get_notification_service()

        notification = await notification_service.get_notification_by_id(
            notification_id=notification_id,
            user_id=user_id
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="알림을 찾을 수 없습니다."
            )

        return notification
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 알림 상세 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림 조회 중 오류가 발생했습니다."
        )


@router.patch("/{notification_id}/read", response_model=NotificationMarkReadResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    알림을 읽음으로 표시

    **Path Parameters:**
    - notification_id: 알림 ID

    **Returns:**
    - success: 성공 여부
    - message: 결과 메시지
    """
    try:
        user_id = UUID(current_user["id"])
        notification_service = get_notification_service()

        success = await notification_service.mark_as_read(
            notification_id=notification_id,
            user_id=user_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="알림을 찾을 수 없습니다."
            )

        return NotificationMarkReadResponse(
            success=True,
            message="알림을 읽음으로 표시했습니다."
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 알림 읽음 처리 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림 읽음 처리 중 오류가 발생했습니다."
        )


@router.patch("/read-all", response_model=NotificationMarkReadResponse)
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user)
):
    """
    모든 알림을 읽음으로 표시

    **Returns:**
    - success: 성공 여부
    - message: 결과 메시지 (업데이트된 알림 개수 포함)
    """
    try:
        user_id = UUID(current_user["id"])
        notification_service = get_notification_service()

        count = await notification_service.mark_all_as_read(user_id)

        return NotificationMarkReadResponse(
            success=True,
            message=f"{count}개의 알림을 읽음으로 표시했습니다."
        )
    except Exception as e:
        print(f"[ERROR] 전체 알림 읽음 처리 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="전체 알림 읽음 처리 중 오류가 발생했습니다."
        )


@router.delete("/{notification_id}", response_model=NotificationMarkReadResponse)
async def delete_notification(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    알림 삭제

    **Path Parameters:**
    - notification_id: 알림 ID

    **Returns:**
    - success: 성공 여부
    - message: 결과 메시지
    """
    try:
        user_id = UUID(current_user["id"])
        notification_service = get_notification_service()

        success = await notification_service.delete_notification(
            notification_id=notification_id,
            user_id=user_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="알림을 찾을 수 없습니다."
            )

        return NotificationMarkReadResponse(
            success=True,
            message="알림을 삭제했습니다."
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 알림 삭제 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림 삭제 중 오류가 발생했습니다."
        )
