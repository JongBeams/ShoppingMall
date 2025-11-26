# 설정 가이드 (Configuration Guide)

## 개요
이 문서는 백엔드 애플리케이션의 모든 설정 옵션을 설명합니다.

## 환경 변수 설정

### 필수 설정

#### Supabase 설정
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Backend 인증 설정
```bash
SECRET_KEY=your-secret-key-here  # 최소 32자 이상 권장
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_PORT=8000
```

#### SMTP 이메일 설정
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Gmail 2FA 앱 비밀번호
SMTP_FROM_EMAIL=your-email@gmail.com
```

### 선택적 설정 (기본값 제공)

#### AI 모델 설정
```bash
# Ollama 서버 설정
OLLAMA_HOST=http://localhost:11435  # Ollama 서버 주소
OLLAMA_MODEL=qwen2.5:14b             # 사용할 LLM 모델
EMBEDDING_MODEL=BAAI/bge-m3          # 임베딩 모델
OLLAMA_TIMEOUT=120                   # API 타임아웃 (초)
```

**지원 모델:**
- `qwen2.5:14b` (기본값, 한국어 우수)
- `llama3.1:8b`
- `gemma2:9b`
- 기타 Ollama 지원 모델

**임베딩 모델:**
- `BAAI/bge-m3` (기본값, 다국어 지원)
- `sentence-transformers/all-MiniLM-L6-v2`
- 기타 SentenceTransformer 모델

#### 개인화 추천 시스템 설정
```bash
# 분석 기간 설정
RECOMMENDATION_ANALYSIS_MONTHS=6     # 구매 이력 분석 기간 (개월)
                                     # 범위: 1-24개월
                                     # 권장: 6개월 (최근 트렌드 반영)

# 상품 필터링 설정
RECOMMENDATION_MIN_REVIEWS=3         # 추천에 포함할 최소 리뷰 수
                                     # 신뢰도 확보를 위해 리뷰 적은 상품 제외

RECOMMENDATION_PRICE_TOLERANCE=0.3   # 가격대 허용 범위 (±30%)
                                     # 0.3 = 고객 평소 가격대 ±30% 범위
                                     # 범위: 0.0-1.0
                                     # 예: 평소 10,000원 구매 → 7,000~13,000원 추천

RECOMMENDATION_DEFAULT_LIMIT=50      # 추천 상품 최대 개수
                                     # LLM에 전달할 후보 상품 수

RECOMMENDATION_EXCLUDE_PURCHASED=true # 구매한 상품 제외 여부
                                      # true: 이미 구매한 상품 제외
                                      # false: 재구매 가능 상품도 포함
```

#### 검색 설정
```bash
# 문서 검색
SEARCH_DOCUMENT_LIMIT=3              # RAG 검색 시 가져올 문서 수
                                     # 많을수록 정확하지만 응답 느림

# 상품 검색
SEARCH_PRODUCT_LIMIT=50              # 검색 결과 최대 상품 수
SEARCH_MIN_KEYWORD_LENGTH=2          # 키워드 최소 길이
                                     # 2자 미만 단어는 무시
```

#### Redis 설정
```bash
REDIS_HOST=redis                     # Redis 호스트 (Docker: redis)
REDIS_PORT=6379                      # Redis 포트
```

#### CORS 설정
```bash
NEXT_PUBLIC_URL=http://localhost:3000 # 프론트엔드 URL
```


### 검증 규칙

1. **RECOMMENDATION_PRICE_TOLERANCE**
   - 범위: 0.0 ~ 1.0
   - 오류: "must be between 0 and 1"

2. **OLLAMA_TIMEOUT**
   - 최소값: 10초
   - 오류: "must be at least 10 seconds"

3. **RECOMMENDATION_ANALYSIS_MONTHS**
   - 범위: 1 ~ 24개월
   - 오류: "must be between 1 and 24"

### 오류 예시
```bash
# 잘못된 설정
RECOMMENDATION_PRICE_TOLERANCE=1.5  # ❌ 1.0 초과

# 올바른 설정
RECOMMENDATION_PRICE_TOLERANCE=0.5  # ✅ 0.0~1.0 범위
```

## 상수 설정 (app/config/constants.py)

코드에서 사용하는 비즈니스 로직 상수는 `constants.py`에서 관리합니다.


## 프로덕션 배포 시 권장 설정

```bash
# AI 모델 - 성능 우선
OLLAMA_MODEL=qwen2.5:14b
OLLAMA_TIMEOUT=180  # 프로덕션은 여유있게

# 추천 시스템 - 정확도 우선
RECOMMENDATION_ANALYSIS_MONTHS=12  # 1년치 데이터 분석
RECOMMENDATION_MIN_REVIEWS=5       # 리뷰 많은 상품만
RECOMMENDATION_PRICE_TOLERANCE=0.2 # 가격 범위 좁게

# 검색 - 품질 우선
SEARCH_DOCUMENT_LIMIT=5           # 문서 많이 참고
SEARCH_PRODUCT_LIMIT=100          # 후보 상품 많이
```

## 개발 환경 권장 설정

```bash
# AI 모델 - 속도 우선
OLLAMA_MODEL=qwen2.5:7b           # 작은 모델
OLLAMA_TIMEOUT=60                 # 짧은 타임아웃

# 추천 시스템 - 빠른 테스트
RECOMMENDATION_ANALYSIS_MONTHS=3  # 3개월치만
RECOMMENDATION_MIN_REVIEWS=1      # 모든 상품 포함
RECOMMENDATION_PRICE_TOLERANCE=0.5 # 넓은 범위

# 검색 - 빠른 응답
SEARCH_DOCUMENT_LIMIT=2
SEARCH_PRODUCT_LIMIT=20
```

## 설정 파일 우선순위

1. 환경 변수 (최우선)
2. `.env` 파일
3. 코드 기본값

## 문제 해결

### Ollama 연결 오류
```bash
# Ollama 서버 실행 확인
curl http://localhost:11435/api/tags
```

### 추천 결과 없음
```bash
# 분석 기간 늘리기
RECOMMENDATION_ANALYSIS_MONTHS=12

# 가격 범위 넓히기
RECOMMENDATION_PRICE_TOLERANCE=0.5

# 최소 리뷰 수 낮추기
RECOMMENDATION_MIN_REVIEWS=1
```

### 응답 느림
```bash
# 타임아웃 늘리기
OLLAMA_TIMEOUT=180

# 후보 상품 수 줄이기
RECOMMENDATION_DEFAULT_LIMIT=20
SEARCH_PRODUCT_LIMIT=30
```

## 설정 확인 방법

```python
# Python 콘솔에서 확인
from app.config import get_settings

settings = get_settings()
print(f"Model: {settings.OLLAMA_MODEL}")
print(f"Analysis Period: {settings.RECOMMENDATION_ANALYSIS_MONTHS} months")
```


## 참고
- [Ollama 모델 목록](https://ollama.ai/library)
- [SentenceTransformers 모델](https://www.sbert.net/docs/pretrained_models.html)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
