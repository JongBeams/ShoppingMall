# AI 쇼핑몰 플랫폼

AI 기반 상품 추천, 이미지 검색, RAG 챗봇이 통합된 전자상거래 플랫폼입니다.

## 주요 기능

### AI/ML 기능
- **RAG 기반 상품 추천**: pgvector + Ollama LLM으로 맥락 기반 답변
- **이미지 검색**: CLIP 모델로 유사 상품 찾기
- **개인화 추천**: 구매 이력 분석으로 맞춤 추천
- **선물 마법사**: 설문 기반 + LLM 추천 이유 생성

### 비즈니스 기능
- 일반 회원/판매자/관리자 역할 분리
- 포인트 시스템 (적립/사용/취소/자동만료)
- 토스페이먼츠 결제 연동 (3중 금액 검증)
- 실시간 알림 (주문/배송 상태별)
- 판매자 승인 시스템
- CRM 관리자 페이지

### 실시간 기능
- WebSocket 실시간 채팅
- 원격 제어 (관리자 → 사용자 화면)
- WebRTC 화면 공유
- SSE 스트리밍 응답

## 기술 스택

### Backend
- FastAPI 0.115.5
- Supabase (PostgreSQL + pgvector)
- Redis (Session + Cache)
- Ollama (LLM)
- Sentence Transformers (임베딩)
- PyTorch + CLIP (이미지 검색)

### Frontend
- Next.js 15 (App Router)
- Tailwind CSS 4
- React Query
- Axios

## 설치 및 실행

### 1. 사전 요구사항
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Supabase 프로젝트 (무료 플랜 가능)
- Ollama (LLM 서버)

### 2. 백엔드 설정

```bash
# 1. 환경 변수 설정
cd backend
cp .env.example .env
# .env 파일 수정 (Supabase URL, API 키 등)

# 2. Python 가상환경 생성 및 패키지 설치
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Redis 실행 (Docker)
docker-compose up -d redis

# 4. Supabase SQL 함수 실행
# Supabase 대시보드 > SQL Editor에서 다음 파일 실행:
# - backend/sql/create_vector_search_function.sql

# 5. 백엔드 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 설정

```bash
# 1. 환경 변수 설정
cd frontend
cp .env.example .env.local
# .env.local 파일 수정 (Backend URL, 토스 클라이언트 키 등)

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

### 4. Ollama 설정 (AI 기능 필수)

```bash
# Ollama 설치 (https://ollama.ai)
# LLM 모델 다운로드
ollama pull qwen2.5:14b

# Ollama 서버 실행 (기본 포트 11434)
ollama serve
```

## 환경 변수 설명

### Backend (.env)
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJxxx...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJxxx...` |
| `REDIS_URL` | Redis 연결 URL | `redis://localhost:6379/0` |
| `TOSS_SECRET_KEY` | 토스페이먼츠 Secret Key | `test_sk_xxx` |
| `OLLAMA_HOST` | Ollama API URL | `http://localhost:11434` |

### Frontend (.env.local)
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 Client Key | `test_ck_xxx` |


## 프로젝트 구조

```
├── backend/
│   ├── app/
│   │   ├── routers/       # API 엔드포인트 (19개)
│   │   ├── services/      # 비즈니스 로직
│   │   ├── models/        # Pydantic 모델
│   │   └── config/        # 설정
│   ├── sql/               # Supabase SQL 함수
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (pages)/       # Next.js 페이지
│   │   ├── components/    # React 컴포넌트
│   │   └── api/           # API 클라이언트
│   └── package.json
│
└── docker-compose.yml
```
