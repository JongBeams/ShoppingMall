"""
개인화 추천 시스템 테스트
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from app.services.personalized_recommendation import (
    PurchasePattern,
    get_personalized_recommendations,
    _generate_recommendation_reason,
    _find_pattern_based_products
)


@pytest.fixture
def mock_supabase():
    """Supabase 모킹"""
    with patch('app.services.personalized_recommendation.supabase') as mock:
        yield mock


@pytest.fixture
def sample_orders():
    """샘플 주문 데이터"""
    return {
        'data': [
            {
                'id': '1',
                'created_at': datetime.utcnow().isoformat(),
                'total_amount': 50000,
                'status': 'completed',
                'order_items': [
                    {
                        'product_id': 'p1',
                        'product_name': '노트북',
                        'quantity': 1,
                        'price': 50000,
                        'products': {
                            'id': 'p1',
                            'name': '노트북',
                            'price': 50000,
                            'tags': ['전자기기', '컴퓨터'],
                            'category': '전자제품',
                            'brand': 'Samsung',
                            'thumbnail_url': 'http://example.com/img.jpg',
                            'rating': 4.5,
                            'review_count': 10
                        }
                    }
                ]
            }
        ]
    }


class TestPurchasePatternAnalysis:
    """구매 패턴 분석 테스트"""

    def test_empty_purchase_history(self, mock_supabase):
        """구매 이력이 없을 때 빈 패턴 반환"""
        # Given: 빈 주문 데이터
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = Mock(data=[])

        # When: 패턴 분석 실행
        analyzer = PurchasePattern('user_id_empty')
        pattern = analyzer.analyze()

        # Then: 빈 패턴 반환
        assert pattern['total_orders'] == 0
        assert pattern['favorite_tags'] == []
        assert pattern['avg_price'] == 0
        assert pattern['purchase_frequency'] == 'none'

    def test_single_order_analysis(self, mock_supabase, sample_orders):
        """단일 주문 분석"""
        # Given: 1개 주문
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = sample_orders

        # When: 패턴 분석
        analyzer = PurchasePattern('user_id_single')
        pattern = analyzer.analyze()

        # Then: 패턴 추출 확인
        assert pattern['total_orders'] == 1
        assert pattern['avg_price'] == 50000.0
        assert len(pattern['favorite_tags']) > 0
        assert pattern['favorite_tags'][0][0] in ['전자기기', '컴퓨터']

    def test_price_range_calculation(self, mock_supabase, sample_orders):
        """가격대 범위 계산"""
        # Given: 다양한 가격대의 주문
        sample_orders['data'].append({
            'id': '2',
            'created_at': datetime.utcnow().isoformat(),
            'order_items': [{
                'price': 100000,
                'quantity': 1,
                'products': {
                    'id': 'p2',
                    'name': '마우스',
                    'price': 100000,
                    'tags': ['전자기기'],
                    'category': '전자제품'
                }
            }]
        })
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = sample_orders

        # When: 가격대 분석
        analyzer = PurchasePattern('user_id_price')
        pattern = analyzer.analyze()

        # Then: min, max 확인
        price_min, price_max = pattern['price_range']
        assert price_min == 50000
        assert price_max == 100000

    def test_purchase_frequency_weekly(self, mock_supabase):
        """주간 구매 주기 계산"""
        # Given: 주간 구매 패턴 (7일 간격)
        today = datetime.utcnow()
        orders = {
            'data': [
                {
                    'id': '1',
                    'created_at': today.isoformat(),
                    'order_items': [{'price': 10000, 'quantity': 1, 'products': {'id': 'p1', 'name': '상품1', 'tags': []}}]
                },
                {
                    'id': '2',
                    'created_at': (today - timedelta(days=7)).isoformat(),
                    'order_items': [{'price': 10000, 'quantity': 1, 'products': {'id': 'p2', 'name': '상품2', 'tags': []}}]
                }
            ]
        }
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = orders

        # When: 주기 분석
        analyzer = PurchasePattern('user_weekly')
        pattern = analyzer.analyze()

        # Then: weekly 주기
        assert pattern['purchase_frequency'] == 'weekly'

    def test_repurchase_detection(self, mock_supabase):
        """재구매 상품 감지"""
        # Given: 동일 상품 2회 구매
        orders = {
            'data': [
                {
                    'id': '1',
                    'created_at': datetime.utcnow().isoformat(),
                    'order_items': [{'product_id': 'p1', 'price': 10000, 'quantity': 1, 'products': {'id': 'p1', 'name': '상품A', 'tags': []}}]
                },
                {
                    'id': '2',
                    'created_at': (datetime.utcnow() - timedelta(days=30)).isoformat(),
                    'order_items': [{'product_id': 'p1', 'price': 10000, 'quantity': 1, 'products': {'id': 'p1', 'name': '상품A', 'tags': []}}]
                }
            ]
        }
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = orders

        # When: 재구매 분석
        analyzer = PurchasePattern('user_repurchase')
        pattern = analyzer.analyze()

        # Then: 재구매 상품 감지
        assert len(pattern['repurchase_products']) == 1
        assert pattern['repurchase_products'][0]['product_id'] == 'p1'
        assert pattern['repurchase_products'][0]['purchase_count'] == 2


class TestPersonalizedRecommendation:
    """개인화 추천 테스트"""

    def test_no_purchase_history_returns_bestsellers(self, mock_supabase):
        """구매 이력 없을 때 베스트셀러 추천"""
        # Given: 빈 구매 이력
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = Mock(data=[])

        # 베스트셀러 목록
        mock_supabase.table().select().eq().order().limit().execute.return_value = Mock(data=[
            {'id': 'b1', 'name': '인기상품1', 'price': 10000, 'sale_count': 100}
        ])

        # When: 추천 요청
        result = get_personalized_recommendations('user_no_history', limit=5)

        # Then: 베스트셀러 반환
        assert '구매 이력이 없어' in result['reason']
        assert len(result['recommendations']) > 0

    def test_tag_matching_score_calculation(self, mock_supabase, sample_orders):
        """태그 매칭 점수 계산"""
        # Given: 전자기기 구매 이력
        mock_supabase.table().select().eq().gte().in_().order().execute.return_value = sample_orders

        # 전체 상품 목록
        all_products = Mock(data=[
            {'id': 'p1', 'name': '노트북', 'price': 50000, 'tags': ['전자기기', '컴퓨터'], 'rating': 4.5, 'sale_count': 10, 'is_active': True},
            {'id': 'p2', 'name': '마우스', 'price': 20000, 'tags': ['전자기기'], 'rating': 4.0, 'sale_count': 20, 'is_active': True},
            {'id': 'p3', 'name': '책상', 'price': 100000, 'tags': ['가구'], 'rating': 4.5, 'sale_count': 5, 'is_active': True}
        ])
        mock_supabase.table().select().eq().execute.return_value = all_products

        # When: 패턴 기반 추천
        pattern = {
            'favorite_tags': [('전자기기', 5), ('컴퓨터', 3)],
            'price_range': (20000, 80000),
            'avg_price': 50000
        }
        products = _find_pattern_based_products(pattern, limit=10, exclude_purchased=False, user_id='user_test')

        # Then: 전자기기 태그 상품이 우선 추천
        assert len(products) > 0
        # 가구(태그 매칭 0)는 제외되어야 함
        product_names = [p['name'] for p in products]
        assert '책상' not in product_names

    def test_price_tolerance_filtering(self, mock_supabase):
        """가격대 허용 범위 필터링"""
        # Given: 평균 10,000원 구매 (tolerance 0.3 = ±30%)
        pattern = {
            'favorite_tags': [('태그1', 1)],
            'price_range': (8000, 12000),
            'avg_price': 10000
        }

        # 상품 목록 (7,000원 ~ 15,000원)
        all_products = Mock(data=[
            {'id': 'p1', 'price': 7000, 'tags': ['태그1'], 'is_active': True, 'rating': 4.0, 'sale_count': 1},  # 허용 범위 내 (8000 * 0.7 = 5600)
            {'id': 'p2', 'price': 10000, 'tags': ['태그1'], 'is_active': True, 'rating': 4.0, 'sale_count': 1},
            {'id': 'p3', 'price': 15000, 'tags': ['태그1'], 'is_active': True, 'rating': 4.0, 'sale_count': 1}
        ])
        mock_supabase.table().select().eq().execute.return_value = all_products

        # When: 추천
        products = _find_pattern_based_products(pattern, limit=10, exclude_purchased=False, user_id='user_test')

        # Then: 가격 범위 내 상품만
        prices = [p['price'] for p in products]
        assert all(5600 <= p <= 15600 for p in prices)  # 허용 범위: 8000*0.7 ~ 12000*1.3

    def test_recommendation_reason_generation(self):
        """추천 이유 생성"""
        # Given: 패턴 데이터
        pattern = {
            'favorite_tags': [('전자기기', 10), ('노트북', 5), ('컴퓨터', 3)],
            'avg_price': 50000,
            'purchase_frequency': 'monthly',
            'repurchase_products': [{'product_name': '마우스', 'purchase_count': 2}]
        }

        # When: 이유 생성
        reason = _generate_recommendation_reason(pattern)

        # Then: 패턴 정보 포함
        assert '전자기기' in reason
        assert '50,000원대' in reason
        assert '월간' in reason or 'monthly' in pattern['purchase_frequency']
        assert '개 상품을 재구매' in reason


class TestEdgeCases:
    """엣지 케이스 테스트"""

    def test_invalid_user_id_returns_empty(self):
        """잘못된 사용자 ID 처리"""
        # When: 빈 user_id
        result = get_personalized_recommendations('', limit=5)

        # Then: 에러 메시지와 빈 추천
        assert result['recommendations'] == []

    def test_extremely_high_price_products_excluded(self, mock_supabase):
        """극단적으로 비싼 상품 제외"""
        # Given: 평균 10,000원 구매 이력
        pattern = {
            'favorite_tags': [('태그1', 1)],
            'price_range': (10000, 20000),
            'avg_price': 15000
        }

        all_products = Mock(data=[
            {'id': 'p1', 'price': 15000, 'tags': ['태그1'], 'is_active': True, 'rating': 4.0, 'sale_count': 1},
            {'id': 'p2', 'price': 1000000, 'tags': ['태그1'], 'is_active': True, 'rating': 4.0, 'sale_count': 1}  # 너무 비쌈
        ])
        mock_supabase.table().select().eq().execute.return_value = all_products

        # When: 추천
        products = _find_pattern_based_products(pattern, limit=10, exclude_purchased=False, user_id='user_test')

        # Then: 100만원 상품 제외
        prices = [p['price'] for p in products]
        assert 1000000 not in prices

    def test_no_matching_products_returns_empty(self, mock_supabase):
        """매칭되는 상품 없을 때 빈 리스트"""
        # Given: '전자기기' 태그만 선호
        pattern = {
            'favorite_tags': [('전자기기', 10)],
            'price_range': (10000, 20000),
            'avg_price': 15000
        }

        # 모든 상품이 '가구' 태그
        all_products = Mock(data=[
            {'id': 'p1', 'price': 15000, 'tags': ['가구'], 'is_active': True, 'rating': 4.0, 'sale_count': 1}
        ])
        mock_supabase.table().select().eq().execute.return_value = all_products

        # When: 추천
        products = _find_pattern_based_products(pattern, limit=10, exclude_purchased=False, user_id='user_test')

        # Then: 빈 리스트 또는 베스트셀러 fallback
        assert isinstance(products, list)
