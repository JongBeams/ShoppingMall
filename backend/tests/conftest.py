"""Pytest 설정 및 공통 Fixtures"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """FastAPI 테스트 클라이언트"""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """테스트용 사용자 데이터"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "full_name": "Test User",
        "user_type": "buyer",
        "phone": "01012345678"
    }


@pytest.fixture
def mock_access_token():
    """테스트용 Access Token"""
    from app.services.jwt_auth import create_access_token
    token_data = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "user_type": "buyer",
        "type": "user"
    }
    return create_access_token(data=token_data)


@pytest.fixture
def auth_headers(mock_access_token):
    """인증 헤더"""
    return {"Authorization": f"Bearer {mock_access_token}"}
