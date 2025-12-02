# 🎁 AI 선물 추천 마법사

## 개요

**AI 선물 추천 마법사**는 사용자가 5가지 질문에 답하면, AI가 받는 사람의 성격, 취향, 상황을 분석하여 **완벽한 선물 3가지**를 추천해주는 기능입니다.

단순 상품 추천을 넘어, **감성적인 선물 메시지**, **포장 팁**, **전달 방법**까지 제안하여 선물 고민을 완전히 해결합니다.

---

## 주요 기능

### 1. 대화형 질문 플로우 (5단계)

사용자는 채팅 인터페이스에서 5가지 질문에 답변합니다:

1. **누구에게?** - 연인, 부모, 친구, 동료 등
2. **연령대는?** - 10대, 20대, 30대, 40대, 50대+
3. **스타일은?** - 미니멀, 화려한, 빈티지, 모던, 캐주얼
4. **관심사는?** - 운동, 독서, 게임, 여행, 요리, 음악, 패션 (다중 선택)
5. **어떤 목적?** - 생일, 기념일, 축하, 위로, 감사, 그냥
6. **예산은?** - ~3만원, 3~10만원, 10~30만원, 30만원+
7. **특별 요청?** - 각인, 실용적, 의미있는, 유니크한

### 2. 스마트 상품 필터링

사용자 답변을 바탕으로 다단계 필터링:

- **1단계**: 관계 기반 카테고리 매핑 (예: 연인 → 주얼리, 향수, 가방)
- **2단계**: 관심사 반영 (예: 운동 → 스포츠용품, 운동복)
- **3단계**: 가격대 필터 (예산 ±20% 여유)
- **4단계**: 스타일 키워드 매칭 (미니멀 → "심플", "베이직", "모던")
- **5단계**: 평점 4.0 이상, 재고 있는 상품만
- **6단계**: 정렬 (스타일 매칭 > 평점 > 리뷰 수)

### 3. AI 추천 및 이유 설명

**LLM (Ollama qwen2.5:14b)**이 상위 50개 상품 중 3개를 선택하고:

- **추천 이유 3가지**: 받는 사람 성격/스타일/상황과 연결
- **주의사항**: 사이즈 확인, 색상 선택 등
- **선물 메시지 3가지**: 감성적, 위트있는, 진지한 톤
- **포장 팁**: 색상, 스타일 조언
- **전달 방법**: 언제, 어떻게 전달할지

**예시 응답:**

```json
{
  "recommendations": [
    {
      "rank": 1,
      "product_name": "캐시미어 머플러",
      "reasons": [
        "겨울 시작하는 12월, 따뜻한 마음을 전달하는 실용적인 선물입니다.",
        "미니멀 스타일의 베이지 색상으로 어떤 옷에도 매치 가능합니다.",
        "각인 서비스로 특별함을 더할 수 있습니다."
      ],
      "gift_messages": [
        "추운 겨울, 내가 항상 네 곁을 따뜻하게 해줄게. 이 머플러처럼 🧣",
        "100일 기념으로 100번 더 따뜻하게! 겨울마다 나 생각나게 해줘 ❤️",
        "사랑하는 당신에게, 마음을 담아 준비한 선물입니다."
      ],
      "caution": "색상 옵션 확인 필요 (베이지/그레이/블랙)"
    }
  ],
  "packaging_tips": "따뜻한 느낌의 브라운 포장지에 마끈으로 심플하게 묶어주세요.",
  "delivery_tips": "직접 만나서 목에 둘러주는 이벤트를 추천합니다.",
  "overall_advice": "연인에게 실용적인 선물을 줄 때는 매일 사용할 수 있는 것을 선택하세요..."
}
```

### 4. 선물 히스토리 저장

구매한 선물 정보를 저장하여:

- **과거 선물 참고**: "작년 생일엔 팔찌 줬으니 올해는 목걸이"
- **재구매 방지**: 같은 선물 반복 안 함
- **패턴 학습**: "이 사람은 주로 악세사리 선호"

### 5. 기념일 관리

중요한 기념일 등록 및 자동 알림:

- **기념일 등록**: 생일, 결혼기념일, 100일, 1주년 등
- **D-30 알림**: "여자친구 생일이 30일 남았어요! 선물 미리 준비하세요"
- **추천 연동**: 기념일 다가오면 자동으로 선물 추천

---

## 기술 스택

### 백엔드

```
FastAPI
├─ routers/gift_wizard.py           # API 엔드포인트
├─ services/gift_filtering.py       # 상품 필터링 로직
├─ services/gift_llm.py              # LLM 프롬프트 생성 및 호출
├─ models/gift_wizard.py             # Pydantic 모델
└─ database/gift_wizard_schema.sql   # DB 스키마
```

**주요 기술:**

- **Ollama (qwen2.5:14b)**: 선물 추천 및 메시지 생성
- **Supabase**: 데이터베이스 (PostgreSQL)
- **다단계 필터링**: 관계/관심사/스타일 기반

### 프론트엔드

```
Next.js (App Router)
├─ app/gift-wizard/page.tsx           # 메인 페이지
├─ components/gift-wizard/
│   ├─ GiftWizardChat.tsx             # 대화형 질문 UI
│   └─ GiftWizardResult.tsx           # 결과 페이지
```

**주요 기술:**

- **React Hooks**: useState
- **Tailwind CSS**: 그라데이션, 애니메이션
- **대화형 UI**: 채팅 스타일 인터페이스

---

## 데이터베이스 스키마

### 1. gift_history (선물 히스토리)

```sql
CREATE TABLE gift_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    recipient_relationship VARCHAR(50),  -- 받는 사람 관계
    occasion VARCHAR(50),                 -- 목적
    product_id UUID,
    product_name VARCHAR(255),
    price DECIMAL(10, 2),
    given_date TIMESTAMP,                 -- 선물 준 날짜
    satisfaction_rating INTEGER,          -- 만족도 (1-5)
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. anniversaries (기념일)

```sql
CREATE TABLE anniversaries (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(100),                    -- 기념일 이름
    date DATE,                             -- 날짜
    auto_remind BOOLEAN DEFAULT TRUE,
    remind_days_before INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. gift_recommendation_logs (추천 로그)

```sql
CREATE TABLE gift_recommendation_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    relationship VARCHAR(50),
    age_range VARCHAR(20),
    style VARCHAR(50),
    interests JSONB,
    occasion VARCHAR(50),
    budget_min INTEGER,
    budget_max INTEGER,
    recommended_products JSONB,           -- [product_id1, id2, id3]
    purchased_product_id UUID,            -- 실제 구매한 상품
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API 엔드포인트

### POST /gift-wizard/recommendations-json

**요청:**

```json
{
  "relationship": "연인_여",
  "age_range": "20대",
  "style": "미니멀",
  "interests": ["독서", "카페"],
  "occasion": "생일",
  "budget_min": 50000,
  "budget_max": 100000,
  "special_request": "각인 가능한 것"
}
```

**응답:**

```json
{
  "recommendations": [
    {
      "rank": 1,
      "product_id": "uuid",
      "product_name": "실버 각인 팔찌",
      "product_price": 79000,
      "product_image": "url",
      "product_rating": 4.7,
      "product_review_count": 234,
      "reasons": ["이유1", "이유2", "이유3"],
      "caution": "사이즈 확인 필요",
      "gift_messages": ["메시지1", "메시지2", "메시지3"]
    },
    ...
  ],
  "packaging_tips": "심플한 흰색 포장지 추천",
  "delivery_tips": "직접 팔목에 채워주세요",
  "overall_advice": "연인에게 악세사리는..."
}
```

### POST /gift-wizard/messages

선물 메시지만 추가 생성

```json
{
  "product_name": "캐시미어 머플러",
  "relationship": "연인_여",
  "occasion": "100일",
  "tone": "감성적"
}
```

### POST /gift-wizard/history

선물 히스토리 저장

```json
{
  "product_id": "uuid",
  "product_name": "캐시미어 머플러",
  "price": 79000,
  "relationship": "연인_여",
  "occasion": "100일"
}
```

### GET /gift-wizard/history

과거 선물 기록 조회

### POST /gift-wizard/anniversaries

기념일 등록

### GET /gift-wizard/anniversaries

기념일 목록

---

## 사용 흐름

### 1. 인트로 화면

```
🎁 AI 선물 추천 마법사

고민 끝! AI가 완벽한 선물을 찾아드립니다.
5가지 질문만 답하면 끝!

[시작하기] 버튼
```

### 2. 대화형 질문

```
AI: 안녕하세요! 누구에게 선물하시나요?
    [연인(남)] [연인(여)] [부모] [친구] [동료]

사용자: 연인(여)

AI: 어떤 스타일을 좋아하시나요?
    [미니멀] [화려한] [빈티지] [모던] [캐주얼]

...
```

### 3. 로딩 화면

```
✨ AI가 선물을 찾는 중...

전 세계 선물 데이터 분석 중...
받는 분의 취향 파악 중...
완벽한 조합 계산 중...
```

### 4. 결과 화면

```
🎉 완벽한 선물 3가지를 찾았어요!

┌─────────────────────────────┐
│ 👑 가장 추천                 │
│                              │
│ [상품 이미지]                │
│ 캐시미어 머플러               │
│ 79,000원                     │
│ ⭐ 4.7 (리뷰 234개)          │
│                              │
│ 💡 왜 이 선물일까요?         │
│ 1. 겨울에 따뜻하게...        │
│ 2. 미니멀 스타일...          │
│ 3. 각인 가능...              │
│                              │
│ 💌 선물 메시지 제안          │
│ [메시지 1 - 감성적]          │
│ [메시지 2 - 위트있는]        │
│ [메시지 3 - 진지한]          │
│                              │
│ [상품 보러가기] [장바구니]    │
└─────────────────────────────┘
```

---

## 포트폴리오 어필 포인트

### 1. 기술적 복잡도

✅ **LLM 프롬프트 엔지니어링**

- 구조화된 JSON 응답 생성
- 컨텍스트 인식 (관계, 스타일, 상황 반영)
- 감성 메시지 생성 (3가지 톤)

✅ **다단계 필터링 알고리즘**

- 관계 → 카테고리 매핑
- 관심사 → 추가 카테고리
- 스타일 → 키워드 매칭
- 가격 → 예산 ±20%
- 평점/재고 필터

✅ **개인화 추천**

- 과거 선물 이력 반영
- 구매 패턴 학습
- 만족도 피드백 루프

### 2. UX/UI 혁신

✅ **대화형 인터페이스**

- 채팅 스타일 질문
- 실시간 진행 바
- 옵션 버튼 (다중 선택 지원)

✅ **감성적 디자인**

- 그라데이션 컬러 (보라-핑크)
- 애니메이션 (로딩, 버튼 호버)
- 카드 레이아웃 (1순위 강조)

### 3. 비즈니스 가치

✅ **구매 전환율 증가**

- 선물 고민 시간 단축 (5분 내)
- 맞춤 추천으로 확신 증가
- 선물 메시지까지 제공

✅ **객단가 상승**

- 선물은 가격대 높은 상품 선택
- 포장/추가 상품 제안

✅ **재방문 유도**

- 기념일 알림
- 선물 히스토리 관리

### 4. 차별화

✅ **국내 쇼핑몰 최초**

- AI 선물 추천 서비스
- 감성 메시지 생성
- 대화형 UX

---

## 설치 및 실행

### 1. 데이터베이스 스키마 적용

```sql
-- Supabase SQL Editor에서 실행
\i backend/database/gift_wizard_schema.sql
```

### 2. 백엔드 실행

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm run dev
```

### 4. 접속

```
http://localhost:3000/gift-wizard
```

---

## 향후 개선 방향

### V2 (확장 기능)

1. ✅ **선물 패키지 추천**: 메인 선물 + 서브 선물 조합
2. ✅ **공동 선물 기능**: 친구들과 돈 모아서 고가 선물
3. ✅ **AR 포장 프리뷰**: 포장 스타일 미리보기
4. ✅ **배송 타이밍 추천**: "2일 전 주문하면 기념일 당일 도착"

### V3 (AI 고도화)

1. ✅ **이미지 기반 추천**: "이런 느낌 선물 찾아줘" (사진 업로드)
2. ✅ **음성 인터페이스**: "헤이 쇼핑봇, 여자친구 생일 선물 추천해줘"
3. ✅ **강화학습**: 만족도 피드백으로 추천 정확도 개선
4. ✅ **SNS 연동**: 인스타그램 분석으로 취향 자동 파악

---

## 라이선스

MIT License

---

## 문의

궁금한 점이 있으시면 GitHub Issues로 남겨주세요!
