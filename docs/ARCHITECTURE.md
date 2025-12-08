# 🏗️ 시스템 아키텍처

## 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Mobile App  │  │   Admin      │              │
│  │  (Next.js)   │  │(React Native)│  │   Dashboard  │              │
│  │   Port 3000  │  │              │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         └─────────────────┴──────────────────┘                       │
│                           │                                           │
└───────────────────────────┼───────────────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Nginx Proxy   │
                   │   (Port 80/443) │
                   │   SSL Termination│
                   └────────┬────────┘
                            │
┌───────────────────────────┼───────────────────────────────────────────┐
│                      API GATEWAY                                      │
├───────────────────────────┼───────────────────────────────────────────┤
│                           │                                           │
│           ┌───────────────▼───────────────┐                          │
│           │   FastAPI Backend             │                          │
│           │   (Python 3.11)               │                          │
│           │   Port 8000                   │                          │
│           │                               │                          │
│           │  ┌────────────────────────┐   │                          │
│           │  │  Rate Limiter          │   │  100 req/min            │
│           │  │  (SlowAPI + Redis)     │   │  2000 req/hour          │
│           │  └────────────────────────┘   │                          │
│           │                               │                          │
│           │  ┌────────────────────────┐   │                          │
│           │  │  Auth Middleware       │   │  JWT Validation          │
│           │  │  (JWT + Role Check)    │   │  Refresh Token          │
│           │  └────────────────────────┘   │                          │
│           │                               │                          │
│           │  ┌────────────────────────┐   │                          │
│           │  │  Metrics Middleware    │   │  Prometheus Export       │
│           │  │  (Prometheus)          │   │  /metrics               │
│           │  └────────────────────────┘   │                          │
│           └───────────────┬───────────────┘                          │
│                           │                                           │
└───────────────────────────┼───────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼───────┐
│   Service      │  │   Service      │  │  Background  │
│   Layer        │  │   Layer        │  │  Jobs        │
│                │  │                │  │              │
│ • Auth         │  │ • AI/ML        │  │  Celery      │
│ • Product      │  │   - CLIP       │  │  Workers     │
│ • Order        │  │   - RAG        │  │              │
│ • Payment      │  │   - LLM        │  │ • Embedding  │
│ • Cart         │  │ • Embedding    │  │ • Email      │
│ • Review       │  │ • Recommend    │  │ • Analytics  │
│ • Points       │  │ • Intent       │  │ • Stats      │
│ • Subscription │  │   Classifier   │  │              │
└───────┬────────┘  └───────┬────────┘  └──────┬───────┘
        │                   │                   │
        │                   │                   │
┌───────┴───────────────────┴───────────────────┴───────────────────────┐
│                         DATA LAYER                                    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │   PostgreSQL       │  │    Redis       │  │   Supabase       │   │
│  │   (Supabase)       │  │    Cache       │  │   Storage        │   │
│  │                    │  │                │  │                  │   │
│  │ • Main DB          │  │ • Sessions     │  │ • Product Images │   │
│  │ • pgvector         │  │ • OTP Codes    │  │ • User Avatars   │   │
│  │   - 512D (CLIP)    │  │ • Refresh Token│  │ • Document Files │   │
│  │   - 1024D (BGE-M3) │  │ • Rate Limit   │  │ • CDN Delivery   │   │
│  │ • 34 Tables        │  │   Counters     │  │                  │   │
│  │ • Row-Level        │  │ • Job Queue    │  │                  │   │
│  │   Security (RLS)   │  │                │  │                  │   │
│  └────────────────────┘  └────────────────┘  └──────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Ollama     │  │     Toss     │  │    SMTP      │               │
│  │   LLM API    │  │   Payments   │  │   Email      │               │
│  │              │  │              │  │   Service    │               │
│  │ • Qwen 2.5   │  │ • Payment    │  │              │               │
│  │   14B Model  │  │   Gateway    │  │ • OTP Send   │               │
│  │ • Streaming  │  │ • Webhook    │  │ • Order      │               │
│  │   Responses  │  │   Callback   │  │   Confirm    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                  MONITORING & OBSERVABILITY                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Prometheus  │  │   Grafana    │  │   Loki       │               │
│  │  (Metrics)   │─▶│ (Dashboard)  │◀─│  (Logs)      │               │
│  │  Port 9090   │  │  Port 3001   │  │  Port 3100   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐                                  │
│  │ AlertManager │  │   Sentry     │                                  │
│  │ (Alerts)     │  │ (Error Track)│                                  │
│  │  Port 9093   │  │  Production  │                                  │
│  └──────────────┘  └──────────────┘                                  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## 주요 기술 스택

### Backend
- **Framework**: FastAPI 0.104+ (Python 3.11)
- **Database**: PostgreSQL 15 (Supabase)
- **Cache**: Redis 7
- **ORM**: Supabase Client (Python SDK)
- **Validation**: Pydantic v2

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **API Client**: React Query (TanStack Query)

### AI/ML
- **Image Embedding**: CLIP (openai/clip-vit-base-patch32)
- **Text Embedding**: BGE-M3 (BAAI/bge-m3)
- **LLM**: Qwen 2.5 14B (via Ollama)
- **Vector DB**: pgvector (PostgreSQL extension)
- **Optimization**: ONNX Runtime, GPU acceleration

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: AWS EC2
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana + Loki
- **Error Tracking**: Sentry

### External Services
- **Payment**: Toss Payments API
- **Email**: SMTP (Gmail/SendGrid)
- **Storage**: Supabase Storage (S3-compatible)
- **Authentication**: Supabase Auth + JWT

## 데이터 플로우

### 1. 사용자 인증 플로우
```
User → [Login Request] → FastAPI
         ↓
    Check Email + Password Hash
         ↓
    Generate Access Token (2hr) + Refresh Token (7d)
         ↓
    Store Refresh Token in Redis (TTL: 7d)
         ↓
    Return {access_token, refresh_token, user}
         ↓
    Client stores tokens in localStorage/cookies
```

### 2. 이미지 검색 플로우
```
User uploads image → Frontend (Base64)
         ↓
    POST /products/search-by-image
         ↓
    Download image from URL/Base64
         ↓
    CLIP Model generates 512D embedding
         ↓
    pgvector cosine similarity search
         ↓
    SELECT * FROM products
    ORDER BY image_embedding <=> query_embedding
    LIMIT 20
         ↓
    Return matched products with similarity scores
```

### 3. RAG 챗봇 플로우
```
User question → POST /chat/smart
         ↓
    BGE-M3 embed query (1024D)
         ↓
    Search document_chunks by embedding similarity
         ↓
    Retrieve top 3 relevant documents
         ↓
    [Optional] Get personalized recommendations if user logged in
         ↓
    Build LLM prompt with context + user history
         ↓
    Stream response from Ollama (Qwen 2.5 14B)
         ↓
    Server-Sent Events (SSE) to frontend
         ↓
    Display streaming text in real-time
```

### 4. 결제 플로우
```
User clicks "결제하기" → Frontend
         ↓
    POST /orders (create pending order)
         ↓
    Return toss_order_id (nanoid)
         ↓
    Frontend calls Toss Payments SDK
         ↓
    User completes payment on Toss UI
         ↓
    Toss redirects to success URL with {orderId, paymentKey, amount}
         ↓
    POST /orders/success
         ↓
    Backend validates amount (3-way check)
         ↓
    Call Toss API: POST /confirm
         ↓
    Update order status to "paid"
         ↓
    [Background Job] Deduct stock, earn points, send email
         ↓
    Return order confirmation
```

### 5. 선물 추천 플로우
```
User answers questions → POST /gift-wizard/recommendations
         ↓
    Filter products by budget, tags, style, age
         ↓
    Fetch 50 candidate products
         ↓
    Build LLM prompt with recipient info + products
         ↓
    Stream response from Ollama
         ↓
    Parse JSON: top 3 recommendations + reasons + messages
         ↓
    Map product_number to actual product IDs
         ↓
    Return structured recommendations (streaming)
```

## 보안 설계

### 인증/인가
- **JWT Token**: Access Token (2시간), Refresh Token (7일)
- **Token Rotation**: Refresh 시마다 새 Refresh Token 발급
- **Password Hashing**: bcrypt (10 rounds)
- **OTP Verification**: Redis 저장 (5분 TTL)

### API 보호
- **Rate Limiting**: 100 req/min, 2000 req/hour, 10000 req/day
- **CORS**: 화이트리스트 도메인만 허용
- **Input Validation**: Pydantic 스키마로 타입/범위 검증
- **SQL Injection 방지**: Parameterized queries (ORM)
- **XSS 방지**: Content-Security-Policy 헤더

### 데이터 보호
- **Row-Level Security (RLS)**: Supabase 테이블 단위 접근 제어
- **Sensitive Data Masking**: 카드번호 마스킹 (1234-****-****-5678)
- **HTTPS Only**: Production 환경 강제
- **Environment Variables**: .env 파일로 민감 정보 관리

## 성능 최적화

### Database
- **Indexing**: 주요 쿼리 컬럼에 B-tree/GIN/HNSW 인덱스
- **Connection Pooling**: 최대 20개 커넥션 재사용
- **N+1 방지**: Batch fetching, JOIN 활용
- **Read/Write Splitting**: 읽기 전용 쿼리는 replica로 분산

### Caching
- **Redis TTL**:
  - 카테고리: 1시간
  - 시스템 설정: 5분
  - OTP: 5분 (자동 만료)
- **In-Memory**: Singleton 패턴으로 ML 모델 1회 로드
- **CDN**: Supabase Storage (전세계 엣지 캐싱)

### API
- **Async I/O**: 모든 I/O 작업 비동기 처리
- **Streaming**: LLM 응답 Server-Sent Events로 실시간 전송
- **Compression**: gzip 응답 압축
- **Pagination**: Limit/Offset 또는 Cursor 기반

### AI/ML
- **ONNX Optimization**: 추론 속도 10배 개선 (500ms → 50ms)
- **GPU Acceleration**: CUDA 사용 가능 시 자동 활성화
- **Batch Processing**: 이미지 임베딩 32개씩 배치 처리
- **Model Caching**: 임베딩 모델 메모리 상주

## 확장성 설계

### Horizontal Scaling
- **Stateless API**: JWT 인증으로 서버 간 세션 공유 불필요
- **Load Balancer**: Nginx upstream으로 여러 백엔드 인스턴스 분산
- **Container Orchestration**: Kubernetes 배포 준비 완료

### Vertical Scaling
- **Multi-threading**: Uvicorn workers (CPU 코어 수만큼)
- **GPU Support**: CLIP/BGE 모델 GPU 추론 지원
- **Database Sharding**: User ID 기반 샤딩 가능

### Asynchronous Processing
- **Celery Workers**: 무거운 작업 백그라운드 처리
  - 이미지 임베딩 생성
  - 이메일 발송
  - 통계 집계
  - 리뷰 AI 요약
- **Message Queue**: RabbitMQ (확장 가능)
- **Retry Logic**: 실패 시 지수 백오프로 재시도

## 모니터링 & 알림

### 메트릭 수집
- **Prometheus**:
  - HTTP 요청 수/응답 시간/에러율
  - 이미지 검색 횟수
  - 동시 접속자 수
  - DB 쿼리 시간
- **Grafana 대시보드**:
  - 실시간 트래픽 그래프
  - 에러율 추이
  - API 레이턴시 P50/P95/P99
  - 시스템 리소스 (CPU/메모리/디스크)

### 로그 수집
- **Loki**: 구조화된 로그 저장
- **Promtail**: 로그 수집 에이전트
- **Grafana**: 로그 검색 및 필터링

### 알림
- **AlertManager**: 임계치 초과 시 알림
  - 에러율 > 1%
  - API 응답 시간 > 1초
  - 디스크 사용량 > 80%
- **Slack Webhook**: CI/CD 배포 성공/실패 알림
- **Sentry**: 프로덕션 에러 실시간 추적

## CI/CD 파이프라인

### Continuous Integration
1. **코드 푸시** → GitHub
2. **자동 테스트**:
   - Backend: pytest, pylint, mypy, black
   - Frontend: jest, eslint, type-check
3. **보안 스캔**: Trivy vulnerability scan
4. **의존성 검사**: Safety (Python), npm audit (JavaScript)
5. **코드 리뷰**: PR 자동 리뷰 코멘트

### Continuous Deployment
1. **Docker 이미지 빌드**:
   - Backend: Python 3.11 + FastAPI
   - Frontend: Node 18 + Next.js
2. **Docker Hub 푸시**: latest + SHA 태그
3. **EC2 배포**:
   - SSH 접속
   - Docker Compose Pull
   - 기존 컨테이너 중지
   - 새 컨테이너 시작
4. **Health Check**: /health 엔드포인트 확인
5. **Slack 알림**: 배포 성공/실패 통보

### Rollback
- **수동 트리거**: GitHub Actions workflow_dispatch
- **이전 이미지로 복구**: SHA 태그 기반
- **빠른 롤백**: 5분 이내 복구 가능

## 재해 복구 (Disaster Recovery)

### 백업
- **Database**: Supabase 자동 백업 (매일 0시)
- **Redis**: AOF 모드로 디스크 저장
- **Storage**: Supabase Storage 자동 복제

### 복구 절차
1. **Database**: Supabase 콘솔에서 특정 시점 복구
2. **Redis**: AOF 파일로 복구
3. **Application**: Docker 이미지 재배포

### 고가용성 (High Availability)
- **Multi-AZ**: Supabase는 다중 가용 영역 자동 지원
- **Load Balancer**: Nginx 헬스체크로 장애 서버 제외
- **Auto-restart**: Docker Compose restart policy (always)
