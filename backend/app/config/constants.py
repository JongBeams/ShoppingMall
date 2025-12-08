"""
애플리케이션 상수 정의
비즈니스 로직과 관련된 상수들을 관리
"""

# 추천 관련 키워드
RECOMMENDATION_KEYWORDS = [
    '추천', '뭐', '보여', '골라', '찾아',
    '어때', '좋은', '괜찮은', '어울리는', '맞는'
]

# 불용어 (검색 키워드 추출 시 제외)
STOPWORDS = [
    '추천', '해줘', '알려줘', '뭐', '있어', '좀', '해', '주세요', '요',
    '가', '이', '을', '를', '은', '는', '의', '에',
    '상품', '제품', '뭐야', '뭔데', '어디', '어떤', '어떻게',
    '중에서', '중에', '가장', '제일', '가져와',
    '인기', '인기많은', '인기있는', '인기많은게', '많은', '많이',
    '좋은', '좋은거', '괜찮은', '괜찮은거',
    '베스트', '베스트셀러', '신상', '신상품', '새로운', '새로', '나온',
    '평점', '리뷰', '후기',
    '잘', '팔리는', '팔린', '판매', '판매량', '구매', '구입',
    '사고', '싶어', '싶은', '주문',
    '보여줘', '찾아줘', '검색', '뭐있어', '뭐야', '뭐지', '뭔가',
    '있나', '있나요', '있어요'
]

# 구매 주기 매핑
PURCHASE_FREQUENCY_MAP = {
    'weekly': '주 1회 이상',
    'monthly': '월 1회 정도',
    'quarterly': '분기별',
    'occasional': '가끔'
}

# 계절 매핑
SEASON_MAP = {
    'spring': '봄',
    'summer': '여름',
    'fall': '가을',
    'winter': '겨울'
}

# ==================== 추천 시스템 ====================
# 추천 시스템 기본값
DEFAULT_RECOMMENDATION_LIMIT = 50
DEFAULT_SEARCH_LIMIT = 50
MIN_KEYWORD_LENGTH = 2
MIN_REVIEW_COUNT_FOR_BEST = 3

# 가격 허용 범위 (기본 30%)
DEFAULT_PRICE_TOLERANCE = 0.3

# 분석 기간 (개월)
DEFAULT_ANALYSIS_MONTHS = 6

# ==================== RAG 검색 ====================
# 문서 검색 기본값
DEFAULT_DOCUMENT_SEARCH_LIMIT = 3
MIN_SIMILARITY_THRESHOLD = 0.5

# ==================== 이미지 검색 ====================
# CLIP 모델 설정
CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"
IMAGE_EMBEDDING_DIMENSION = 512
MIN_IMAGE_SIMILARITY = 0.3
MAX_IMAGE_SEARCH_RESULTS = 5

# ==================== 재고 관리 ====================
# 재고 부족 알림 임계값
LOW_STOCK_THRESHOLD = 10
CRITICAL_STOCK_THRESHOLD = 3

# ==================== 포인트 시스템 ====================
# 포인트 적립률 (%)
DEFAULT_POINT_EARN_RATE = 0.05  # 5%
MIN_POINT_USAGE = 1000  # 최소 사용 포인트
MAX_POINT_USAGE_RATE = 0.5  # 최대 사용 비율 (50%)

# 포인트 만료 기간 (일)
POINT_EXPIRATION_DAYS = 365

# ==================== 주문 ====================
# 주문 상태
ORDER_STATUS_PENDING = 'pending'
ORDER_STATUS_PAID = 'paid'
ORDER_STATUS_PREPARING = 'preparing'
ORDER_STATUS_SHIPPED = 'shipped'
ORDER_STATUS_DELIVERED = 'delivered'
ORDER_STATUS_CANCELLED = 'cancelled'
ORDER_STATUS_REFUNDED = 'refunded'

# 무료 배송 최소 금액
FREE_SHIPPING_THRESHOLD = 50000

# ==================== 파일 업로드 ====================
# 최대 파일 크기 (MB)
MAX_IMAGE_SIZE_MB = 5
MAX_DOCUMENT_SIZE_MB = 10

# 허용된 이미지 확장자
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx']

# ==================== Rate Limiting ====================
# API 요청 제한
RATE_LIMIT_PER_MINUTE = 100
RATE_LIMIT_PER_HOUR = 2000
RATE_LIMIT_PER_DAY = 10000

# ==================== WebSocket ====================
# WebSocket 재연결 설정
WS_RECONNECT_INTERVAL_MS = 3000
WS_MAX_RECONNECT_ATTEMPTS = 10

# ==================== 결제 ====================
# 토스페이먼츠 타임아웃 (초)
TOSS_PAYMENT_TIMEOUT = 30

# ==================== 알림 ====================
# 알림 타입
NOTIFICATION_TYPE_ORDER = 'order'
NOTIFICATION_TYPE_SHIPPING = 'shipping'
NOTIFICATION_TYPE_REVIEW = 'review'
NOTIFICATION_TYPE_POINT = 'point'
NOTIFICATION_TYPE_SYSTEM = 'system'
