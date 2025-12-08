"""
OTP 인증번호 저장소 (Redis 기반)
Redis를 사용하여 OTP를 임시 저장하고 서버 재시작 시에도 유지합니다.
"""
from typing import Optional
import redis
import os


class OTPStore:
    """OTP 인증번호를 Redis에 저장하는 클래스"""

    def __init__(self):
        # Redis 연결 (환경 변수에서 URL 가져오기)
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis = redis.from_url(redis_url, decode_responses=True)
        print(f"[OTP Store] Redis 연결: {redis_url}")

    def set(self, email: str, otp_code: str, ttl_seconds: int = 300):
        """OTP 코드 저장 (기본 TTL: 5분)"""
        key = f"otp:{email}"
        self._redis.setex(key, ttl_seconds, otp_code)
        print(f"[OTP Store] {email} 저장: {otp_code} (만료: {ttl_seconds}초)")

    def get(self, email: str) -> Optional[str]:
        """OTP 코드 조회 (만료된 경우 None 반환)"""
        key = f"otp:{email}"
        otp_code = self._redis.get(key)

        if otp_code is None:
            print(f"[OTP Store] {email} 없음 또는 만료됨")
            return None

        return otp_code

    def delete(self, email: str):
        """OTP 코드 삭제"""
        key = f"otp:{email}"
        deleted = self._redis.delete(key)
        if deleted:
            print(f"[OTP Store] {email} 삭제됨")

    def cleanup_expired(self):
        """Redis는 자동으로 TTL 만료 처리하므로 수동 정리 불필요"""
        pass


# 싱글톤 인스턴스
_otp_store = OTPStore()


def get_otp_store() -> OTPStore:
    """OTP 저장소 인스턴스 반환"""
    return _otp_store