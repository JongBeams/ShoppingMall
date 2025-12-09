"""
쿠폰 자동 배급 테스트 스크립트
"""
import requests
import json
from datetime import datetime, timedelta

# 백엔드 URL
BASE_URL = "http://localhost:8000"

# 1. 로그인하여 토큰 받기 (판매자 계정 필요)
def login():
    """로그인하여 access token 받기"""
    # 여기에 실제 판매자 계정 정보를 입력하세요
    login_data = {
        "email": "seller@test.com",  # 판매자 이메일
        "password": "test1234"        # 비밀번호
    }

    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ 로그인 성공! Token: {token[:20]}...")
        return token
    else:
        print(f"❌ 로그인 실패: {response.text}")
        return None

# 2. 판매자 정보 조회
def get_vendor_info(token):
    """판매자 정보 조회"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/vendors/me", headers=headers)

    if response.status_code == 200:
        vendor = response.json()
        print(f"✅ 판매자 정보: ID={vendor['id']}, 업체명={vendor.get('business_name', 'N/A')}")
        return vendor["id"]
    else:
        print(f"❌ 판매자 정보 조회 실패: {response.text}")
        return None

# 3. 구매자 수 확인
def check_buyers_count(token):
    """구매자 수 확인 (디버그용)"""
    headers = {"Authorization": f"Bearer {token}"}
    # profiles 테이블의 is_business=false인 사용자 수 확인
    # 이 API는 없을 수 있으므로, 실제로는 Supabase에서 직접 확인해야 함
    print("ℹ️  Supabase에서 다음 쿼리로 구매자 수를 확인하세요:")
    print("   SELECT COUNT(*) FROM profiles WHERE is_business = false;")

# 4. 쿠폰 생성 (자동 배급 포함)
def create_coupon_with_auto_issue(token, vendor_id):
    """쿠폰 생성 및 자동 배급"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    now = datetime.now()
    end_date = now + timedelta(days=365)

    coupon_data = {
        "name": "테스트 자동배급 쿠폰",
        "code": "",  # 비워두면 자동 생성
        "discount_type": "percent",
        "discount_value": 10,
        "validity_days": 30,
        "start_at": now.strftime("%Y-%m-%dT%H:%M"),
        "end_at": end_date.strftime("%Y-%m-%dT%H:%M"),
        "vendor_id": vendor_id
    }

    # auto_issue_to_all=true로 요청
    response = requests.post(
        f"{BASE_URL}/api/coupons?auto_issue_to_all=true",
        headers=headers,
        json=coupon_data
    )

    if response.status_code == 201:
        coupon = response.json()
        print(f"✅ 쿠폰 생성 성공!")
        print(f"   - 쿠폰 ID: {coupon['id']}")
        print(f"   - 쿠폰 코드: {coupon.get('code', 'N/A')}")
        print(f"   - 쿠폰명: {coupon['name']}")
        return coupon["id"]
    else:
        print(f"❌ 쿠폰 생성 실패: {response.text}")
        return None

# 5. 쿠폰 통계 확인
def check_coupon_stats(token, coupon_id):
    """쿠폰 사용 통계 확인"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/coupons/{coupon_id}/stats", headers=headers)

    if response.status_code == 200:
        stats = response.json()
        print(f"✅ 쿠폰 통계:")
        print(f"   - 총 발급 수: {stats['total']}")
        print(f"   - 미사용: {stats['unused']}")
        print(f"   - 사용됨: {stats['used']}")

        if stats['total'] == 0:
            print("⚠️  경고: 쿠폰이 하나도 발급되지 않았습니다!")
            print("   - Supabase에서 is_business=false인 profiles가 있는지 확인하세요")
        else:
            print(f"✅ 성공: {stats['total']}개의 쿠폰이 자동 배급되었습니다!")

        return stats
    else:
        print(f"❌ 통계 조회 실패: {response.text}")
        return None

# 메인 실행
if __name__ == "__main__":
    print("=" * 60)
    print("쿠폰 자동 배급 테스트 시작")
    print("=" * 60)
    print()

    # 1. 로그인
    print("1. 로그인 중...")
    token = login()
    if not token:
        print("로그인에 실패하여 테스트를 중단합니다.")
        exit(1)
    print()

    # 2. 판매자 정보 조회
    print("2. 판매자 정보 조회 중...")
    vendor_id = get_vendor_info(token)
    if not vendor_id:
        print("판매자 정보 조회에 실패하여 테스트를 중단합니다.")
        exit(1)
    print()

    # 3. 구매자 수 확인 안내
    print("3. 구매자 수 확인")
    check_buyers_count(token)
    print()

    # 4. 쿠폰 생성
    print("4. 쿠폰 생성 중 (자동 배급 포함)...")
    coupon_id = create_coupon_with_auto_issue(token, vendor_id)
    if not coupon_id:
        print("쿠폰 생성에 실패하여 테스트를 중단합니다.")
        exit(1)
    print()

    # 5. 통계 확인
    print("5. 쿠폰 통계 확인 중...")
    stats = check_coupon_stats(token, coupon_id)
    print()

    print("=" * 60)
    print("테스트 완료!")
    print("=" * 60)
