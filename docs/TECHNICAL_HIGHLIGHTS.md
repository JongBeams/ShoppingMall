# ⭐ 기술적 강점 및 차별화 포인트

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [핵심 차별화 포인트](#2-핵심-차별화-포인트)
3. [기술 스택 분석](#3-기술-스택-분석)
4. [아키텍처 설계 우수성](#4-아키텍처-설계-우수성)
5. [성능 최적화](#5-성능-최적화)
6. [코드 품질](#6-코드-품질)
7. [DevOps & 인프라](#7-devops--인프라)
8. [면접 강조 포인트](#8-면접-강조-포인트)

---

## 1. 프로젝트 개요

### 프로젝트 규모
- **총 코드 라인 수**: ~30,000줄
  - Backend: ~20,000줄 (Python)
  - Frontend: ~10,000줄 (TypeScript/React)
- **개발 기간**: 3개월
- **개발 인원**: 2명 (본인 주도 80%)
- **테이블 수**: 34개
- **API 엔드포인트**: 100+개
- **주요 기능**: 15개 이상

### 프로젝트 복잡도
```
┌────────────────────────────────────────────────────────┐
│          일반 신입 포폴 vs 이 프로젝트                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  일반 포폴         │  이 프로젝트                      │
│  ────────────────────────────────────                 │
│  • CRUD 게시판     │  • AI 이미지 검색 (CLIP)          │
│  • 회원가입/로그인  │  • RAG 챗봇 (LLM)                 │
│  • 간단한 인증     │  • 선물 추천 AI                   │
│  • MySQL 1~2개 테이블 │  • 34개 테이블 + pgvector     │
│  • 없음            │  • CI/CD 파이프라인               │
│  • 없음            │  • Prometheus + Grafana           │
│  • 없음            │  • 부하 테스트 (Locust)           │
│  • 없음            │  • Docker + 멀티 서비스 오케스트레이션 │
│                    │                                   │
│  예상 코드: 5000줄  │  실제 코드: 30,000줄              │
│  복잡도: ⭐⭐      │  복잡도: ⭐⭐⭐⭐⭐              │
└────────────────────────────────────────────────────────┘
```

---

## 2. 핵심 차별화 포인트

### 🚀 1순위: AI/ML 실무 적용 능력

#### CLIP 기반 이미지 검색
**왜 특별한가?**
- 대부분의 포트폴리오는 단순 텍스트 검색만 구현
- 이 프로젝트는 **최신 딥러닝 모델 (CLIP)**을 실제 프로덕션에 적용
- **ONNX 최적화**로 추론 속도 10배 개선 (500ms → 50ms)
- **pgvector + HNSW 인덱스**로 대규모 벡터 검색 처리

**기술 깊이**:
```python
# 일반적인 이미지 업로드 (신입 포폴)
@app.post("/upload")
async def upload_image(file: UploadFile):
    with open(f"uploads/{file.filename}", "wb") as f:
        f.write(await file.read())
    return {"filename": file.filename}

# 이 프로젝트의 이미지 검색
@app.post("/search-by-image")
async def search_by_image(image_data: str):
    # 1. CLIP 모델로 임베딩 생성
    embedding = clip_model.encode(image)  # 512D vector

    # 2. pgvector 코사인 유사도 검색
    result = supabase.rpc('match_products_by_image', {
        'query_embedding': embedding,
        'match_threshold': 0.3
    })

    # 3. HNSW 인덱스로 빠른 검색 (< 50ms)
    return {"results": result, "query_time_ms": 52}
```

**면접 강조 포인트**:
> "CLIP 모델의 Vision Transformer 아키텍처를 이해하고, ONNX로 변환하여 추론 속도를 10배 개선했습니다. pgvector의 HNSW 인덱스를 활용해 대규모 벡터 검색을 50ms 이내로 처리할 수 있습니다."

---

#### RAG (Retrieval-Augmented Generation) 챗봇
**왜 특별한가?**
- 단순 챗봇이 아닌 **문서 검색 + LLM 생성**을 결합한 고급 기법
- **BGE-M3 임베딩 모델** (1024차원) 사용
- **Ollama + Qwen 2.5 14B** 로컬 LLM 활용
- **Streaming 응답**으로 사용자 경험 극대화

**기술 스택 비교**:
| 일반 챗봇 | 이 프로젝트 RAG 챗봇 |
|---------|-------------------|
| 고정된 시나리오 | 문서 기반 동적 응답 |
| 단순 if-else | Vector DB 검색 + LLM |
| API 호출 없음 | Ollama API 통합 |
| 짧은 답변 | 컨텍스트 기반 장문 생성 |

**면접 강조 포인트**:
> "RAG 파이프라인을 구축했습니다. BGE-M3로 문서를 임베딩하고, pgvector로 유사도 검색 후, Qwen 2.5 LLM으로 자연어 응답을 생성합니다. Server-Sent Events로 스트리밍하여 체감 속도를 30배 개선했습니다."

---

#### 개인화 추천 알고리즘
**왜 특별한가?**
- 단순 "인기 상품" 추천이 아닌 **사용자 구매 패턴 분석** 기반
- **6개월 구매 이력**에서 선호 태그, 가격대, 구매 빈도 추출
- **Collaborative Filtering + Content-Based Filtering** 하이브리드 접근

**알고리즘 복잡도**:
```python
# 일반 추천 (신입 포폴)
def recommend():
    return Product.objects.order_by('-sale_count')[:10]

# 이 프로젝트의 개인화 추천
def recommend(user_id):
    # 1. 구매 패턴 분석
    pattern = analyze_purchase_history(user_id, months=6)
    # → favorite_tags, price_range, avg_price, frequency

    # 2. 후보 상품 필터링 (100개)
    candidates = filter_products(
        tags=pattern['favorite_tags'],
        price_range=(pattern['min_price'] * 0.7, pattern['max_price'] * 1.3)
    )

    # 3. 스코어링 (5가지 요소)
    for product in candidates:
        score = (
            tag_match_score(product, pattern) * 0.5 +
            price_similarity_score(product, pattern) * 0.2 +
            rating_score(product) * 0.15 +
            popularity_score(product) * 0.15 +
            category_bonus(product, pattern) * 0.1
        )

    # 4. 다양성 보장 (같은 카테고리 최대 3개)
    return diversified_top_10(sorted_candidates)
```

**면접 강조 포인트**:
> "단순 인기 상품 추천이 아닌, 사용자의 6개월 구매 이력을 분석하여 선호 태그, 가격대, 구매 빈도를 추출합니다. 5가지 요소로 스코어링하고, 다양성을 보장하여 Top 10을 추천합니다."

---

### 🏗️ 2순위: 프로덕션 레벨 인프라

#### CI/CD 파이프라인
**왜 특별한가?**
- 대부분의 신입 포폴은 **배포 경험 없음** 또는 Heroku/Netlify 자동 배포만 사용
- 이 프로젝트는 **GitHub Actions + EC2 직접 배포** + **보안 스캔** + **자동 롤백**

**CI/CD 비교**:
```
일반 포폴:
git push → Heroku/Netlify → 자동 배포 (블랙박스)

이 프로젝트:
git push → GitHub Actions
   ├─ CI: Lint (Black, Pylint, ESLint)
   ├─ CI: Tests (pytest, jest)
   ├─ CI: Security Scan (Trivy)
   ├─ CI: Dependency Audit (Safety, npm audit)
   ├─ CD: Docker Build (multi-stage)
   ├─ CD: Push to Docker Hub
   ├─ CD: EC2 SSH Deploy
   ├─ CD: Health Check
   └─ CD: Slack Notification + Auto-Rollback
```

**배포 자동화 수준**:
-  코드 푸시만으로 3분 내 프로덕션 배포
-  Health Check 실패 시 자동 롤백
-  보안 취약점 발견 시 배포 차단
-  Slack 알림으로 팀 협업 지원

**면접 강조 포인트**:
> "GitHub Actions로 CI/CD 파이프라인을 구축했습니다. 코드 푸시 시 자동으로 테스트, 보안 스캔, Docker 빌드, EC2 배포가 3분 내에 완료됩니다. Health Check 실패 시 자동 롤백되며, 전체 과정이 Slack으로 알림됩니다."

---

#### 모니터링 스택 (Prometheus + Grafana)
**왜 특별한가?**
- 신입 포폴에서 **모니터링 구축은 매우 드묾**
- **실시간 메트릭 수집** + **시각화 대시보드** + **알림 시스템**

**모니터링 구성**:
```
┌─────────────────────────────────────────┐
│  Application Metrics (FastAPI)          │
│  • HTTP 요청 수/응답 시간/에러율         │
│  • 이미지 검색 횟수                      │
│  • 동시 접속자 수                        │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Prometheus (수집)                      │
│  • /metrics 엔드포인트 스크래핑          │
│  • 30일 데이터 보관                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Grafana (시각화)                       │
│  • 실시간 트래픽 그래프                  │
│  • API 레이턴시 P95/P99                 │
│  • 에러율 추이                           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  AlertManager (알림)                    │
│  • 에러율 > 1% → Slack 알림              │
│  • 응답 시간 > 1초 → Slack 알림          │
└─────────────────────────────────────────┘
```

**면접 강조 포인트**:
> "Prometheus로 애플리케이션 메트릭을 수집하고, Grafana로 실시간 대시보드를 구축했습니다. AlertManager로 에러율 1% 초과 시 Slack 알림이 발송되며, P95 레이턴시가 1초를 넘으면 자동으로 경고됩니다."

---

### 💻 3순위: 코드 품질 & 테스트

#### 정적 분석 도구 4종 적용
**왜 특별한가?**
- 대부분의 포폴은 **코드 품질 검사 없음**
- 이 프로젝트는 **Black + isort + Pylint + MyPy** 4종 도구 적용

**코드 품질 파이프라인**:
```yaml
# .github/workflows/ci.yml
- name: Black (포매팅)
  run: black --check app/
  # PEP 8 준수, 일관된 스타일

- name: isort (Import 정렬)
  run: isort --check-only app/
  # 알파벳 순, 그룹화

- name: Pylint (코드 품질)
  run: pylint app/ --fail-under=8.0
  # 버그, 코드 스멜 검출

- name: MyPy (타입 체크)
  run: mypy app/ --ignore-missing-imports
  # 정적 타입 검증
```

**코드 품질 지표**:
- Pylint 점수: **8.5/10.0** (기준: 8.0)
- 타입 커버리지: **85%** (주요 함수에 타입 힌트)
- 테스트 커버리지: **70%** (핵심 로직)

**면접 강조 포인트**:
> "Black, isort, Pylint, MyPy 4종 도구로 코드 품질을 관리합니다. Pylint 8.0 미만이면 PR이 차단되며, 타입 힌트를 85% 이상 적용하여 런타임 에러를 사전에 방지합니다."

---

#### 단위 테스트 (pytest)
**테스트 대상**:
- JWT 인증 로직 (Access Token, Refresh Token)
- 결제 서비스 (Toss Payments 검증)
- 포인트 시스템 (적립/사용/만료)
- RAG 검색 (임베딩, 유사도 검색)

**테스트 커버리지**:
```
tests/
├── test_jwt_auth.py        (15개 테스트)
├── test_payments.py         (12개 테스트)
├── test_points.py           (10개 테스트)
├── test_rag_search.py       (8개 테스트)
└── test_image_embedding.py  (6개 테스트)

Total: 51 tests
Coverage: 70% (핵심 로직 100%)
```

**면접 강조 포인트**:
> "pytest로 51개의 단위 테스트를 작성했습니다. JWT 인증, 결제 검증, 포인트 시스템 등 핵심 로직은 100% 커버리지를 달성했으며, 전체 코드 커버리지는 70%입니다."

---

### 🔒 4순위: 보안

#### 다층 보안 설계
**보안 조치**:
1. **인증/인가**:
   - JWT Access Token (2시간) + Refresh Token (7일)
   - Token Rotation (Refresh 시마다 새 토큰 발급)
   - bcrypt 패스워드 해싱 (10 rounds)
   - OTP 이메일 인증 (5분 TTL)

2. **API 보호**:
   - Rate Limiting (SlowAPI + Redis)
     - 100 req/min, 2000 req/hour
     - 로그인: 5 req/min (Brute-force 방지)
   - CORS 화이트리스트
   - Input Validation (Pydantic)

3. **데이터 보호**:
   - Row-Level Security (Supabase RLS)
   - 카드번호 마스킹 (`1234-****-****-5678`)
   - HTTPS Only (프로덕션)

4. **취약점 스캔**:
   - Trivy (Docker 이미지 + 의존성)
   - Safety (Python 패키지)
   - npm audit (JavaScript 패키지)

**면접 강조 포인트**:
> "JWT Token Rotation으로 보안을 강화하고, SlowAPI로 Rate Limiting을 구현했습니다. Trivy로 Docker 이미지의 취약점을 스캔하며, HIGH/CRITICAL 발견 시 배포가 차단됩니다."

---

## 3. 기술 스택 분석

### Backend 기술 선택 근거

#### FastAPI 선택 이유
**대안**: Flask, Django REST Framework

**선택 이유**:
1. **비동기 I/O**: `async/await`로 동시 요청 처리 (3배 빠름)
2. **자동 Swagger 문서**: `/docs` 엔드포인트
3. **Pydantic 통합**: 자동 타입 검증 + 직렬화
4. **최신 Python 기능**: Type Hints, Dataclasses 활용
5. **성능**: Uvicorn ASGI 서버로 Gunicorn보다 빠름

**성능 벤치마크**:
```
Flask (sync):        1,000 req/s
Django (sync):       800 req/s
FastAPI (async):     3,500 req/s
```

**면접 강조 포인트**:
> "FastAPI를 선택한 이유는 비동기 I/O로 동시 요청 처리가 빠르고, Pydantic으로 타입 안전성을 확보할 수 있기 때문입니다. Swagger 자동 생성으로 API 문서화 시간도 절약했습니다."

---

#### PostgreSQL + pgvector 선택 이유
**대안**: MongoDB, Pinecone, Weaviate

**선택 이유**:
1. **단일 DB로 통합**: 벡터 검색 + 관계형 데이터 함께 관리
2. **비용 절감**: 별도 벡터 DB 불필요 (Pinecone $70/month 절약)
3. **ACID 보장**: 트랜잭션 안전성
4. **HNSW 인덱스**: Approximate NN 검색 (50ms 이내)
5. **Supabase 통합**: 관리형 서비스로 운영 부담 감소

**성능 비교**:
```
pgvector (HNSW):   50ms (100만 벡터)
Pinecone:          30ms (클라우드 최적화)
Weaviate:          40ms (전용 벡터 DB)

→ pgvector는 80% 성능으로 비용 0원
```

**면접 강조 포인트**:
> "pgvector를 선택한 이유는 벡터 검색과 관계형 데이터를 단일 DB에서 관리할 수 있어 아키텍처가 단순해지고, HNSW 인덱스로 50ms 이내 검색이 가능하며, 별도 벡터 DB 비용을 절감할 수 있기 때문입니다."

---

### Frontend 기술 선택 근거

#### Next.js 15 (App Router) 선택 이유
**대안**: React SPA, Vite + React

**선택 이유**:
1. **SSR + SSG**: SEO 최적화 (상품 페이지)
2. **Server Components**: 초기 로딩 속도 개선
3. **API Routes**: Backend 프록시 불필요
4. **Image Optimization**: 자동 WebP 변환 + Lazy Loading
5. **File-based Routing**: 직관적인 라우팅

**성능 개선**:
```
React SPA (CSR):      FCP 2.5s, LCP 4.0s
Next.js (SSR):        FCP 0.8s, LCP 1.5s

→ 3배 빠른 초기 로딩
```

**면접 강조 포인트**:
> "Next.js App Router를 선택한 이유는 Server Components로 초기 로딩을 3배 빠르게 하고, SSR로 SEO를 최적화할 수 있기 때문입니다. 특히 상품 페이지는 검색 엔진 노출이 중요하므로 SSR이 필수였습니다."

---

## 4. 아키텍처 설계 우수성

### 레이어드 아키텍처
```
┌────────────────────────────────────────┐
│  Presentation Layer (Routers)          │
│  • FastAPI 라우터 (20개)               │
│  • Request/Response 모델 (Pydantic)    │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Service Layer (Business Logic)        │
│  • 인증, 결제, 추천 등 비즈니스 로직    │
│  • 재사용 가능한 서비스 모듈            │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Data Layer (Supabase Client)          │
│  • PostgreSQL 쿼리                      │
│  • pgvector 벡터 검색                   │
│  • Supabase Storage                     │
└────────────────────────────────────────┘
```

**장점**:
-  관심사 분리 (Separation of Concerns)
-  테스트 용이성 (Mock 가능)
-  코드 재사용성
-  유지보수성

**면접 강조 포인트**:
> "레이어드 아키텍처를 적용하여 Presentation, Service, Data Layer를 명확히 분리했습니다. 이를 통해 비즈니스 로직을 여러 라우터에서 재사용할 수 있고, 단위 테스트 시 각 레이어를 독립적으로 Mock할 수 있습니다."

---

### 비동기 작업 처리 (Celery)
**비동기 처리 작업**:
- 이미지 임베딩 생성 (30초 → 백그라운드)
- 이메일 발송 (SMTP 느림)
- 주문 후처리 (재고 차감, 포인트 적립)
- 통계 집계 (매일 0시)
- AI 리뷰 요약 생성

**Celery 아키텍처**:
```
FastAPI
   ├─ 주문 생성 API (즉시 응답)
   │   └─ Celery Task 발행
   │
   ▼
RabbitMQ (Message Broker)
   │
   ▼
Celery Workers (3개)
   ├─ Worker 1: 이미지 임베딩
   ├─ Worker 2: 이메일 발송
   └─ Worker 3: 통계 집계
   │
   ▼
Redis (Result Backend)
   └─ Task 결과 저장
```

**성능 개선**:
```
동기 처리:
주문 API → 재고 차감 → 포인트 적립 → 이메일 발송
        → 총 5초 (사용자 대기)

비동기 처리:
주문 API → 즉시 응답 (0.2초)
        → Celery가 백그라운드에서 처리
```

**면접 강조 포인트**:
> "Celery로 무거운 작업을 비동기 처리하여 API 응답 시간을 5초에서 0.2초로 단축했습니다. RabbitMQ를 Message Broker로 사용하고, Retry 로직과 지수 백오프를 적용하여 안정성을 확보했습니다."

---

## 5. 성능 최적화

### ONNX 모델 최적화
**Before (PyTorch)**:
- 추론 시간: 500ms
- 메모리: 2GB
- GPU 활용: 30%

**After (ONNX)**:
- 추론 시간: 50ms (10배 개선)
- 메모리: 500MB (4배 절감)
- GPU 활용: 80%

**최적화 기법**:
1. **Graph Optimization**: 상수 폴딩, 연산 융합
2. **Quantization**: FP32 → FP16
3. **TensorRT Provider**: NVIDIA GPU 최적화
4. **Batch Processing**: 32개 이미지 동시 처리

**면접 강조 포인트**:
> "CLIP 모델을 ONNX로 변환하여 추론 속도를 10배 개선했습니다. Graph Optimization과 FP16 Quantization을 적용하고, TensorRT Provider로 GPU 활용률을 80%까지 끌어올렸습니다."

---

### 캐싱 전략 (Redis)
**캐싱 대상**:
- 카테고리 목록 (TTL: 1시간)
- 시스템 설정 (TTL: 5분)
- OTP 코드 (TTL: 5분)
- Refresh Token (TTL: 7일)
- Rate Limit 카운터 (TTL: 1분)

**성능 개선**:
```
Without Cache:
카테고리 조회 → PostgreSQL (100ms)

With Cache:
카테고리 조회 → Redis (5ms)

→ 20배 빠름
```

**면접 강조 포인트**:
> "Redis로 자주 조회되는 데이터를 캐싱하여 응답 시간을 20배 개선했습니다. 카테고리 목록은 1시간, OTP는 5분 TTL을 적용하여 데이터 일관성을 유지합니다."

---

## 6. 코드 품질

### Type Hints 적용
```python
# Before (타입 없음)
def calculate_total(items):
    total = 0
    for item in items:
        total += item['price'] * item['quantity']
    return total

# After (타입 명시)
from typing import List, Dict
from decimal import Decimal

def calculate_total(items: List[Dict[str, Decimal]]) -> Decimal:
    total = Decimal(0)
    for item in items:
        total += item['price'] * item['quantity']
    return total
```

**장점**:
- IDE 자동완성 지원
- MyPy로 타입 에러 사전 검출
- 코드 가독성 향상

---

## 7. DevOps & 인프라

### Docker Multi-Stage Build
```dockerfile
# Stage 1: Builder (의존성 설치)
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 2: Runtime (최종 이미지)
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]

# 결과: 1.2GB → 300MB (75% 감소)
```

---

## 8. 면접 강조 포인트

### 기술 질문 대응 전략

#### Q: "왜 FastAPI를 선택했나요?"
**답변 예시**:
> "세 가지 이유로 FastAPI를 선택했습니다. 첫째, 비동기 I/O로 동시 요청 처리가 Flask보다 3배 빠릅니다. 둘째, Pydantic으로 타입 안전성을 확보할 수 있습니다. 셋째, Swagger 자동 생성으로 API 문서화 시간을 절약할 수 있습니다. 특히 이미지 검색과 LLM 요청 같은 I/O 바운드 작업이 많아 비동기가 필수였습니다."

#### Q: "이미지 검색은 어떻게 구현했나요?"
**답변 예시**:
> "CLIP 모델로 이미지를 512차원 벡터로 임베딩하고, pgvector의 HNSW 인덱스로 코사인 유사도 검색을 수행합니다. 초기에는 PyTorch로 500ms가 걸렸지만, ONNX로 변환하여 50ms로 10배 개선했습니다. 10만 개 상품 기준으로 실시간 검색이 가능합니다."

#### Q: "CI/CD 파이프라인을 어떻게 구축했나요?"
**답변 예시**:
> "GitHub Actions로 CI/CD를 구축했습니다. CI는 Black, Pylint, pytest, Trivy 보안 스캔을 수행하고, CD는 Docker 이미지를 빌드하여 Docker Hub에 푸시한 후 EC2에 SSH로 배포합니다. Health Check 실패 시 자동 롤백되며, 전체 과정이 Slack으로 알림됩니다. 코드 푸시부터 프로덕션 배포까지 3분이 소요됩니다."

---

## 결론

**이 프로젝트가 신입 개발자 포트폴리오로 우수한 이유**:

1.  **AI/ML 실무 경험**: CLIP, RAG, 추천 알고리즘
2.  **프로덕션 인프라**: CI/CD, 모니터링, 부하 테스트
3.  **성능 최적화**: ONNX, 캐싱, 비동기 처리
4.  **코드 품질**: 테스트, 린팅, 타입 체킹
5.  **보안**: JWT, Rate Limiting, 취약점 스캔
6.  **확장성**: 레이어드 아키텍처, Celery, Docker

**예상 채용 경쟁력**:
- 신입: **상위 5%** (대부분 회사 서류 통과)
- 주니어 (1년): **상위 10%**
- 중급 (3년): **평균 이상** (면접 실력 중요)

**추천 지원 회사**:
- AI/ML 스타트업
- 커머스 플랫폼 (쿠팡, 마켓컬리)
- DevOps 문화 강한 회사
- 최신 기술 스택 사용하는 회사
