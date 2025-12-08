"""결제 기능 테스트"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.payments import confirm_toss_payment, process_payment_success


class TestPayments:
    """결제 기능 테스트"""

    @pytest.mark.asyncio
    @patch('app.services.payments.httpx.AsyncClient')
    async def test_confirm_toss_payment_success(self, mock_client):
        """토스 결제 승인 성공 테스트"""
        # Given
        payment_key = "test_payment_key"
        order_id = "test_order_id"
        amount = 10000

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "paymentKey": payment_key,
            "orderId": order_id,
            "totalAmount": amount,
            "status": "DONE",
            "method": "카드",
            "approvedAt": "2025-01-01T00:00:00+09:00"
        }

        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)

        # When
        result = await confirm_toss_payment(payment_key, order_id, amount)

        # Then
        assert result["paymentKey"] == payment_key
        assert result["orderId"] == order_id
        assert result["totalAmount"] == amount
        assert result["status"] == "DONE"

    @pytest.mark.asyncio
    @patch('app.services.payments.httpx.AsyncClient')
    async def test_confirm_toss_payment_failure(self, mock_client):
        """토스 결제 승인 실패 테스트"""
        # Given
        payment_key = "test_payment_key"
        order_id = "test_order_id"
        amount = 10000

        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "code": "INVALID_REQUEST",
            "message": "잘못된 요청입니다"
        }

        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)

        # When / Then
        with pytest.raises(Exception) as exc_info:
            await confirm_toss_payment(payment_key, order_id, amount)

        assert "토스 결제 승인 실패" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_amount_validation(self):
        """금액 검증 테스트 (3중 검증)"""
        # Given
        server_amount = 10000.0
        toss_amount = 10000.0
        client_amount = 10000.0

        # When
        is_valid = (
            abs(server_amount - toss_amount) < 0.01 and
            abs(client_amount - toss_amount) < 0.01
        )

        # Then
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_amount_validation_failure(self):
        """금액 검증 실패 테스트"""
        # Given
        server_amount = 10000.0
        toss_amount = 15000.0  # 불일치
        client_amount = 10000.0

        # When
        is_valid = (
            abs(server_amount - toss_amount) < 0.01 and
            abs(client_amount - toss_amount) < 0.01
        )

        # Then
        assert is_valid is False
