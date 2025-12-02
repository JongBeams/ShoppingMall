# -*- coding: utf-8 -*-
from supabase import Client
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


async def sync_balance_from_transactions(supabase: Client, user_id: UUID) -> int:
    """
    point_transactions 테이블의 최신 balance_after 값을
    profiles 테이블의 point_balance에 동기화

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID

    Returns:
        int: 동기화된 포인트 잔액
    """
    try:
        # 1. 해당 사용자의 가장 최근 트랜잭션의 balance_after 조회
        transaction_response = supabase.table("point_transactions").select(
            "balance_after"
        ).eq(
            "user_id", str(user_id)
        ).order(
            "created_at", desc=True
        ).limit(1).execute()

        if not transaction_response.data:
            # 트랜잭션이 없으면 0으로 설정
            balance = 0
        else:
            balance = transaction_response.data[0]["balance_after"]

        # 2. profiles 테이블의 point_balance 업데이트
        update_response = supabase.table("profiles").update({
            "point_balance": balance
        }).eq("id", str(user_id)).execute()

        if not update_response.data:
            raise Exception("잔액 동기화 실패")

        logger.info(f"포인트 잔액 동기화 성공: user_id={user_id}, synced_balance={balance}")

        return balance

    except Exception as e:
        logger.error(f"포인트 잔액 동기화 실패: {str(e)}")
        raise


async def get_point_balance(supabase: Client, user_id: UUID) -> int:
    """
    사용자의 현재 포인트 잔액 조회

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID

    Returns:
        int: 현재 포인트 잔액
    """
    try:
        response = supabase.table("profiles").select("point_balance").eq("id", str(user_id)).execute()

        if not response.data:
            raise ValueError(f"사용자를 찾을 수 없습니다: {user_id}")

        return response.data[0].get("point_balance", 0)

    except Exception as e:
        logger.error(f"포인트 잔액 조회 실패: {str(e)}")
        raise


async def earn_points(
    supabase: Client,
    user_id: UUID,
    amount: int,
    reason: str,
    order_id: Optional[UUID] = None,
    expires_days: int = 365
) -> Tuple[str, int]:
    """
    포인트 적립

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID
        amount: 적립할 포인트 (양수)
        reason: 적립 사유
        order_id: 관련 주문 ID (선택)
        expires_days: 유효기간 (기본 365일)

    Returns:
        Tuple[str, int]: (트랜잭션 ID, 적립 후 잔액)
    """
    if amount <= 0:
        raise ValueError("적립 포인트는 양수여야 합니다")

    try:
        # 1. 현재 잔액 조회
        current_balance = await get_point_balance(supabase, user_id)
        new_balance = current_balance + amount

        # 2. 만료일 계산
        expires_at = datetime.now() + timedelta(days=expires_days)

        # 3. 트랜잭션 생성
        transaction_data = {
            "user_id": str(user_id),
            "order_id": str(order_id) if order_id else None,
            "change_amount": amount,
            "balance_after": new_balance,
            "change_type": "earn",
            "reason": reason,
            "expires_at": expires_at.isoformat(),
        }

        transaction_response = supabase.table("point_transactions").insert(transaction_data).execute()

        if not transaction_response.data:
            raise Exception("트랜잭션 생성 실패")

        transaction_id = transaction_response.data[0]["id"]

        # 4. 사용자 잔액 업데이트
        update_response = supabase.table("profiles").update({
            "point_balance": new_balance
        }).eq("id", str(user_id)).execute()

        if not update_response.data:
            raise Exception("잔액 업데이트 실패")

        logger.info(f"포인트 적립 성공: user_id={user_id}, amount={amount}, new_balance={new_balance}")

        # 5. 포인트 잔액 동기화
        await sync_balance_from_transactions(supabase, user_id)

        return transaction_id, new_balance

    except Exception as e:
        logger.error(f"포인트 적립 실패: {str(e)}")
        raise


async def use_points(
    supabase: Client,
    user_id: UUID,
    amount: int,
    reason: str = "payment_use",
    order_id: Optional[UUID] = None
) -> Tuple[str, int]:
    """
    포인트 사용

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID
        amount: 사용할 포인트 (양수로 입력)
        reason: 사용 사유
        order_id: 관련 주문 ID (선택)

    Returns:
        Tuple[str, int]: (트랜잭션 ID, 사용 후 잔액)
    """
    if amount <= 0:
        raise ValueError("사용 포인트는 양수여야 합니다")

    try:
        # 1. 현재 잔액 조회
        current_balance = await get_point_balance(supabase, user_id)

        if current_balance < amount:
            raise ValueError(f"포인트가 부족합니다. 현재: {current_balance}P, 필요: {amount}P")

        new_balance = current_balance - amount

        # 2. 트랜잭션 생성 (음수로 저장)
        transaction_data = {
            "user_id": str(user_id),
            "order_id": str(order_id) if order_id else None,
            "change_amount": -amount,  # 음수로 저장
            "balance_after": new_balance,
            "change_type": "use",
            "reason": reason,
            "expires_at": None,  # 사용 시에는 만료일 없음
        }

        transaction_response = supabase.table("point_transactions").insert(transaction_data).execute()

        if not transaction_response.data:
            raise Exception("트랜잭션 생성 실패")

        transaction_id = transaction_response.data[0]["id"]

        # 3. 사용자 잔액 업데이트
        update_response = supabase.table("profiles").update({
            "point_balance": new_balance
        }).eq("id", str(user_id)).execute()

        if not update_response.data:
            raise Exception("잔액 업데이트 실패")

        logger.info(f"포인트 사용 성공: user_id={user_id}, amount={amount}, new_balance={new_balance}")

        # 4. 포인트 잔액 동기화
        await sync_balance_from_transactions(supabase, user_id)

        return transaction_id, new_balance

    except Exception as e:
        logger.error(f"포인트 사용 실패: {str(e)}")
        raise


async def cancel_points(
    supabase: Client,
    user_id: UUID,
    order_id: UUID
) -> Tuple[str, int]:
    """
    주문 취소 시 사용한 포인트 환원

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID
        order_id: 주문 ID

    Returns:
        Tuple[str, int]: (트랜잭션 ID, 환원 후 잔액)
    """
    try:
        # 1. 해당 주문에서 사용한 포인트 조회
        used_points_response = supabase.table("point_transactions").select("*").eq(
            "user_id", str(user_id)
        ).eq(
            "order_id", str(order_id)
        ).eq(
            "change_type", "use"
        ).execute()

        if not used_points_response.data:
            raise ValueError("해당 주문에서 사용한 포인트가 없습니다")

        # 사용한 포인트 합계 (음수로 저장되어 있음)
        total_used = sum(t["change_amount"] for t in used_points_response.data)
        refund_amount = abs(total_used)  # 양수로 변환

        if refund_amount == 0:
            raise ValueError("환원할 포인트가 없습니다")

        # 2. 현재 잔액 조회
        current_balance = await get_point_balance(supabase, user_id)
        new_balance = current_balance + refund_amount

        # 3. 취소 트랜잭션 생성 (양수로 저장)
        transaction_data = {
            "user_id": str(user_id),
            "order_id": str(order_id),
            "change_amount": refund_amount,
            "balance_after": new_balance,
            "change_type": "cancel",
            "reason": "order_cancel",
            "expires_at": None,
        }

        transaction_response = supabase.table("point_transactions").insert(transaction_data).execute()

        if not transaction_response.data:
            raise Exception("트랜잭션 생성 실패")

        transaction_id = transaction_response.data[0]["id"]

        # 4. 사용자 잔액 업데이트
        update_response = supabase.table("profiles").update({
            "point_balance": new_balance
        }).eq("id", str(user_id)).execute()

        if not update_response.data:
            raise Exception("잔액 업데이트 실패")

        logger.info(f"포인트 취소 성공: user_id={user_id}, refund_amount={refund_amount}, new_balance={new_balance}")

        # 5. 포인트 잔액 동기화
        await sync_balance_from_transactions(supabase, user_id)

        return transaction_id, new_balance

    except Exception as e:
        logger.error(f"포인트 취소 실패: {str(e)}")
        raise


async def adjust_points(
    supabase: Client,
    user_id: UUID,
    amount: int,
    reason: str = "admin_adjust"
) -> Tuple[str, int]:
    """
    포인트 조정 (관리자용)

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID
        amount: 조정할 포인트 (양수/음수)
        reason: 조정 사유

    Returns:
        Tuple[str, int]: (트랜잭션 ID, 조정 후 잔액)
    """
    if amount == 0:
        raise ValueError("조정 포인트는 0이 될 수 없습니다")

    try:
        # 1. 현재 잔액 조회
        current_balance = await get_point_balance(supabase, user_id)
        new_balance = current_balance + amount

        if new_balance < 0:
            raise ValueError(f"잔액이 음수가 될 수 없습니다. 현재: {current_balance}P, 조정: {amount}P")

        # 2. 트랜잭션 생성
        transaction_data = {
            "user_id": str(user_id),
            "order_id": None,
            "change_amount": amount,
            "balance_after": new_balance,
            "change_type": "adjust",
            "reason": reason,
            "expires_at": None,
        }

        transaction_response = supabase.table("point_transactions").insert(transaction_data).execute()

        if not transaction_response.data:
            raise Exception("트랜잭션 생성 실패")

        transaction_id = transaction_response.data[0]["id"]

        # 3. 사용자 잔액 업데이트
        update_response = supabase.table("profiles").update({
            "point_balance": new_balance
        }).eq("id", str(user_id)).execute()

        if not update_response.data:
            raise Exception("잔액 업데이트 실패")

        logger.info(f"포인트 조정 성공: user_id={user_id}, amount={amount}, new_balance={new_balance}")

        # 4. 포인트 잔액 동기화
        await sync_balance_from_transactions(supabase, user_id)

        return transaction_id, new_balance

    except Exception as e:
        logger.error(f"포인트 조정 실패: {str(e)}")
        raise


async def get_point_transactions(
    supabase: Client,
    user_id: UUID,
    page: int = 1,
    limit: int = 20
) -> Tuple[list, int, int]:
    """
    포인트 트랜잭션 내역 조회 (페이지네이션)

    Args:
        supabase: Supabase 클라이언트
        user_id: 사용자 ID
        page: 페이지 번호 (1부터 시작)
        limit: 페이지당 항목 수

    Returns:
        Tuple[list, int, int]: (트랜잭션 목록, 총 개수, 현재 잔액)
    """
    try:
        # 1. 현재 잔액 조회
        current_balance = await get_point_balance(supabase, user_id)

        # 2. 총 개수 조회
        count_response = supabase.table("point_transactions").select(
            "id", count="exact"
        ).eq("user_id", str(user_id)).execute()

        total_count = count_response.count if count_response.count else 0

        # 3. 페이지네이션 계산
        offset = (page - 1) * limit

        # 4. 트랜잭션 목록 조회 (최신순)
        transactions_response = supabase.table("point_transactions").select("*").eq(
            "user_id", str(user_id)
        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        transactions = transactions_response.data if transactions_response.data else []

        return transactions, total_count, current_balance

    except Exception as e:
        logger.error(f"포인트 내역 조회 실패: {str(e)}")
        raise


async def expire_points(supabase: Client) -> int:
    """
    만료된 포인트 처리 (배치 작업용)

    Args:
        supabase: Supabase 클라이언트

    Returns:
        int: 처리된 트랜잭션 수
    """
    try:
        # 1. 만료된 적립 포인트 조회
        now = datetime.now()
        expired_response = supabase.table("point_transactions").select("*").eq(
            "change_type", "earn"
        ).lt("expires_at", now.isoformat()).execute()

        if not expired_response.data:
            logger.info("만료된 포인트가 없습니다")
            return 0

        expired_count = 0

        # 2. 각 사용자별로 만료 처리
        user_expired_points = {}
        for transaction in expired_response.data:
            user_id = transaction["user_id"]
            amount = transaction["change_amount"]

            if user_id not in user_expired_points:
                user_expired_points[user_id] = 0
            user_expired_points[user_id] += amount

        # 3. 각 사용자별로 만료 트랜잭션 생성 및 잔액 차감
        for user_id, expired_amount in user_expired_points.items():
            if expired_amount <= 0:
                continue

            try:
                current_balance = await get_point_balance(supabase, UUID(user_id))
                new_balance = max(0, current_balance - expired_amount)

                # 만료 트랜잭션 생성
                transaction_data = {
                    "user_id": user_id,
                    "order_id": None,
                    "change_amount": -expired_amount,
                    "balance_after": new_balance,
                    "change_type": "expire",
                    "reason": "expire_job",
                    "expires_at": None,
                }

                supabase.table("point_transactions").insert(transaction_data).execute()

                # 잔액 업데이트
                supabase.table("profiles").update({
                    "point_balance": new_balance
                }).eq("id", user_id).execute()

                # 포인트 잔액 동기화
                await sync_balance_from_transactions(supabase, UUID(user_id))

                expired_count += 1
                logger.info(f"포인트 만료 처리: user_id={user_id}, expired_amount={expired_amount}")

            except Exception as e:
                logger.error(f"사용자 {user_id} 포인트 만료 처리 실패: {str(e)}")
                continue

        return expired_count

    except Exception as e:
        logger.error(f"포인트 만료 처리 실패: {str(e)}")
        raise
