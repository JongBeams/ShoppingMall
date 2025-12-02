# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from uuid import UUID

from app.services.supabase import get_supabase_client
from app.services.auth_middleware import get_current_user
from app.services.points import (
    get_point_balance,
    earn_points,
    use_points,
    cancel_points,
    adjust_points,
    get_point_transactions,
    sync_balance_from_transactions,
    expire_points
)
from app.models.points import (
    PointBalanceResponse,
    PointEarnRequest,
    PointUseRequest,
    PointCancelRequest,
    PointAdjustRequest,
    PointOperationResponse,
    PointTransactionsResponse,
    PointTransactionResponse
)

router = APIRouter(prefix="/points", tags=["points"])


@router.get("/balance", response_model=PointBalanceResponse)
async def get_balance(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    현재 사용자의 포인트 잔액 조회
    """
    try:
        user_id = UUID(current_user["id"])
        balance = await get_point_balance(supabase, user_id)

        return PointBalanceResponse(
            user_id=user_id,
            balance=balance,
            message="포인트 잔액 조회 성공"
        )

    except Exception as e:
        print(f"포인트 잔액 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 잔액 조회 실패: {str(e)}")


@router.get("/transactions", response_model=PointTransactionsResponse)
async def get_transactions(
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    포인트 거래 내역 조회 (페이지네이션)
    """
    try:
        user_id = UUID(current_user["id"])
        transactions, total_count, current_balance = await get_point_transactions(
            supabase, user_id, page, limit
        )

        # 트랜잭션 데이터를 응답 모델로 변환
        transaction_responses = [
            PointTransactionResponse(
                id=str(t["id"]),
                user_id=str(t["user_id"]),
                order_id=str(t["order_id"]) if t["order_id"] else None,
                change_amount=t["change_amount"],
                balance_after=t["balance_after"],
                change_type=t["change_type"],
                reason=t.get("reason"),
                expires_at=t.get("expires_at"),
                created_at=t["created_at"]
            )
            for t in transactions
        ]

        return PointTransactionsResponse(
            transactions=transaction_responses,
            total_count=total_count,
            current_balance=current_balance,
            page=page,
            limit=limit
        )

    except Exception as e:
        print(f"포인트 내역 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 내역 조회 실패: {str(e)}")


@router.post("/earn", response_model=PointOperationResponse)
async def earn_point(
    request: PointEarnRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    포인트 적립 (시스템/관리자용)

    일반 사용자는 자신의 포인트만 적립 가능
    관리자는 다른 사용자의 포인트도 적립 가능
    """
    try:
        # 일반 사용자는 자신의 포인트만 적립 가능
        if str(request.user_id) != current_user["id"]:
            # TODO: 관리자 권한 체크 로직 추가
            raise HTTPException(status_code=403, detail="다른 사용자의 포인트를 적립할 권한이 없습니다")

        # expires_days 계산 (expires_at이 제공된 경우 무시됨)
        expires_days = 365  # 기본 1년

        transaction_id, new_balance = await earn_points(
            supabase=supabase,
            user_id=request.user_id,
            amount=request.change_amount,
            reason=request.reason,
            order_id=request.order_id,
            expires_days=expires_days
        )

        return PointOperationResponse(
            success=True,
            message="포인트 적립 성공",
            transaction_id=transaction_id,
            balance_after=new_balance,
            change_amount=request.change_amount
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"포인트 적립 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 적립 실패: {str(e)}")


@router.post("/use", response_model=PointOperationResponse)
async def use_point(
    request: PointUseRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    포인트 사용 (결제 시)

    최소 사용 금액: 1,000P
    """
    try:
        # 사용자 본인만 포인트 사용 가능
        if str(request.user_id) != current_user["id"]:
            raise HTTPException(status_code=403, detail="다른 사용자의 포인트를 사용할 수 없습니다")

        # 최소 사용 금액 체크
        if request.change_amount < 1000:
            raise HTTPException(status_code=400, detail="포인트는 최소 1,000P 이상 사용 가능합니다")

        transaction_id, new_balance = await use_points(
            supabase=supabase,
            user_id=request.user_id,
            amount=request.change_amount,
            reason=request.reason,
            order_id=request.order_id
        )

        return PointOperationResponse(
            success=True,
            message="포인트 사용 성공",
            transaction_id=transaction_id,
            balance_after=new_balance,
            change_amount=-request.change_amount  # 사용은 음수로 표시
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"포인트 사용 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 사용 실패: {str(e)}")


@router.post("/cancel", response_model=PointOperationResponse)
async def cancel_point(
    request: PointCancelRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    주문 취소 시 사용한 포인트 환원
    """
    try:
        # 사용자 본인만 포인트 취소 가능
        if str(request.user_id) != current_user["id"]:
            raise HTTPException(status_code=403, detail="다른 사용자의 포인트를 취소할 수 없습니다")

        transaction_id, new_balance = await cancel_points(
            supabase=supabase,
            user_id=request.user_id,
            order_id=request.order_id
        )

        # 환원된 포인트 계산 (트랜잭션에서 change_amount가 양수로 저장됨)
        transaction_response = supabase.table("point_transactions").select("change_amount").eq("id", transaction_id).execute()
        refunded_amount = transaction_response.data[0]["change_amount"] if transaction_response.data else 0

        return PointOperationResponse(
            success=True,
            message="포인트 환원 성공",
            transaction_id=transaction_id,
            balance_after=new_balance,
            change_amount=refunded_amount
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"포인트 취소 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 취소 실패: {str(e)}")


@router.post("/adjust", response_model=PointOperationResponse)
async def adjust_point(
    request: PointAdjustRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    포인트 조정 (관리자 전용)

    양수: 포인트 추가
    음수: 포인트 차감
    """
    try:
        # TODO: 관리자 권한 체크 로직 추가
        # 현재는 임시로 본인 포인트만 조정 가능
        if str(request.user_id) != current_user["id"]:
            raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")

        transaction_id, new_balance = await adjust_points(
            supabase=supabase,
            user_id=request.user_id,
            amount=request.change_amount,
            reason=request.reason
        )

        return PointOperationResponse(
            success=True,
            message="포인트 조정 성공",
            transaction_id=transaction_id,
            balance_after=new_balance,
            change_amount=request.change_amount
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"포인트 조정 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 조정 실패: {str(e)}")


@router.post("/sync", response_model=PointBalanceResponse)
async def sync_balance(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    포인트 잔액 동기화

    point_transactions 테이블의 최신 balance_after 값을
    profiles 테이블의 point_balance에 동기화합니다.
    """
    try:
        user_id = UUID(current_user["id"])
        synced_balance = await sync_balance_from_transactions(supabase, user_id)

        return PointBalanceResponse(
            user_id=user_id,
            balance=synced_balance,
            message="포인트 잔액 동기화 성공"
        )

    except Exception as e:
        print(f"포인트 잔액 동기화 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 잔액 동기화 실패: {str(e)}")


@router.post("/expire", summary="포인트 만료 처리 (관리자용)")
async def expire_points_manual(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    만료된 포인트를 수동으로 처리 (관리자 전용)

    - 만료일이 지난 포인트를 찾아서 만료 처리
    - 각 사용자의 포인트 잔액을 차감
    - 만료 트랜잭션 생성

    주의: 이 작업은 관리자만 실행할 수 있습니다.
    일반적으로는 매일 자정에 스케줄러가 자동으로 실행합니다.
    """
    try:
        # TODO: 관리자 권한 체크 로직 추가
        # 현재는 임시로 모든 로그인 사용자 허용 (나중에 관리자만으로 제한 필요)
        print(f"포인트 만료 작업 수동 실행: user_id={current_user['id']}")

        # 만료된 포인트 처리
        expired_count = await expire_points(supabase)

        return {
            "success": True,
            "message": f"포인트 만료 처리가 완료되었습니다.",
            "expired_users_count": expired_count,
        }

    except Exception as e:
        print(f"포인트 만료 처리 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포인트 만료 처리 실패: {str(e)}")
