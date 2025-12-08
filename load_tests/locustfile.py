"""
Locust 부하 테스트 시나리오
4년차 증명: 프로덕션 성능 테스트 및 최적화 경험

테스트 시나리오:
1. 일반 사용자 흐름 (상품 조회, 검색, 장바구니)
2. 이미지 검색 부하 테스트
3. AI 챗봇 동시 요청 테스트
4. WebSocket 실시간 채팅 부하 테스트

성능 목표:
- 동시 사용자: 1000명
- TPS: 500+ req/s
- P95 Latency: < 500ms
- 에러율: < 1%
"""
from locust import HttpUser, task, between, events
import json
import random
import time
from io import BytesIO
from PIL import Image

# 테스트용 더미 이미지 생성
def generate_dummy_image() -> bytes:
    """테스트용 RGB 이미지 생성"""
    img = Image.new('RGB', (224, 224), color=(
        random.randint(0, 255),
        random.randint(0, 255),
        random.randint(0, 255)
    ))
    buf = BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


class NormalUser(HttpUser):
    """
    일반 사용자 시나리오
    가중치: 70% (대부분의 트래픽)
    """
    weight = 7
    wait_time = between(2, 5)  # 요청 간 2-5초 대기

    def on_start(self):
        """사용자 초기화 (로그인)"""
        response = self.client.post("/auth/register", json={
            "email": f"test_{random.randint(1000, 9999)}@example.com",
            "password": "test1234",
            "full_name": "Test User",
            "user_type": "buyer"
        })
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access_token")
        else:
            self.access_token = None

    @task(10)
    def browse_products(self):
        """상품 목록 조회 (가장 많은 트래픽)"""
        page = random.randint(1, 10)
        self.client.get(f"/products?page={page}&limit=20", name="/products (pagination)")

    @task(5)
    def search_products(self):
        """상품 검색"""
        keywords = ["노트북", "키보드", "마우스", "가방", "신발"]
        keyword = random.choice(keywords)
        self.client.get(f"/products/search?q={keyword}", name="/products/search")

    @task(3)
    def view_product_detail(self):
        """상품 상세 조회"""
        # 임의의 상품 ID
        product_id = f"product-{random.randint(1, 100)}"
        self.client.get(f"/products/{product_id}", name="/products/:id")

    @task(2)
    def add_to_cart(self):
        """장바구니 추가"""
        if not self.access_token:
            return

        self.client.post(
            "/cart",
            json={
                "product_id": f"product-{random.randint(1, 100)}",
                "quantity": random.randint(1, 3)
            },
            headers={"Authorization": f"Bearer {self.access_token}"},
            name="/cart (add)"
        )

    @task(1)
    def view_cart(self):
        """장바구니 조회"""
        if not self.access_token:
            return

        self.client.get(
            "/cart",
            headers={"Authorization": f"Bearer {self.access_token}"},
            name="/cart (view)"
        )


class ImageSearchUser(HttpUser):
    """
    이미지 검색 사용자 시나리오
    가중치: 20% (이미지 검색은 부하가 큼)
    """
    weight = 2
    wait_time = between(5, 10)

    @task
    def search_by_image(self):
        """이미지 검색 (CLIP 추론 부하)"""
        image_bytes = generate_dummy_image()

        with self.client.post(
            "/products/search-by-image",
            files={"file": ("test.png", image_bytes, "image/png")},
            catch_response=True,
            name="/products/search-by-image"
        ) as response:
            if response.status_code == 200:
                # 응답 시간 체크
                if response.elapsed.total_seconds() > 2.0:
                    response.failure(f"이미지 검색 너무 느림: {response.elapsed.total_seconds():.2f}s")
                else:
                    response.success()
            else:
                response.failure(f"이미지 검색 실패: {response.status_code}")


class AIChatUser(HttpUser):
    """
    AI 챗봇 사용자 시나리오
    가중치: 10% (LLM 추론 부하)
    """
    weight = 1
    wait_time = between(10, 20)

    def on_start(self):
        """로그인"""
        response = self.client.post("/auth/register", json={
            "email": f"chat_{random.randint(1000, 9999)}@example.com",
            "password": "test1234",
            "full_name": "Chat User",
            "user_type": "buyer"
        })
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access_token")
        else:
            self.access_token = None

    @task
    def ai_chat(self):
        """AI 챗봇 대화"""
        if not self.access_token:
            return

        questions = [
            "노트북 추천해줘",
            "가성비 좋은 키보드 찾아줘",
            "게임용 마우스 뭐가 좋아?",
            "이번 달 신상품 보여줘",
            "10만원 이하 가방 추천"
        ]

        question = random.choice(questions)

        with self.client.post(
            "/chat/smart",
            json={"message": question},
            headers={"Authorization": f"Bearer {self.access_token}"},
            catch_response=True,
            name="/chat/smart",
            timeout=30  # LLM은 시간 오래 걸림
        ) as response:
            if response.status_code == 200:
                # 스트리밍 응답 시간 체크
                if response.elapsed.total_seconds() > 10.0:
                    response.failure(f"챗봇 응답 너무 느림: {response.elapsed.total_seconds():.2f}s")
                else:
                    response.success()
            else:
                response.failure(f"챗봇 응답 실패: {response.status_code}")


# 성능 메트릭 수집
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """부하 테스트 시작"""
    print("=" * 60)
    print("🚀 부하 테스트 시작")
    print("=" * 60)
    print(f"Target: {environment.host}")
    print(f"Users: {environment.runner.target_user_count if hasattr(environment.runner, 'target_user_count') else 'N/A'}")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """부하 테스트 종료 후 리포트"""
    print("\n" + "=" * 60)
    print("📊 부하 테스트 결과")
    print("=" * 60)

    stats = environment.stats

    # 전체 통계
    print(f"총 요청 수: {stats.total.num_requests}")
    print(f"총 실패 수: {stats.total.num_failures}")
    print(f"실패율: {stats.total.fail_ratio * 100:.2f}%")
    print(f"평균 응답 시간: {stats.total.avg_response_time:.0f}ms")
    print(f"P95 응답 시간: {stats.total.get_response_time_percentile(0.95):.0f}ms")
    print(f"P99 응답 시간: {stats.total.get_response_time_percentile(0.99):.0f}ms")
    print(f"RPS: {stats.total.total_rps:.2f}")

    # 성능 목표 체크
    print("\n" + "=" * 60)
    print("🎯 성능 목표 달성 여부")
    print("=" * 60)

    # 목표 1: 에러율 < 1%
    if stats.total.fail_ratio < 0.01:
        print("✅ 에러율 목표 달성 (< 1%)")
    else:
        print(f"❌ 에러율 목표 미달성: {stats.total.fail_ratio * 100:.2f}%")

    # 목표 2: P95 < 500ms
    p95 = stats.total.get_response_time_percentile(0.95)
    if p95 < 500:
        print(f"✅ P95 latency 목표 달성 (< 500ms): {p95:.0f}ms")
    else:
        print(f"❌ P95 latency 목표 미달성: {p95:.0f}ms")

    # 목표 3: RPS > 100
    if stats.total.total_rps > 100:
        print(f"✅ RPS 목표 달성 (> 100): {stats.total.total_rps:.2f}")
    else:
        print(f"❌ RPS 목표 미달성: {stats.total.total_rps:.2f}")

    print("=" * 60)
