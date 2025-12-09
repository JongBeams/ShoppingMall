# 하드코딩 제거 완료 보고서

## 개요
코드의 모든 하드코딩된 값을 환경 변수와 설정 파일로 분리하여 정석대로 개발했습니다.

## 변경 사항

### 1. 설정 파일 구조

```
backend/
├── app/
│   ├── config.py                    # 환경 변수 관리 (Pydantic Settings)
│   └── config/
│       └── constants.py             # 비즈니스 로직 상수
├── .env                             # 실제 환경 변수 (gitignore)
└── .env.example                     # 환경 변수 예시 파일
```

### 2. 제거된 하드코딩 목록

#### AI 모델 관련
| 하드코딩된 값 | 설정 위치 | 기본값 |
|------------|----------|-------|
| `http://localhost:11435` | `OLLAMA_HOST` | `http://localhost:11435` |
| `qwen2.5:14b` | `OLLAMA_MODEL` | `qwen2.5:14b` |
| `BAAI/bge-m3` | `EMBEDDING_MODEL` | `BAAI/bge-m3` |
| `120` (timeout) | `OLLAMA_TIMEOUT` | `120` |

**변경 파일:**
- `app/services/rag_search.py`
- `app/services/intent_classifier.py`
- `app/routers/chat.py`

#### 추천 시스템 관련
| 하드코딩된 값 | 설정 위치 | 기본값 |
|------------|----------|-------|
| `6` (개월) | `RECOMMENDATION_ANALYSIS_MONTHS` | `6` |
| `3` (최소 리뷰) | `RECOMMENDATION_MIN_REVIEWS` | `3` |
| `0.3` (±30%) | `RECOMMENDATION_PRICE_TOLERANCE` | `0.3` |
| `50` (상품 수) | `RECOMMENDATION_DEFAULT_LIMIT` | `50` |
| `True` (제외 여부) | `RECOMMENDATION_EXCLUDE_PURCHASED` | `true` |

**변경 파일:**
- `app/services/personalized_recommendation.py`

#### 검색 관련
| 하드코딩된 값 | 설정 위치 | 기본값 |
|------------|----------|-------|
| `3` (문서 수) | `SEARCH_DOCUMENT_LIMIT` | `3` |
| `50` (상품 수) | `SEARCH_PRODUCT_LIMIT` | `50` |
| `2` (최소 길이) | `SEARCH_MIN_KEYWORD_LENGTH` | `2` |

**변경 파일:**
- `app/services/product_statistics.py`

#### 비즈니스 로직 상수
| 하드코딩된 값 | 설정 위치 |
|------------|----------|
| 추천 키워드 배열 | `constants.RECOMMENDATION_KEYWORDS` |
| 불용어 배열 | `constants.STOPWORDS` |
| 구매 주기 매핑 | `constants.PURCHASE_FREQUENCY_MAP` |
| 계절 매핑 | `constants.SEASON_MAP` |

**변경 파일:**
- `app/config/constants.py` (신규 생성)
- `app/routers/chat.py`
- `app/services/product_statistics.py`
- `app/services/personalized_recommendation.py`

### 3. 설정 값 검증 추가

Pydantic validator를 사용하여 잘못된 설정 값을 시작 시점에 감지:

```python
@field_validator('RECOMMENDATION_PRICE_TOLERANCE')
def validate_price_tolerance(cls, v):
    if not 0 <= v <= 1:
        raise ValueError('RECOMMENDATION_PRICE_TOLERANCE must be between 0 and 1')
    return v

@field_validator('OLLAMA_TIMEOUT')
def validate_timeout(cls, v):
    if v < 10:
        raise ValueError('OLLAMA_TIMEOUT must be at least 10 seconds')
    return v

@field_validator('RECOMMENDATION_ANALYSIS_MONTHS')
def validate_analysis_months(cls, v):
    if not 1 <= v <= 24:
        raise ValueError('RECOMMENDATION_ANALYSIS_MONTHS must be between 1 and 24')
    return v
```

### 4. setup.py 자동 설정

사용자가 입력하지 않아도 AI 관련 설정이 자동으로 `.env`에 생성됩니다:

```python
# setup.py의 configure_env_files() 메서드
# AI Models Configuration (자동 설정)
OLLAMA_HOST=http://localhost:11435
OLLAMA_MODEL=qwen2.5:14b
EMBEDDING_MODEL=BAAI/bge-m3
OLLAMA_TIMEOUT=120

# Recommendation System Settings (자동 설정)
RECOMMENDATION_ANALYSIS_MONTHS=6
RECOMMENDATION_MIN_REVIEWS=3
RECOMMENDATION_PRICE_TOLERANCE=0.3
RECOMMENDATION_DEFAULT_LIMIT=50
RECOMMENDATION_EXCLUDE_PURCHASED=true

# Search Settings (자동 설정)
SEARCH_DOCUMENT_LIMIT=3
SEARCH_PRODUCT_LIMIT=50
SEARCH_MIN_KEYWORD_LENGTH=2
```

## 변경 전 vs 변경 후

### 변경 전 (하드코딩)
```python
# ❌ 하드코딩된 값
def get_embedding_model():
    return SentenceTransformer('BAAI/bge-m3')

def generate_answer_with_ollama(model="qwen2.5:14b", ollama_host="http://localhost:11435"):
    # ...

def _get_purchase_history(months=6):
    # ...

recommendation_keywords = ['추천', '뭐', '보여', ...]
```

### 변경 후 (설정 파일)
```python
#  설정 파일 사용
from app.config import get_settings
from app.config.constants import RECOMMENDATION_KEYWORDS

settings = get_settings()

def get_embedding_model():
    model_name = settings.EMBEDDING_MODEL
    return SentenceTransformer(model_name)

def generate_answer_with_ollama(model=None, ollama_host=None):
    if model is None:
        model = settings.OLLAMA_MODEL
    if ollama_host is None:
        ollama_host = settings.OLLAMA_HOST
    # ...

def _get_purchase_history(months: int):
    # months는 호출자가 settings.RECOMMENDATION_ANALYSIS_MONTHS 전달
    # ...

# RECOMMENDATION_KEYWORDS는 constants.py에서 임포트
is_recommendation_query = any(kw in request.message for kw in RECOMMENDATION_KEYWORDS)
```

## 설정 우선순위

1. **환경 변수** (최우선)
2. **.env 파일**
3. **코드 기본값** (config.py)

## 프로젝트 실행 방법

### 1. setup.py 실행 (권장)
```bash
python setup.py
```
→ AI 설정 자동으로 `.env`에 생성됨

### 2. 수동 설정
```bash
# .env 파일 생성
cp backend/.env.example backend/.env

# 필수 값만 수정 (AI 설정은 이미 포함됨)
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SMTP_USER
# - SMTP_PASSWORD
```

## 커스터마이징 방법

### AI 모델 변경
```bash
# .env 파일에서 수정
OLLAMA_MODEL=llama3.1:8b       # 다른 모델 사용
EMBEDDING_MODEL=all-MiniLM-L6-v2  # 다른 임베딩 모델
```

### 추천 알고리즘 튜닝
```bash
# .env 파일에서 수정
RECOMMENDATION_ANALYSIS_MONTHS=12  # 1년치 데이터 분석
RECOMMENDATION_PRICE_TOLERANCE=0.2  # 가격 범위 좁게
RECOMMENDATION_MIN_REVIEWS=5        # 리뷰 많은 상품만
```

### 비즈니스 로직 상수 변경
```python
# app/config/constants.py 파일 직접 수정
RECOMMENDATION_KEYWORDS = [
    '추천', '뭐', '보여', '골라',
    '선물',  # 새로운 키워드 추가
    '특가',  # 새로운 키워드 추가
]
```

## 장점

### 1. 유지보수성 향상
- 설정 변경 시 코드 수정 불필요
- 한 곳에서 모든 설정 관리

### 2. 환경별 배포 용이
```bash
# 개발 환경
OLLAMA_MODEL=qwen2.5:7b  # 작은 모델
OLLAMA_TIMEOUT=60

# 프로덕션 환경
OLLAMA_MODEL=qwen2.5:14b  # 큰 모델
OLLAMA_TIMEOUT=180
```

### 3. 보안 강화
- 민감한 설정 값이 코드에 노출 안 됨
- `.env` 파일은 `.gitignore`로 보호

### 4. 타입 안전성
- Pydantic을 통한 타입 검증
- 잘못된 설정 값 시작 시점에 감지

### 5. 문서화
- 모든 설정 옵션이 `.env.example`에 문서화
- `CONFIGURATION.md`에 상세 가이드 제공

## 테스트 방법

### 1. 설정 값 확인
```python
from app.config import get_settings

settings = get_settings()
print(f"Model: {settings.OLLAMA_MODEL}")
print(f"Host: {settings.OLLAMA_HOST}")
print(f"Analysis Period: {settings.RECOMMENDATION_ANALYSIS_MONTHS} months")
```

### 2. 검증 테스트
```bash
# 잘못된 설정으로 시작 시도
export RECOMMENDATION_PRICE_TOLERANCE=1.5  # ❌ 범위 초과

python -m uvicorn app.main:app
# → ValidationError: must be between 0 and 1
```

## 참고 문서

- [CONFIGURATION.md](CONFIGURATION.md) - 전체 설정 가이드
- [.env.example](.env.example) - 환경 변수 예시
- [app/config.py](app/config.py) - 설정 코드
- [app/config/constants.py](app/config/constants.py) - 비즈니스 상수

## 체크리스트

 AI 모델 설정 분리
 추천 시스템 설정 분리
 검색 설정 분리
 비즈니스 로직 상수 분리
 설정 값 검증 추가
 setup.py 자동 설정
 문서화 완료
 타입 안전성 확보

## 마이그레이션 가이드

기존 프로젝트를 사용 중이라면:

1. **백업**
   ```bash
   cp backend/.env backend/.env.backup
   ```

2. **setup.py 재실행**
   ```bash
   python setup.py
   ```
   → 기존 설정 유지하면서 AI 설정 자동 추가

3. **검증**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   # 에러 없이 시작되는지 확인
   ```

4. **커스터마이징** (선택)
   - `.env` 파일에서 AI 모델 변경
   - `constants.py`에서 비즈니스 로직 조정

---

**작성일**: 2025-11-26
**작성자**: AI Assistant
**버전**: 1.0.0
