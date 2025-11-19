from supabase import create_client, Client
from functools import lru_cache
from app.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Supabase client 인스턴스 반환 (Anon Key 사용 - 일반 사용자용)"""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache()
def get_supabase_admin_client() -> Client:
    """Supabase admin client 인스턴스 반환 (Service Role Key 사용 - 관리자용)"""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# 기본 supabase 클라이언트 (기존 코드 호환성)
supabase = get_supabase_client()
