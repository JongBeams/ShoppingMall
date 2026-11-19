# RAG · LLM 포트폴리오 (자동 생성) — 최원준

사용 매뉴얼과 같은 방식으로 만듭니다. HTML · CSS로 쪽을 그린 뒤 브라우저(Playwright · Chromium)로 PDF를 찍고,
같은 쪽을 2배 해상도로 찍어 PPTX를 만듭니다. 화면 캡처와 측정값도 실제 앱을 돌려서 얻습니다.

## 결과 파일

- `AI쇼핑몰_RAG_LLM_포트폴리오.pdf` : 16:9 PDF (1280×720, 표지 + 20쪽 + 마무리 = 22쪽, 보고서형 · 요약 → 문제 → 설계 → 평가 → 확장)
- `AI쇼핑몰_RAG_LLM_포트폴리오.pptx` : 같은 쪽을 이미지로 넣은 PPT. 발표자 노트에 쪽별 설명이 들어 있습니다.

## 만드는 파일 (이 폴더)

| 파일 | 하는 일 |
|---|---|
| `pages.mjs` | 쪽별 문구 (제목 · 핵심 줄 · 표 · 코드 발췌 · 캡처 배치). 문구는 여기서만 고칩니다 |
| `arch.mjs` | SVG 도식 (시스템 구성 · 기술 구조 · 에이전트 그래프 · 보안 경로 · 요약 그림)과 선 아이콘 |
| `portfolio.css` | 모양 (16:9 보고서형 · 남색 + 강조 1색 + 회색 · 도식 역할 색 LLM/코드/고객 · 각진 상자 · 그림자/투명도 없음 — PDF 뷰어 호환) |
| `fonts/` | Pretendard (SIL OFL, `LICENSE.txt`). 빌드가 로컬 파일로 넣고 PDF에 포함됩니다 |
| `shots/` | 화면 캡처 그림 (`capture/`가 만듦) |
| `capture/capture.mjs` | 개발 웹 화면을 실제로 조작해 캡처하는 스크립트 (LLM 응답까지 기다림) |
| `capture/crops.py` | 캡처를 내용만 남게 자르고 바탕 여백을 흰색으로 정리 → `shots/clean/` (슬라이드는 이것만 사용) |
| `data/metrics.json` | 기존 챗봇 측정값 (규정 RAG 24문항 · 환각 반복 · 토큰). `local-env/measure.py`가 만듦 (문항별 원본 `data/eval_results.json`) |
| `data/agent_metrics.json` | 에이전트 평가 (시나리오 12개 · 개인화/키워드/복합 각 10회 · 기존 챗봇과 같은 질문 비교 · 안전 종료 수). `local-env/agent_eval.py`가 만듦 |
| `data/action_metrics.json` | 실행 · 멀티턴 · 연쇄 · 보안 평가 (실제 API + DB 상태 채점). `local-env/action_eval.py`가 만듦, 수정 전 첫 평가는 `_v1` |
| `data/context_budget.json` | LLM 호출 한 번의 토큰 구성 (기존 쇼핑 챗 vs 에이전트, Qwen2.5 토크나이저). `local-env/context_budget.py`가 만듦 |
| `shots/*.boxes.json` | 캡처 때 기록한 화면 요소 위치 → 데모 쪽 번호 표시를 자동 배치 |
| `data/forced_eval.json` | 확정 호출 장애 주입 평가 (모델이 상품 도구를 빼먹은 상태에서 도구 · 인자 · 검색 결과 채점). `local-env/forced_eval.py`가 만듦, 첫 측정은 `_v1` |
| `data/tool_examples.json` | 도구 4개의 실제 출력 예 (도구 설계 쪽). `local-env/tool_examples.py`가 만듦 |
| `shots/*.trace.json` | 에이전트 캡처 때 SSE 이벤트를 시각과 함께 저장한 실행 기록 → 데모 쪽 처리 시간 그래프 |
| `data/visual.json` · `shots/thumbs/` | 이미지 검색 결과·구매 이력 시각화 데이터. `local-env/visual_data.py`가 실제 API로 만듭니다 |
| `build.mjs` | 위 파일들을 합쳐 PDF · PPTX를 찍는 빌드 (넘침 검사, 흐름도 생성기 `dg()` 포함) |
| `local-env/` | 원 서비스 DB(Supabase) 없이 앱을 돌리는 로컬 재현 환경 |

## 로컬 재현 환경 (`local-env/`)

원 서비스의 Supabase 프로젝트가 내려가 있어, 같은 백엔드 코드를 로컬 PostgreSQL에 붙여 돌립니다. 환경변수만 바꾸며 `backend/` 코드는 재현 환경 때문에 고치지 않습니다 (에이전트는 `backend/app/services/agent/` 에 정식 기능으로 추가).

| 구성 | 역할 |
|---|---|
| PostgreSQL 17 · DB `shoppingmall_local` | `schema.sql` (코드가 실제로 쓰는 컬럼 기준). pgvector 대신 `float8[]` + 같은 이름의 RPC 함수 |
| PostgREST 16.5 (`.cache/bin`) | Supabase REST API 역할 |
| `gateway.py` (54321) | `/rest/v1` → PostgREST, `/auth/v1` 이메일 로그인, `/storage/v1` 파일 |
| fakeredis (6379) | Refresh Token · Rate Limit 저장소 |
| `run_backend.py` (18000) | 환경변수만 바꿔 백엔드 실행 (Ollama 11435 → 11434, LLM 호출 시간 한도 900초 — GPU 공유 PC 대비, 에이전트 대화 상태는 로컬 PostgreSQL 체크포인터) |
| 프론트 (13000) | `next dev`, API 주소만 18000으로 |
| `seed.py` | 데모 데이터: 상품 43개(Unsplash 사진, CLIP 임베딩 실제 계산), 주문·리뷰, 규정 PDF 4개를 실제 업로드 API로 색인 |

데모 계정: 구매자 `demo@example.com` / `demo1234!`, 관리자 `admin@example.com` / `admin1234!`

## 고칠 때 (이 폴더에서)

- 처음 한 번: `npm install` → `npm run env:setup` → `npm run env:start` (새 터미널) → `npm run env:seed`
- 문구만 바뀌면: `npm run build`
- 화면이 바뀌면: `npm run env:start` 상태에서 `npm run capture` (LLM 응답 포함) → `python capture/crops.py` → `npm run build`
- 측정을 다시 하려면: `HALLUC_RUNS=10 npm run measure` → `python local-env/visual_data.py` → `npm run build`
- 에이전트 평가: `HALLUC_RUNS=10 npm run agent:eval` → `RUNS=3 npm run agent:actions` → `npm run agent:forced` → `npm run agent:tools` → `npm run agent:context` → `npm run build`
- 평가 도중 로컬 서비스 재기동 등으로 **연결 오류로 끝난 시나리오만** 다시 돌려 교체: `ONLY=시나리오,… RUNS=1 SAVE_AS=data/action_rerun.json python local-env/action_eval.py` → `python local-env/merge_action_rerun.py data/action_rerun.json` (교체 내역은 `action_metrics.json` 의 `merged_rerun`)
- 데모 화면은 GPU를 다른 작업과 나눠 쓰면 실행 기록 시간이 크게 늘어납니다. GPU가 한가할 때 `node capture/capture.mjs agent agent-hero` 로 다시 찍습니다
- 실행 시연 · 평가 전 상태 초기화 (결제 완료 주문 1건, 장바구니 · 문의 비우기): `npm run agent:reset`
- 에이전트 한 번 호출해 이벤트 보기 (JWT 로그인 포함): `npm run agent:try -- "질문" --login`
- 에이전트 회귀 테스트 47개 (`backend/tests/test_agent.py`, LLM · DB 없이): `npm test`
- 쪽별 그림으로 확인: `npm run preview` (→ `preview/`)

필요한 것: PostgreSQL 17(비밀번호는 `PG_PASSWORD`, 기본 `admin`), Ollama + `qwen2.5:14b`, Python 백엔드 의존성, Node 20+.
