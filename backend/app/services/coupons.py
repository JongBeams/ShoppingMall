"""
쿠폰 서비스 모듈

쿠폰 생성, 발급, 사용 관리 서비스
"""
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional, Literal
from decimal import Decimal
from app.services.supabase import get_supabase_client
from app.models.coupons import (
    CouponResponse,
    CouponListResponse,
    UserCouponResponse,
    UserCouponListResponse,
    CouponIssueResponse,
    CouponUseResponse,
    CouponCreateRequest,
    CouponUpdateRequest
)


class CouponService:
    """쿠폰 서비스 클래스"""

    def __init__(self):
        self.supabase = get_supabase_client()

    def _generate_coupon_code(self) -> str:
        """쿠폰 코드 자동 생성 (8자리 영숫자)"""
        import random
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            # 중복 체크
            existing = self.supabase.table("coupons").select("id").eq("code", code).execute()
            if not existing.data:
                return code

    async def create_coupon(self, coupon_data: CouponCreateRequest, auto_issue_to_all: bool = False) -> CouponResponse:
        """
        쿠폰 생성

        Args:
            coupon_data: 쿠폰 생성 요청 데이터
            auto_issue_to_all: True일 경우 모든 구매자에게 자동 발급

        Returns:
            생성된 쿠폰 정보

        Raises:
            Exception: 쿠폰 코드 중복 또는 생성 실패
        """
        # 쿠폰 코드 자동 생성 또는 중복 체크
        coupon_code = coupon_data.code
        if not coupon_code:
            coupon_code = self._generate_coupon_code()
        else:
            existing = self.supabase.table("coupons").select("id").eq("code", coupon_code).execute()
            if existing.data:
                raise Exception(f"쿠폰 코드 '{coupon_code}'가 이미 존재합니다.")

        # 데이터 준비
        data = {
            "name": coupon_data.name,
            "code": coupon_code,
            "discount_type": coupon_data.discount_type,
            "discount_value": float(coupon_data.discount_value),
            "max_discount_amount": float(coupon_data.max_discount_amount) if coupon_data.max_discount_amount else None,
            "min_order_amount": float(coupon_data.min_order_amount) if coupon_data.min_order_amount else None,
            "validity_days": coupon_data.validity_days,
            "start_at": coupon_data.start_at.isoformat(),
            "end_at": coupon_data.end_at.isoformat(),
            "vendor_id": str(coupon_data.vendor_id) if coupon_data.vendor_id else None
        }

        result = self.supabase.table("coupons").insert(data).execute()

        if not result.data:
            raise Exception("쿠폰 생성 실패")

        created_coupon = CouponResponse(**result.data[0])

        # 모든 구매자에게 자동 발급
        if auto_issue_to_all:
            await self._issue_to_all_buyers(created_coupon.id, coupon_data.validity_days)

        return created_coupon

    async def _issue_to_all_buyers(self, coupon_id: UUID, validity_days: int):
        """모든 구매자(일반 회원)에게 쿠폰 발급"""
        import logging
        logger = logging.getLogger(__name__)

        try:
            logger.info(f"[자동 발급 시작] 쿠폰 ID: {coupon_id}, 유효기간: {validity_days}일")

            # 쿠폰 정보 조회 (알림에 사용)
            coupon = await self.get_coupon_by_id(coupon_id)

            # profiles 테이블에서 user_type = 'buyer'인 사용자 조회 (구매자만)
            buyers_result = self.supabase.table("profiles").select("id").eq("user_type", "buyer").execute()

            logger.info(f"[자동 발급] 조회된 구매자 수: {len(buyers_result.data) if buyers_result.data else 0}")

            if not buyers_result.data:
                logger.warning("[자동 발급] 구매자가 없어 발급을 건너뜁니다.")
                return

            # 만료 시각 계산
            expires_at = datetime.now() + timedelta(days=validity_days)
            expires_at_iso = expires_at.isoformat()

            # 각 구매자에게 쿠폰 발급
            user_coupons = []
            for buyer in buyers_result.data:
                user_coupons.append({
                    "coupon_id": str(coupon_id),
                    "user_id": buyer["id"],
                    "is_using": False,
                    "expires_at": expires_at_iso
                })

            # 일괄 발급
            if user_coupons:
                logger.info(f"[자동 발급] {len(user_coupons)}개의 쿠폰을 발급합니다.")
                insert_result = self.supabase.table("user_coupons").insert(user_coupons).execute()
                logger.info(f"[자동 발급 완료] 발급된 쿠폰 수: {len(insert_result.data) if insert_result.data else 0}")

                # 각 구매자에게 알림 생성
                await self._create_coupon_notifications(buyers_result.data, coupon, expires_at)

        except Exception as e:
            # 발급 실패해도 쿠폰 생성은 성공으로 처리
            logger.error(f"[자동 발급 실패] 오류: {str(e)}", exc_info=True)

    async def _create_coupon_notifications(self, buyers: list, coupon, expires_at: datetime):
        """쿠폰 발급 알림 생성"""
        import logging
        logger = logging.getLogger(__name__)

        try:
            from app.services.notifications import get_notification_service

            notification_service = get_notification_service()

            # 할인 정보 포맷팅
            if coupon.discount_type == "percent":
                discount_text = f"{coupon.discount_value}% 할인"
            else:
                discount_text = f"{int(coupon.discount_value):,}원 할인"

            # 각 구매자에게 알림 생성
            for buyer in buyers:
                try:
                    await notification_service.create_notification(
                        user_id=UUID(buyer["id"]),
                        type="coupon",
                        title="새로운 쿠폰이 발급되었습니다! 🎁",
                        summary=f"{coupon.name} - {discount_text}",
                        body=f"{coupon.name} 쿠폰이 발급되었습니다. {discount_text} 혜택을 받으실 수 있으며, {expires_at.strftime('%Y년 %m월 %d일')}까지 사용 가능합니다.",
                        resource_id=coupon.id,
                        expires_at=expires_at
                    )
                except Exception as e:
                    logger.error(f"[알림 생성 실패] 사용자 {buyer['id']}: {str(e)}")
                    # 개별 알림 실패는 무시하고 계속 진행

            logger.info(f"[알림 생성 완료] {len(buyers)}명의 구매자에게 알림 전송")

        except Exception as e:
            logger.error(f"[알림 생성 전체 실패] 오류: {str(e)}")
            # 알림 실패해도 쿠폰 발급은 유지

    async def get_coupons(
        self,
        vendor_id: Optional[UUID] = None,
        discount_type: Optional[Literal["percent", "fixed"]] = None,
        is_active: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> CouponListResponse:
        """
        쿠폰 목록 조회

        Args:
            vendor_id: 판매자 ID 필터
            discount_type: 할인 타입 필터
            is_active: 현재 유효한 쿠폰만 조회
            limit: 페이지당 개수
            offset: 오프셋

        Returns:
            쿠폰 목록 및 총 개수
        """
        # 기본 쿼리
        query = self.supabase.table("coupons").select("*", count="exact")

        # 필터 적용
        if vendor_id:
            query = query.eq("vendor_id", str(vendor_id))

        if discount_type:
            query = query.eq("discount_type", discount_type)

        if is_active:
            now = datetime.now().isoformat()
            query = query.lte("start_at", now).gte("end_at", now)

        # 정렬 및 페이지네이션
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

        result = query.execute()

        coupons = [CouponResponse(**item) for item in result.data]
        total = result.count if result.count else 0

        return CouponListResponse(coupons=coupons, total=total)

    async def get_coupon_by_id(self, coupon_id: UUID) -> CouponResponse:
        """
        쿠폰 ID로 단일 쿠폰 조회

        Args:
            coupon_id: 쿠폰 ID

        Returns:
            쿠폰 정보

        Raises:
            Exception: 쿠폰을 찾을 수 없음
        """
        result = self.supabase.table("coupons").select("*").eq("id", str(coupon_id)).execute()

        if not result.data:
            raise Exception(f"쿠폰 ID {coupon_id}를 찾을 수 없습니다.")

        return CouponResponse(**result.data[0])

    async def get_coupon_by_code(self, code: str) -> CouponResponse:
        """
        쿠폰 코드로 쿠폰 조회

        Args:
            code: 쿠폰 코드

        Returns:
            쿠폰 정보

        Raises:
            Exception: 쿠폰을 찾을 수 없음
        """
        result = self.supabase.table("coupons").select("*").eq("code", code).execute()

        if not result.data:
            raise Exception(f"쿠폰 코드 '{code}'를 찾을 수 없습니다.")

        return CouponResponse(**result.data[0])

    async def get_coupon_stats(self, coupon_id: UUID) -> dict:
        """
        쿠폰 사용 통계 조회

        Args:
            coupon_id: 쿠폰 ID

        Returns:
            total: 총 발급된 쿠폰 수
            unused: 사용되지 않은 쿠폰 수
            used: 사용된 쿠폰 수
        """
        # 총 발급 수
        total_result = self.supabase.table("user_coupons").select("id", count="exact").eq("coupon_id", str(coupon_id)).execute()
        total = total_result.count if total_result.count else 0

        # 사용되지 않은 쿠폰 수
        unused_result = self.supabase.table("user_coupons").select("id", count="exact").eq("coupon_id", str(coupon_id)).eq("is_using", False).execute()
        unused = unused_result.count if unused_result.count else 0

        # 사용된 쿠폰 수
        used = total - unused

        return {
            "total": total,
            "unused": unused,
            "used": used
        }

    async def update_coupon(self, coupon_id: UUID, update_data: CouponUpdateRequest) -> CouponResponse:
        """
        쿠폰 정보 수정

        Args:
            coupon_id: 쿠폰 ID
            update_data: 수정할 데이터

        Returns:
            수정된 쿠폰 정보

        Raises:
            Exception: 쿠폰 코드 중복 또는 수정 실패
        """
        # 수정할 데이터만 추출
        data = {}
        if update_data.name is not None:
            data["name"] = update_data.name
        if update_data.code is not None:
            # 코드 중복 체크
            existing = self.supabase.table("coupons").select("id").eq("code", update_data.code).neq("id", str(coupon_id)).execute()
            if existing.data:
                raise Exception(f"쿠폰 코드 '{update_data.code}'가 이미 존재합니다.")
            data["code"] = update_data.code
        if update_data.discount_type is not None:
            data["discount_type"] = update_data.discount_type
        if update_data.discount_value is not None:
            data["discount_value"] = float(update_data.discount_value)
        if update_data.max_discount_amount is not None:
            data["max_discount_amount"] = float(update_data.max_discount_amount)
        if update_data.min_order_amount is not None:
            data["min_order_amount"] = float(update_data.min_order_amount)
        if update_data.validity_days is not None:
            data["validity_days"] = update_data.validity_days
        if update_data.start_at is not None:
            data["start_at"] = update_data.start_at.isoformat()
        if update_data.end_at is not None:
            data["end_at"] = update_data.end_at.isoformat()
        if update_data.vendor_id is not None:
            data["vendor_id"] = str(update_data.vendor_id)

        if not data:
            raise Exception("수정할 데이터가 없습니다.")

        data["updated_at"] = datetime.now().isoformat()

        result = self.supabase.table("coupons").update(data).eq("id", str(coupon_id)).execute()

        if not result.data:
            raise Exception("쿠폰 수정 실패")

        return CouponResponse(**result.data[0])

    async def delete_coupon(self, coupon_id: UUID) -> bool:
        """
        쿠폰 삭제

        Args:
            coupon_id: 쿠폰 ID

        Returns:
            삭제 성공 여부

        Raises:
            Exception: 삭제 실패
        """
        # 발급된 쿠폰이 있는지 확인
        issued = self.supabase.table("user_coupons").select("id", count="exact").eq("coupon_id", str(coupon_id)).execute()
        if issued.count and issued.count > 0:
            raise Exception("이미 발급된 쿠폰은 삭제할 수 없습니다.")

        result = self.supabase.table("coupons").delete().eq("id", str(coupon_id)).execute()

        if not result.data:
            raise Exception("쿠폰 삭제 실패")

        return True

    # ============================================
    # 사용자 쿠폰 관련 메서드
    # ============================================

    async def issue_coupon(self, coupon_id: UUID, user_id: UUID) -> CouponIssueResponse:
        """
        사용자에게 쿠폰 발급

        Args:
            coupon_id: 쿠폰 ID
            user_id: 사용자 ID

        Returns:
            발급 결과

        Raises:
            Exception: 쿠폰 발급 실패
        """
        # 쿠폰 정보 조회
        coupon = await self.get_coupon_by_id(coupon_id)

        # 쿠폰 유효 기간 확인
        now = datetime.now()
        start_at = coupon.start_at.replace(tzinfo=None) if coupon.start_at.tzinfo else coupon.start_at
        end_at = coupon.end_at.replace(tzinfo=None) if coupon.end_at.tzinfo else coupon.end_at

        if now < start_at:
            raise Exception("아직 사용할 수 없는 쿠폰입니다.")
        if now > end_at:
            raise Exception("만료된 쿠폰입니다.")

        # 만료 시각 계산 (발급일 + validity_days)
        expires_at = now + timedelta(days=coupon.validity_days)

        # 사용자 쿠폰 발급
        data = {
            "coupon_id": str(coupon_id),
            "user_id": str(user_id),
            "is_using": False,
            "expires_at": expires_at.isoformat()
        }

        result = self.supabase.table("user_coupons").insert(data).execute()

        if not result.data:
            raise Exception("쿠폰 발급 실패")

        user_coupon = UserCouponResponse(**result.data[0])
        user_coupon.coupon = coupon

        # 알림 생성
        try:
            await self._create_coupon_notifications([{"id": str(user_id)}], coupon, expires_at)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"[개별 쿠폰 발급 알림 실패] {str(e)}")
            # 알림 실패해도 쿠폰 발급은 성공

        return CouponIssueResponse(
            success=True,
            message="쿠폰이 발급되었습니다.",
            user_coupon=user_coupon
        )

    async def get_user_coupons(
        self,
        user_id: UUID,
        is_using: Optional[bool] = None,
        include_expired: bool = False,
        limit: int = 20,
        offset: int = 0
    ) -> UserCouponListResponse:
        """
        사용자 보유 쿠폰 목록 조회

        Args:
            user_id: 사용자 ID
            is_using: 사용 여부 필터
            include_expired: 만료된 쿠폰 포함 여부
            limit: 페이지당 개수
            offset: 오프셋

        Returns:
            사용자 쿠폰 목록
        """
        query = self.supabase.table("user_coupons").select("*", count="exact").eq("user_id", str(user_id))

        # 필터 적용
        if is_using is not None:
            query = query.eq("is_using", is_using)

        if not include_expired:
            now = datetime.now().isoformat()
            query = query.gte("expires_at", now)

        # 정렬 및 페이지네이션
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

        result = query.execute()

        user_coupons = []
        for item in result.data:
            user_coupon = UserCouponResponse(**item)
            # 쿠폰 정보 포함
            try:
                coupon = await self.get_coupon_by_id(UUID(item["coupon_id"]))
                user_coupon.coupon = coupon
            except:
                pass
            user_coupons.append(user_coupon)

        total = result.count if result.count else 0

        return UserCouponListResponse(user_coupons=user_coupons, total=total)

    async def use_coupon(
        self,
        user_coupon_id: UUID,
        order_id: UUID,
        discount_amount: Decimal
    ) -> CouponUseResponse:
        """
        쿠폰 사용

        Args:
            user_coupon_id: 발급된 쿠폰 ID
            order_id: 주문 ID
            discount_amount: 실제 할인 금액

        Returns:
            쿠폰 사용 결과

        Raises:
            Exception: 쿠폰 사용 실패
        """
        # 사용자 쿠폰 조회
        result = self.supabase.table("user_coupons").select("*").eq("id", str(user_coupon_id)).execute()

        if not result.data:
            raise Exception("쿠폰을 찾을 수 없습니다.")

        user_coupon = result.data[0]

        # 이미 사용된 쿠폰인지 확인
        if user_coupon["is_using"]:
            raise Exception("이미 사용된 쿠폰입니다.")

        # 만료 확인
        expires_at = datetime.fromisoformat(user_coupon["expires_at"].replace("Z", "+00:00"))
        if datetime.now(expires_at.tzinfo) > expires_at:
            raise Exception("만료된 쿠폰입니다.")

        # 쿠폰 사용 처리
        update_data = {
            "is_using": True,
            "order_id": str(order_id),
            "discount_amount": float(discount_amount),
            "updated_at": datetime.now().isoformat()
        }

        update_result = self.supabase.table("user_coupons").update(update_data).eq("id", str(user_coupon_id)).execute()

        if not update_result.data:
            raise Exception("쿠폰 사용 처리 실패")

        return CouponUseResponse(
            success=True,
            message="쿠폰이 사용되었습니다.",
            discount_amount=discount_amount
        )

    async def cancel_coupon_use(self, user_coupon_id: UUID) -> bool:
        """
        쿠폰 사용 취소 (주문 취소 시)

        Args:
            user_coupon_id: 발급된 쿠폰 ID

        Returns:
            취소 성공 여부
        """
        update_data = {
            "is_using": False,
            "order_id": None,
            "discount_amount": None,
            "updated_at": datetime.now().isoformat()
        }

        result = self.supabase.table("user_coupons").update(update_data).eq("id", str(user_coupon_id)).execute()

        if not result.data:
            raise Exception("쿠폰 사용 취소 실패")

        return True


# 싱글톤 인스턴스
_coupon_service = None


def get_coupon_service() -> CouponService:
    """쿠폰 서비스 싱글톤 인스턴스 반환"""
    global _coupon_service
    if _coupon_service is None:
        _coupon_service = CouponService()
    return _coupon_service
