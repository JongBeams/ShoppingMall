"""JWT 인증 테스트"""
import pytest
from datetime import timedelta
from app.services.jwt_auth import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    verify_token,
    revoke_refresh_token
)


class TestJWTAuth:
    """JWT 인증 기능 테스트"""

    def test_create_access_token(self):
        """Access Token 생성 테스트"""
        # Given
        user_data = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "type": "user"
        }

        # When
        token = create_access_token(data=user_data)

        # Then
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50

    def test_create_access_token_with_custom_expiry(self):
        """커스텀 만료 시간을 가진 Access Token 생성 테스트"""
        # Given
        user_data = {"sub": "test-user-id", "email": "test@example.com"}
        expires_delta = timedelta(hours=1)

        # When
        token = create_access_token(data=user_data, expires_delta=expires_delta)

        # Then
        assert token is not None
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "test-user-id"

    def test_verify_valid_token(self):
        """유효한 토큰 검증 테스트"""
        # Given
        user_data = {"sub": "test-user-id", "email": "test@example.com"}
        token = create_access_token(data=user_data)

        # When
        payload = verify_token(token)

        # Then
        assert payload is not None
        assert payload["sub"] == "test-user-id"
        assert payload["email"] == "test@example.com"

    def test_verify_invalid_token(self):
        """유효하지 않은 토큰 검증 테스트"""
        # Given
        invalid_token = "invalid.token.string"

        # When
        payload = verify_token(invalid_token)

        # Then
        assert payload is None

    def test_create_refresh_token(self):
        """Refresh Token 생성 테스트"""
        # Given
        user_id = "test-user-id"
        user_type = "user"

        # When
        refresh_token = create_refresh_token(user_id=user_id, user_type=user_type)

        # Then
        assert refresh_token is not None
        assert isinstance(refresh_token, str)

    def test_verify_refresh_token(self):
        """Refresh Token 검증 테스트"""
        # Given
        user_id = "test-user-id"
        refresh_token = create_refresh_token(user_id=user_id)

        # When
        payload = verify_refresh_token(refresh_token)

        # Then
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["token_type"] == "refresh"
        assert payload["type"] == "user"

    def test_revoke_refresh_token(self):
        """Refresh Token 무효화 테스트"""
        # Given
        user_id = "test-user-id"
        refresh_token = create_refresh_token(user_id=user_id)

        # When
        revoke_refresh_token(user_id=user_id)
        payload = verify_refresh_token(refresh_token)

        # Then
        assert payload is None  # 무효화된 토큰은 검증 실패
