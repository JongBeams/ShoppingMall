"""
알림 서비스 모듈

사용자에게 알림을 생성하고 관리하는 서비스
"""
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional, Literal
from app.services.supabase import get_supabase_client
from app.models.notifications import (
    NotificationResponse,
    NotificationListResponse,
    NotificationUnreadCountResponse
)


class NotificationService:
    """알림 서비스 클래스"""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def create_notification(
        self,
        user_id: UUID,
        type: Literal["order", "shipment", "coupon", "event"],
        title: str,
        summary: str,
        body: str,
        resource_id: Optional[UUID] = None,
        expires_at: Optional[datetime] = None
    ) -> NotificationResponse:
        """
        알림 생성

        Args:
            user_id: 알림 대상 사용자 ID
            type: 알림 타입 (order, shipment, coupon, event)
            title: 알림 제목
            summary: 알림 요약
            body: 알림 본문
            resource_id: 연결된 리소스 ID (주문, 쿠폰 등)
            expires_at: 만료 시각

        Returns:
            생성된 알림 정보
        """
        data = {
            "user_id": str(user_id),
            "type": type,
            "title": title,
            "summary": summary,
            "body": body,
            "is_read": False
        }

        if resource_id:
            data["resource_id"] = str(resource_id)

        if expires_at:
            data["expires_at"] = expires_at.isoformat()

        result = self.supabase.table("notifications").insert(data).execute()

        if not result.data:
            raise Exception("알림 생성 실패")

        return NotificationResponse(**result.data[0])

    async def get_notifications(
        self,
        user_id: UUID,
        type: Optional[str] = None,
        is_read: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> NotificationListResponse:
        """
        사용자 알림 목록 조회

        Args:
            user_id: 사용자 ID
            type: 알림 타입 필터
            is_read: 읽음 상태 필터
            limit: 페이지당 개수
            offset: 오프셋

        Returns:
            알림 목록 및 통계 정보
        """
        # 기본 쿼리
        query = self.supabase.table("notifications").select("*", count="exact")
        query = query.eq("user_id", str(user_id))

        # 필터 적용
        if type:
            query = query.eq("type", type)

        if is_read is not None:
            query = query.eq("is_read", is_read)

        # 정렬 및 페이지네이션
        query = query.order("created_at", desc=True)
        query = query.range(offset, offset + limit - 1)

        result = query.execute()

        # 읽지 않은 알림 개수 조회
        unread_query = self.supabase.table("notifications").select("id", count="exact")
        unread_query = unread_query.eq("user_id", str(user_id))
        unread_query = unread_query.eq("is_read", False)
        unread_result = unread_query.execute()

        return NotificationListResponse(
            notifications=[NotificationResponse(**item) for item in result.data],
            total=result.count or 0,
            unread_count=unread_result.count or 0
        )

    async def get_notification_by_id(
        self,
        notification_id: UUID,
        user_id: UUID
    ) -> Optional[NotificationResponse]:
        """
        알림 상세 조회

        Args:
            notification_id: 알림 ID
            user_id: 사용자 ID (권한 검증용)

        Returns:
            알림 정보 또는 None
        """
        result = self.supabase.table("notifications").select("*") \
            .eq("id", str(notification_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        if not result.data:
            return None

        return NotificationResponse(**result.data[0])

    async def mark_as_read(
        self,
        notification_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        알림을 읽음으로 표시

        Args:
            notification_id: 알림 ID
            user_id: 사용자 ID (권한 검증용)

        Returns:
            성공 여부
        """
        result = self.supabase.table("notifications").update({"is_read": True}) \
            .eq("id", str(notification_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        return len(result.data) > 0

    async def mark_all_as_read(self, user_id: UUID) -> int:
        """
        모든 알림을 읽음으로 표시

        Args:
            user_id: 사용자 ID

        Returns:
            업데이트된 알림 개수
        """
        result = self.supabase.table("notifications").update({"is_read": True}) \
            .eq("user_id", str(user_id)) \
            .eq("is_read", False) \
            .execute()

        return len(result.data)

    async def delete_notification(
        self,
        notification_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        알림 삭제

        Args:
            notification_id: 알림 ID
            user_id: 사용자 ID (권한 검증용)

        Returns:
            성공 여부
        """
        result = self.supabase.table("notifications").delete() \
            .eq("id", str(notification_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        return len(result.data) > 0

    async def get_unread_count(self, user_id: UUID) -> NotificationUnreadCountResponse:
        """
        읽지 않은 알림 개수 조회

        Args:
            user_id: 사용자 ID

        Returns:
            읽지 않은 알림 개수
        """
        result = self.supabase.table("notifications").select("id", count="exact") \
            .eq("user_id", str(user_id)) \
            .eq("is_read", False) \
            .execute()

        return NotificationUnreadCountResponse(unread_count=result.count or 0)

    # ============================================
    # 특정 이벤트에 대한 알림 생성 헬퍼 함수들
    # ============================================

    async def create_order_notification(
        self,
        user_id: UUID,
        order_id: UUID,
        order_number: str,
        product_name: str,
        total_amount: int,
        status: Literal["placed", "cancelled", "confirmed"]
    ) -> NotificationResponse:
        """주문 관련 알림 생성"""

        title_map = {
            "placed": "주문이 완료되었습니다",
            "cancelled": "주문 취소가 완료되었습니다",
            "confirmed": "구매가 확정되었습니다"
        }

        summary_map = {
            "placed": f"{product_name} 주문이 완료되었습니다. 주문번호: {order_number}",
            "cancelled": f"{product_name} 주문이 취소되었습니다. 환불은 3~5일 소요됩니다.",
            "confirmed": f"{product_name} 구매가 확정되었습니다. 포인트가 적립되었습니다."
        }

        body_map = {
            "placed": f"""주문해 주셔서 감사합니다.

주문번호: {order_number}
상품명: {product_name}
결제금액: {total_amount:,}원

배송은 2-3일 이내에 시작될 예정입니다.
배송 시작 시 알림을 보내드리겠습니다.""",
            "cancelled": f"""주문이 취소되었습니다.

주문번호: {order_number}
상품명: {product_name}
환불금액: {total_amount:,}원

환불은 결제수단에 따라 3~5일 소요될 수 있습니다.""",
            "confirmed": f"""구매확정 감사합니다.

주문번호: {order_number}
상품명: {product_name}

적립 포인트는 마이페이지에서 확인하실 수 있습니다."""
        }

        return await self.create_notification(
            user_id=user_id,
            type="order",
            title=title_map[status],
            summary=summary_map[status],
            body=body_map[status],
            resource_id=order_id
        )

    async def create_shipment_notification(
        self,
        user_id: UUID,
        order_id: UUID,
        order_number: str,
        product_name: str,
        status: Literal["shipped", "delivered"],
        tracking_number: Optional[str] = None,
        courier: Optional[str] = None
    ) -> NotificationResponse:
        """배송 관련 알림 생성"""

        if status == "shipped":
            title = "배송이 시작되었습니다"
            summary = f"{product_name} 배송이 시작되었습니다. 배송조회가 가능합니다."
            body = f"""상품이 배송을 시작했습니다.

주문번호: {order_number}
상품명: {product_name}
택배사: {courier or '확인중'}
운송장번호: {tracking_number or '확인중'}

배송조회를 통해 실시간으로 배송 현황을 확인하실 수 있습니다."""
        else:  # delivered
            title = "배송이 완료되었습니다"
            summary = f"{product_name} 배송이 완료되었습니다. 구매확정을 부탁드립니다."
            body = f"""상품이 배송 완료되었습니다.

주문번호: {order_number}
상품명: {product_name}

상품을 확인하신 후 구매확정을 부탁드립니다.
구매확정 시 포인트가 적립됩니다."""

        return await self.create_notification(
            user_id=user_id,
            type="shipment",
            title=title,
            summary=summary,
            body=body,
            resource_id=order_id
        )

    async def create_coupon_notification(
        self,
        user_id: UUID,
        coupon_id: UUID,
        coupon_name: str,
        discount_type: str,
        discount_value: int,
        min_order_amount: int,
        valid_days: int
    ) -> NotificationResponse:
        """쿠폰 관련 알림 생성"""

        expires_at = datetime.now() + timedelta(days=valid_days)

        if discount_type == "percentage":
            discount_text = f"{discount_value}% 할인"
        else:
            discount_text = f"{discount_value:,}원 할인"

        title = "새로운 쿠폰이 도착했습니다"
        summary = f"{coupon_name} 쿠폰이 발급되었습니다. {valid_days}일간 사용 가능합니다."
        body = f"""쿠폰이 발급되었습니다!

쿠폰명: {coupon_name}
할인: {discount_text}
최소 주문금액: {min_order_amount:,}원
유효기간: {expires_at.strftime('%Y.%m.%d')}까지 ({valid_days}일)

모든 카테고리의 상품에 사용 가능합니다.
단, 일부 브랜드 제품은 제외될 수 있습니다."""

        return await self.create_notification(
            user_id=user_id,
            type="coupon",
            title=title,
            summary=summary,
            body=body,
            resource_id=coupon_id,
            expires_at=expires_at
        )

    async def create_event_notification(
        self,
        user_id: UUID,
        title: str,
        summary: str,
        body: str,
        expires_at: Optional[datetime] = None
    ) -> NotificationResponse:
        """이벤트/프로모션 알림 생성"""

        return await self.create_notification(
            user_id=user_id,
            type="event",
            title=title,
            summary=summary,
            body=body,
            expires_at=expires_at
        )


# 싱글톤 인스턴스
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """알림 서비스 싱글톤 인스턴스 반환"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
