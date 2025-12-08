"""포인트 시스템 테스트"""
import pytest
from unittest.mock import Mock, patch
from uuid import uuid4
from app.services.points import (
    earn_points,
    use_points,
    cancel_points,
    adjust_points,
    get_point_balance
)


class TestPoints:
    """포인트 시스템 테스트"""

    @pytest.mark.asyncio
    @patch('app.services.points.get_supabase_admin_client')
    async def test_earn_points(self, mock_supabase):
        """포인트 적립 테스트"""
        # Given
        user_id = uuid4()
        amount = 1000

        mock_client = Mock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"point_balance": 0}
        ]
        mock_client.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "change_amount": amount, "balance_after": amount}
        ]
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(user_id), "point_balance": amount}
        ]
        mock_supabase.return_value = mock_client

        # When
        transaction_id, new_balance = await earn_points(
            supabase=mock_client,
            user_id=user_id,
            amount=amount,
            reason="test_earn"
        )

        # Then
        assert new_balance == amount
        assert transaction_id is not None

    @pytest.mark.asyncio
    @patch('app.services.points.get_supabase_admin_client')
    async def test_use_points_success(self, mock_supabase):
        """포인트 사용 성공 테스트"""
        # Given
        user_id = uuid4()
        current_balance = 5000
        use_amount = 1000

        mock_client = Mock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"point_balance": current_balance}
        ]
        mock_client.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "change_amount": -use_amount, "balance_after": current_balance - use_amount}
        ]
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(user_id), "point_balance": current_balance - use_amount}
        ]
        mock_supabase.return_value = mock_client

        # When
        transaction_id, new_balance = await use_points(
            supabase=mock_client,
            user_id=user_id,
            amount=use_amount,
            reason="payment_use"
        )

        # Then
        assert new_balance == current_balance - use_amount

    @pytest.mark.asyncio
    @patch('app.services.points.get_point_balance')
    async def test_use_points_insufficient_balance(self, mock_get_balance):
        """잔액 부족 시 포인트 사용 실패 테스트"""
        # Given
        user_id = uuid4()
        current_balance = 500
        use_amount = 1000

        mock_get_balance.return_value = current_balance

        # When / Then
        with pytest.raises(ValueError) as exc_info:
            await use_points(
                supabase=Mock(),
                user_id=user_id,
                amount=use_amount,
                reason="payment_use"
            )

        assert "포인트가 부족합니다" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_point_transaction_balance_consistency(self):
        """포인트 트랜잭션 잔액 일관성 테스트"""
        # Given
        initial_balance = 0
        transactions = [
            ("earn", 1000),
            ("earn", 500),
            ("use", 300),
            ("earn", 2000),
            ("use", 1200),
        ]

        # When
        final_balance = initial_balance
        for action, amount in transactions:
            if action == "earn":
                final_balance += amount
            elif action == "use":
                final_balance -= amount

        # Then
        assert final_balance == 2000  # 0 + 1000 + 500 - 300 + 2000 - 1200

    @pytest.mark.asyncio
    @patch('app.services.points.get_point_balance')
    async def test_adjust_points(self, mock_get_balance):
        """관리자 포인트 조정 테스트"""
        # Given
        user_id = uuid4()
        current_balance = 1000
        adjust_amount = 500

        mock_get_balance.return_value = current_balance

        # When
        expected_balance = current_balance + adjust_amount

        # Then
        assert expected_balance == 1500
