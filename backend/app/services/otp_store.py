"""
OTP 인증번호 저장소 (메모리 기반)
Redis 대신 메모리 딕셔너리를 사용하여 OTP를 임시 저장합니다.
"""
from datetime import datetime, timedelta
from typing import Optional
import threading


class OTPStore:
    """OTP 인증번호를 메모리에 저장하는 클래스"""

    def __init__(self):
        self._store: dict[str, tuple[str, datetime]] = {}
        self._lock = threading.Lock()

    def set(self, email: str, otp_code: str, ttl_seconds: int = 300):
        """OTP 코드 저장 (기본 TTL: 5분)"""
        expires_at = datetime.now() + timedelta(seconds=ttl_seconds)
        with self._lock:
            self._store[email] = (otp_code, expires_at)
            print(f"[OTP Store] {email} 저장: {otp_code} (만료: {expires_at})")

    def get(self, email: str) -> Optional[str]:
        """OTP 코드 조회 (만료된 경우 None 반환)"""
        with self._lock:
            if email not in self._store:
                return None

            otp_code, expires_at = self._store[email]

            # 만료 확인
            if datetime.now() > expires_at:
                del self._store[email]
                print(f"[OTP Store] {email} 만료됨")
                return None

            return otp_code

    def delete(self, email: str):
        """OTP 코드 삭제"""
        with self._lock:
            if email in self._store:
                del self._store[email]
                print(f"[OTP Store] {email} 삭제됨")

    def cleanup_expired(self):
        """만료된 OTP 정리 (주기적으로 실행 가능)"""
        with self._lock:
            now = datetime.now()
            expired_keys = [
                email for email, (_, expires_at) in self._store.items()
                if now > expires_at
            ]
            for email in expired_keys:
                del self._store[email]
            if expired_keys:
                print(f"[OTP Store] 만료된 항목 {len(expired_keys)}개 정리됨")


# 싱글톤 인스턴스
_otp_store = OTPStore()


def get_otp_store() -> OTPStore:
    """OTP 저장소 인스턴스 반환"""
    return _otp_store