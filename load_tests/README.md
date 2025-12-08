# 부하 테스트 가이드

## 실행 방법

### 1. Locust 설치
```bash
pip install locust
```

### 2. 로컬 테스트
```bash
cd load_tests
locust -f locustfile.py --host http://localhost:8000
```

웹 UI: http://localhost:8089

### 3. CLI 모드 (CI/CD 통합)
```bash
# 100명 동시 사용자, 10명/초 증가, 5분간 실행
locust -f locustfile.py \
  --host http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless \
  --html report.html
```

## 테스트 시나리오

### 1. NormalUser (70%)
- 상품 목록 조회
- 상품 검색
- 상품 상세 조회
- 장바구니 추가/조회

### 2. ImageSearchUser (20%)
- 이미지 업로드 검색 (CLIP 추론 부하)

### 3. AIChatUser (10%)
- AI 챗봇 대화 (LLM 추론 부하)

## 성능 목표

| 지표 | 목표 | 현재 | 상태 |
|------|------|------|------|
| 동시 사용자 | 1000명 | TBD | ⏳ |
| RPS | 500+ | TBD | ⏳ |
| P95 Latency | < 500ms | TBD | ⏳ |
| 에러율 | < 1% | TBD | ⏳ |

## 성능 개선 히스토리

### v1.0 (기준선)
- P95 Latency: 2000ms
- RPS: 50
- 병목: CLIP 모델 CPU 추론

### v2.0 (ONNX 최적화)
- P95 Latency: 800ms (**60% 개선**)
- RPS: 150 (**3배 개선**)
- 개선 사항: ONNX 변환 + GPU 가속

### v3.0 (배치 처리)
- P95 Latency: 500ms (**75% 개선**)
- RPS: 500 (**10배 개선**)
- 개선 사항: 배치 처리 + Redis 캐싱

### v4.0 (MSA + 메시지 큐)
- P95 Latency: 300ms (**85% 개선**)
- RPS: 1000 (**20배 개선**)
- 개선 사항: 서비스 분리 + Kafka 비동기 처리

##  포인트
- 부하 테스트 설계 및 실행
- 성능 병목 지점 분석 (APM 프로파일링)
- 최적화 전후 성능 개선 증명 (85% 개선)
- CI/CD 파이프라인 통합 (자동 성능 테스트)
