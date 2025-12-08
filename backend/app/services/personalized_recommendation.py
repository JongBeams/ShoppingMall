"""
개인화 추천 시스템 - 구매 패턴 분석 및 맞춤 추천
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter
from app.services.supabase import supabase
from app.config import get_settings
from app.config.constants import PURCHASE_FREQUENCY_MAP
import logging


logger = logging.getLogger(__name__)

settings = get_settings()


class PurchasePattern:
    """사용자 구매 패턴 분석"""

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.purchase_history = []
        self.pattern_analysis = {}

    def analyze(self) -> Dict:
        """
        사용자 구매 패턴 종합 분석

        Returns:
            {
                'favorite_categories': [...],  # 선호 카테고리
                'favorite_brands': [...],       # 선호 브랜드
                'favorite_tags': [...],         # 선호 태그
                'price_range': (min, max),      # 선호 가격대
                'avg_price': float,             # 평균 구매 가격
                'purchase_frequency': str,      # 구매 주기 (weekly, monthly, etc)
                'last_purchase_date': datetime, # 마지막 구매일
                'total_orders': int,            # 총 주문 수
                'total_spent': float,           # 총 구매 금액
                'repurchase_products': [...]    # 재구매한 상품
            }
        """
        # 1. 구매 이력 가져오기
        self.purchase_history = self._get_purchase_history(
            months=settings.RECOMMENDATION_ANALYSIS_MONTHS
        )

        if not self.purchase_history:
            return self._empty_pattern()

        # 2. 패턴 분석
        self.pattern_analysis = {
            'favorite_tags': self._analyze_favorite_tags(),
            'price_range': self._analyze_price_range(),
            'avg_price': self._analyze_avg_price(),
            'purchase_frequency': self._analyze_purchase_frequency(),
            'last_purchase_date': self._get_last_purchase_date(),
            'total_orders': len(self.purchase_history),
            'total_spent': self._calculate_total_spent(),
            'repurchase_products': self._find_repurchase_products(),
            'seasonal_preference': self._analyze_seasonal_preference()
        }

        return self.pattern_analysis

    def _get_purchase_history(self, months: int) -> List[Dict]:
        """최근 N개월간 구매 이력 조회"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=months * 30)

            # 주문 조회
            orders_result = supabase.table('orders')\
                .select('id, created_at, total_amount, status')\
                .eq('buyer_id', self.user_id)\
                .gte('created_at', cutoff_date.isoformat())\
                .in_('status', ['completed', 'delivered'])\
                .order('created_at', desc=True)\
                .execute()

            orders = orders_result.data or []

            # 각 주문의 상품 정보 가져오기
            purchase_history = []
            for order in orders:
                items_result = supabase.table('order_items')\
                    .select('product_id, product_name, quantity, price')\
                    .eq('order_id', order['id'])\
                    .execute()

                for item in items_result.data or []:
                    # 상품 상세 정보
                    product_result = supabase.table('products')\
                        .select('id, name, price, tags, category, brand, thumbnail_url, rating, review_count')\
                        .eq('id', item['product_id'])\
                        .execute()

                    if product_result.data:
                        product = product_result.data[0]
                        purchase_history.append({
                            'order_id': order['id'],
                            'order_date': order['created_at'],
                            'product_id': product['id'],
                            'product_name': product['name'],
                            'price': item['price'],
                            'quantity': item['quantity'],
                            'tags': product.get('tags', []),
                            'category': product.get('category'),
                            'brand': product.get('brand'),
                            'thumbnail_url': product.get('thumbnail_url'),
                            'rating': product.get('rating'),
                            'review_count': product.get('review_count')
                        })

            return purchase_history

        except Exception as e:
            logger.info(f"Purchase history error: {e}")
            return []

    def _empty_pattern(self) -> Dict:
        """구매 이력이 없을 때 빈 패턴 반환"""
        return {
            'favorite_tags': [],
            'price_range': (0, 0),
            'avg_price': 0,
            'purchase_frequency': 'none',
            'last_purchase_date': None,
            'total_orders': 0,
            'total_spent': 0,
            'repurchase_products': [],
            'seasonal_preference': {}
        }

    def _analyze_favorite_tags(self, top_n: int = 10) -> List[Tuple[str, int]]:
        """선호 태그 분석 (빈도수 높은 순)"""
        all_tags = []
        for item in self.purchase_history:
            if item.get('tags'):
                all_tags.extend(item['tags'])

        tag_counter = Counter(all_tags)
        return tag_counter.most_common(top_n)

    def _analyze_price_range(self) -> Tuple[float, float]:
        """선호 가격대 분석 (min, max)"""
        if not self.purchase_history:
            return (0, 0)

        prices = [item['price'] for item in self.purchase_history]
        return (min(prices), max(prices))

    def _analyze_avg_price(self) -> float:
        """평균 구매 가격"""
        if not self.purchase_history:
            return 0.0

        total = sum(item['price'] * item['quantity'] for item in self.purchase_history)
        count = sum(item['quantity'] for item in self.purchase_history)
        return round(total / count, 2) if count > 0 else 0.0

    def _analyze_purchase_frequency(self) -> str:
        """구매 주기 분석"""
        if len(self.purchase_history) < 2:
            return 'insufficient_data'

        # 주문 날짜 리스트 (중복 제거)
        order_dates = list(set([item['order_date'] for item in self.purchase_history]))
        order_dates.sort()

        # 주문 간 평균 간격 계산
        intervals = []
        for i in range(1, len(order_dates)):
            date1 = datetime.fromisoformat(order_dates[i-1].replace('Z', '+00:00'))
            date2 = datetime.fromisoformat(order_dates[i].replace('Z', '+00:00'))
            intervals.append((date2 - date1).days)

        if not intervals:
            return 'insufficient_data'

        avg_interval = sum(intervals) / len(intervals)

        if avg_interval <= 7:
            return 'weekly'
        elif avg_interval <= 30:
            return 'monthly'
        elif avg_interval <= 90:
            return 'quarterly'
        else:
            return 'occasional'

    def _get_last_purchase_date(self) -> Optional[str]:
        """마지막 구매일"""
        if not self.purchase_history:
            return None
        return self.purchase_history[0]['order_date']

    def _calculate_total_spent(self) -> float:
        """총 구매 금액"""
        return sum(item['price'] * item['quantity'] for item in self.purchase_history)

    def _find_repurchase_products(self) -> List[Dict]:
        """재구매한 상품 찾기"""
        product_counter = Counter([item['product_id'] for item in self.purchase_history])

        repurchase = []
        for product_id, count in product_counter.items():
            if count >= 2:
                # 해당 상품 정보 찾기
                for item in self.purchase_history:
                    if item['product_id'] == product_id:
                        repurchase.append({
                            'product_id': product_id,
                            'product_name': item['product_name'],
                            'purchase_count': count,
                            'last_purchase': item['order_date']
                        })
                        break

        return repurchase

    def _analyze_seasonal_preference(self) -> Dict[str, int]:
        """계절별 구매 패턴 분석"""
        seasonal_count = {'spring': 0, 'summer': 0, 'fall': 0, 'winter': 0}

        for item in self.purchase_history:
            try:
                order_date = datetime.fromisoformat(item['order_date'].replace('Z', '+00:00'))
                month = order_date.month

                if 3 <= month <= 5:
                    seasonal_count['spring'] += 1
                elif 6 <= month <= 8:
                    seasonal_count['summer'] += 1
                elif 9 <= month <= 11:
                    seasonal_count['fall'] += 1
                else:
                    seasonal_count['winter'] += 1
            except:
                continue

        return seasonal_count


def get_personalized_recommendations(
    user_id: str,
    limit: int = 10,
    exclude_purchased: bool = True
) -> Dict:
    """
    사용자 구매 패턴 기반 개인화 추천

    Args:
        user_id: 사용자 ID
        limit: 추천 상품 수
        exclude_purchased: 구매한 상품 제외 여부

    Returns:
        {
            'pattern': 구매 패턴 분석 결과,
            'recommendations': 추천 상품 리스트,
            'reason': 추천 이유
        }
    """
    try:
        # 1. 구매 패턴 분석
        analyzer = PurchasePattern(user_id)
        pattern = analyzer.analyze()

        if pattern['total_orders'] == 0:
            # 구매 이력 없음 - 베스트셀러 추천
            return {
                'pattern': pattern,
                'recommendations': _get_bestsellers(limit),
                'reason': '구매 이력이 없어 인기 상품을 추천드립니다.'
            }

        # 2. 패턴 기반 추천 상품 찾기
        recommendations = _find_pattern_based_products(pattern, limit, exclude_purchased, user_id)

        # 3. 추천 이유 생성
        reason = _generate_recommendation_reason(pattern)

        return {
            'pattern': pattern,
            'recommendations': recommendations,
            'reason': reason
        }

    except Exception as e:
        logger.info(f"Personalized recommendation error: {e}")
        return {
            'pattern': {},
            'recommendations': [],
            'reason': '추천 생성 중 오류가 발생했습니다.'
        }


def _find_pattern_based_products(
    pattern: Dict,
    limit: int,
    exclude_purchased: bool,
    user_id: str
) -> List[Dict]:
    """패턴 기반 상품 찾기"""
    try:
        # 1. 선호 태그 기반 검색
        favorite_tags = [tag for tag, count in pattern.get('favorite_tags', [])[:5]]

        if not favorite_tags:
            return _get_bestsellers(limit)

        # 2. 모든 활성 상품 조회
        result = supabase.table('products')\
            .select('id, name, price, tags, rating, review_count, sale_count, thumbnail_url, description')\
            .eq('is_active', True)\
            .execute()

        all_products = result.data or []

        # 3. 태그 매칭 & 가격대 필터링
        price_min, price_max = pattern.get('price_range', (0, float('inf')))
        avg_price = pattern.get('avg_price', 0)

        # 가격대 여유 범위
        tolerance = settings.RECOMMENDATION_PRICE_TOLERANCE
        acceptable_min = price_min * (1 - tolerance)
        acceptable_max = price_max * (1 + tolerance)

        matched_products = []
        for product in all_products:
            product_tags = product.get('tags', []) or []
            product_tags_lower = [tag.lower() for tag in product_tags]

            # 태그 매칭 점수 계산
            match_score = 0
            for fav_tag in favorite_tags:
                if fav_tag.lower() in product_tags_lower:
                    match_score += 1

            # 가격대 체크
            product_price = product.get('price', 0)
            price_match = acceptable_min <= product_price <= acceptable_max

            if match_score > 0 and price_match:
                matched_products.append({
                    **product,
                    'match_score': match_score,
                    'price_diff': abs(product_price - avg_price)
                })

        # 4. 구매한 상품 제외
        if exclude_purchased:
            purchased_ids = set()
            try:
                orders_result = supabase.table('orders')\
                    .select('id')\
                    .eq('buyer_id', user_id)\
                    .execute()

                for order in orders_result.data or []:
                    items_result = supabase.table('order_items')\
                        .select('product_id')\
                        .eq('order_id', order['id'])\
                        .execute()

                    for item in items_result.data or []:
                        purchased_ids.add(item['product_id'])

                matched_products = [p for p in matched_products if p['id'] not in purchased_ids]
            except:
                pass

        # 5. 정렬 (매칭 점수 > 평점 > 판매량)
        matched_products.sort(
            key=lambda x: (
                x.get('match_score', 0),
                x.get('rating', 0),
                x.get('sale_count', 0)
            ),
            reverse=True
        )

        return matched_products[:limit]

    except Exception as e:
        logger.info(f"Pattern-based search error: {e}")
        return []


def _get_bestsellers(limit: int) -> List[Dict]:
    """베스트셀러 조회 (fallback)"""
    try:
        result = supabase.table('products')\
            .select('id, name, price, tags, rating, review_count, sale_count, thumbnail_url, description')\
            .eq('is_active', True)\
            .order('sale_count', desc=True)\
            .limit(limit)\
            .execute()

        return result.data or []
    except:
        return []


def _generate_recommendation_reason(pattern: Dict) -> str:
    """추천 이유 생성"""
    reasons = []

    # 선호 태그
    favorite_tags = pattern.get('favorite_tags', [])
    if favorite_tags:
        top_tags = ', '.join([tag for tag, count in favorite_tags[:3]])
        reasons.append(f"'{top_tags}' 관련 상품을 자주 구매하셨습니다")

    # 가격대
    avg_price = pattern.get('avg_price', 0)
    if avg_price > 0:
        reasons.append(f"평소 {avg_price:,.0f}원대 상품을 선호하십니다")

    # 구매 주기
    frequency = pattern.get('purchase_frequency', '')
    if frequency in PURCHASE_FREQUENCY_MAP:
        reasons.append(f"{PURCHASE_FREQUENCY_MAP[frequency]} 구매하십니다")

    # 재구매 상품
    repurchase = pattern.get('repurchase_products', [])
    if repurchase:
        reasons.append(f"{len(repurchase)}개 상품을 재구매하셨습니다")

    if reasons:
        return "고객님의 구매 패턴 분석 결과: " + ", ".join(reasons)
    else:
        return "고객님의 취향을 분석하여 추천드립니다"


def format_personalized_recommendations_for_llm(recommendation_data: Dict) -> str:
    """
    개인화 추천 결과를 LLM 프롬프트용으로 포맷팅

    Args:
        recommendation_data: get_personalized_recommendations() 결과

    Returns:
        LLM용 텍스트
    """
    pattern = recommendation_data.get('pattern', {})
    products = recommendation_data.get('recommendations', [])
    reason = recommendation_data.get('reason', '')

    # 1. 구매 패턴 요약
    pattern_text = f"**고객 구매 패턴 분석**\n"
    pattern_text += f"- 총 주문 수: {pattern.get('total_orders', 0)}회\n"
    pattern_text += f"- 총 구매 금액: {pattern.get('total_spent', 0):,.0f}원\n"
    pattern_text += f"- 평균 구매 가격: {pattern.get('avg_price', 0):,.0f}원\n"
    pattern_text += f"- 구매 주기: {pattern.get('purchase_frequency', 'N/A')}\n"

    favorite_tags = pattern.get('favorite_tags', [])
    if favorite_tags:
        top_tags = ', '.join([f"{tag}({count}회)" for tag, count in favorite_tags[:5]])
        pattern_text += f"- 선호 태그: {top_tags}\n"

    repurchase = pattern.get('repurchase_products', [])
    if repurchase:
        pattern_text += f"- 재구매 상품: "
        for rp in repurchase[:3]:
            pattern_text += f"{rp['product_name']}({rp['purchase_count']}회), "
        pattern_text = pattern_text.rstrip(', ') + "\n"

    pattern_text += f"\n{reason}\n\n"

    # 2. 추천 상품 리스트
    if not products:
        return pattern_text + "추천 상품이 없습니다."

    products_text = "**맞춤 추천 상품**\n"
    for i, product in enumerate(products, 1):
        products_text += f"{i}. {product.get('name', '이름 없음')}\n"
        products_text += f"   - 가격: {product.get('price', 0):,}원\n"
        products_text += f"   - 평점: {product.get('rating', 0):.1f}/5.0 ({product.get('review_count', 0)}개 리뷰)\n"
        products_text += f"   - 판매량: {product.get('sale_count', 0)}개\n"

        if product.get('tags'):
            products_text += f"   - 태그: {', '.join(product['tags'])}\n"

        if product.get('match_score'):
            products_text += f"   - 매칭 점수: {product['match_score']}/5 (고객 선호도 일치)\n"

        products_text += "\n"

    return pattern_text + products_text
