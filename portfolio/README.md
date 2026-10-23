# RAG · LLM 포트폴리오 (자동 생성)

사용 매뉴얼과 같은 방식으로 만듭니다. HTML · CSS로 쪽을 그린 뒤 브라우저(Playwright · Chromium)로 PDF를 찍고,
같은 쪽을 2배 해상도로 찍어 PPTX를 만듭니다. 화면 캡처와 측정값도 실제 앱을 돌려서 얻습니다.

## 결과 파일

- `포트폴리오/AI쇼핑몰_RAG_LLM_포트폴리오.pdf` : 16:9 PDF (1280×720)
- `포트폴리오/AI쇼핑몰_RAG_LLM_포트폴리오.pptx` : 같은 쪽을 이미지로 넣은 PPT. 발표자 노트에 쪽별 설명이 들어 있습니다.

## 만드는 파일 (`portfolio/`)

| 파일 | 하는 일 |
|---|---|
| `pages.mjs` | 쪽별 문구 (제목, 설명, 표, 코드 발췌, 캡처 배치). 문구는 여기서만 고칩니다 |
| `portfolio.css` | 모양 (16:9 쪽, 색: RAG 인디고 · 비전 틸 · 생성 앰버) |
| `shots/` | 화면 캡처 그림 (`capture/`가 만듦) |
| `capture/capture.mjs` | 개발 웹 화면을 실제로 조작해 캡처하는 스크립트 (LLM 응답까지 기다림) |
| `data/metrics.json` | 측정값. `local-env/measure.py`가 만들고 빌드가 읽어 옵니다 (문항별 원본은 `data/eval_results.json`) |
| `data/visual.json` · `shots/thumbs/` | 이미지 검색 결과·구매 이력 시각화 데이터. `local-env/visual_data.py`가 실제 API로 만듭니다 |
| `build.mjs` | 위 파일들을 합쳐 PDF · PPTX를 찍는 빌드 (넘침 검사, 흐름도 생성기 `dg()` 포함) |
| `local-env/` | 원 서비스 DB(Supabase) 없이 앱을 돌리는 로컬 재현 환경 |

## 로컬 재현 환경 (`local-env/`)

원 서비스의 Supabase 프로젝트가 내려가 있어, 같은 백엔드 코드를 로컬 PostgreSQL에 붙여 돌립니다. `backend/` 코드는 수정하지 않습니다.

| 구성 | 역할 |
|---|---|
| PostgreSQL 17 · DB `shoppingmall_local` | `schema.sql` (코드가 실제로 쓰는 컬럼 기준). pgvector 대신 `float8[]` + 같은 이름의 RPC 함수 |
| PostgREST 16.5 (`.cache/bin`) | Supabase REST API 역할 |
| `gateway.py` (54321) | `/rest/v1` → PostgREST, `/auth/v1` 이메일 로그인, `/storage/v1` 파일 |
| fakeredis (6379) | Refresh Token · Rate Limit 저장소 |
| `run_backend.py` (18000) | 환경변수만 바꿔 백엔드 실행 (Ollama 11435 고정 주소 → 11434, Ollama 호출 타임아웃 최소 900초 — GPU를 다른 작업과 공유해 생성이 느린 PC 대비) |
| 프론트 (13000) | `next dev`, API 주소만 18000으로 |
| `seed.py` | 데모 데이터: 상품 43개(Unsplash 사진, CLIP 임베딩 실제 계산), 주문·리뷰, 규정 PDF 4개를 실제 업로드 API로 색인 |

데모 계정: 구매자 `demo@example.com` / `demo1234!`, 관리자 `admin@example.com` / `admin1234!`

## 고칠 때 (`portfolio` 폴더에서)

- 처음 한 번: `npm install` → `npm run env:setup` → `npm run env:start` (새 터미널) → `npm run env:seed`
- 문구만 바뀌면: `npm run build`
- 화면이 바뀌면: `npm run env:start` 상태에서 `npm run capture` (LLM 응답 포함 약 10분) → `npm run build`
- 측정을 다시 하려면: `npm run measure` → `python local-env/visual_data.py` → `npm run build`
- 쪽별 그림으로 확인: `npm run preview` (→ `preview/`)

필요한 것: PostgreSQL 17(비밀번호는 `PG_PASSWORD`, 기본 `admin`), Ollama + `qwen2.5:14b`, Python 백엔드 의존성, Node 20+.
