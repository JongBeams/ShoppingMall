"""
상품 통계 및 추천 서비스
태그, 판매량, 리뷰 등을 기반으로 상품 추천
"""

from typing import List, Dict, Optional
from app.services.supabase import supabase


def get_bestsellers(limit: int = 10) -> List[Dict]:
    """
    판매량 많은 순으로 상품 조회

    Args:
        limit: 조회할 상품 수

    Returns:
        상품 리스트 (sale_count 내림차순)
    """
    try:
        result = supabase.table('products')\
            .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url')\
            .eq('is_active', True)\
            .order('sale_count', desc=True)\
            .limit(limit)\
            .execute()

        return result.data or []
    except Exception as e:
        print(f"Bestsellers query error: {e}")
        return []


def get_top_rated(limit: int = 10, min_reviews: int = 3) -> List[Dict]:
    """
    평점 높은 순으로 상품 조회

    Args:
        limit: 조회할 상품 수
        min_reviews: 최소 리뷰 개수 (신뢰도 확보)

    Returns:
        상품 리스트 (rating 내림차순)
    """
    try:
        result = supabase.table('products')\
            .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url')\
            .eq('is_active', True)\
            .gte('review_count', min_reviews)\
            .order('rating', desc=True)\
            .limit(limit)\
            .execute()

        return result.data or []
    except Exception as e:
        print(f"Top rated query error: {e}")
        return []


def get_new_arrivals(limit: int = 10) -> List[Dict]:
    """
    신상품 조회 (최근 등록된 순)

    Args:
        limit: 조회할 상품 수

    Returns:
        상품 리스트 (created_at 내림차순)
    """
    try:
        result = supabase.table('products')\
            .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url, created_at')\
            .eq('is_active', True)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()

        return result.data or []
    except Exception as e:
        print(f"New arrivals query error: {e}")
        return []


def search_by_tags(tags_list: List[str], limit: int = 20) -> List[Dict]:
    """
    태그로 상품 검색 후 판매량/평점 순으로 정렬

    Args:
        tags_list: 검색할 태그 리스트
        limit: 조회할 상품 수

    Returns:
        태그 매칭된 상품 리스트 (판매량, 평점 순)
    """
    try:
        # 모든 활성 상품 조회 (태그 필터링을 위해)
        result = supabase.table('products')\
            .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url')\
            .eq('is_active', True)\
            .execute()

        all_products = result.data or []

        # 태그 매칭
        matched_products = []
        for product in all_products:
            product_tags = product.get('tags', []) or []

            # 대소문자 구분 없이 태그 매칭
            product_tags_lower = [tag.lower() for tag in product_tags]

            for search_tag in tags_list:
                if search_tag.lower() in product_tags_lower:
                    matched_products.append(product)
                    break  # 중복 방지

        # 판매량과 평점으로 정렬 (판매량 우선, 그 다음 평점)
        matched_products.sort(
            key=lambda x: (x.get('sale_count', 0), x.get('rating', 0)),
            reverse=True
        )

        return matched_products[:limit]

    except Exception as e:
        print(f"Tag search error: {e}")
        return []


def search_by_keyword(keyword: str, limit: int = 20) -> List[Dict]:
    """
    상품명/설명/태그로 키워드 검색

    Args:
        keyword: 검색 키워드
        limit: 조회할 상품 수

    Returns:
        키워드 매칭된 상품 리스트 (판매량, 평점 순)
    """
    try:
        # 상품명, 설명으로 검색
        result = supabase.table('products')\
            .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url')\
            .eq('is_active', True)\
            .or_(f"name.ilike.%{keyword}%,description.ilike.%{keyword}%")\
            .execute()

        products = result.data or []

        # 태그로도 검색
        all_products_result = supabase.table('products')\
            .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url')\
            .eq('is_active', True)\
            .execute()

        found_ids = {p['id'] for p in products}

        for product in all_products_result.data or []:
            if product['id'] not in found_ids and product.get('tags'):
                for tag in product['tags']:
                    if keyword.lower() in tag.lower():
                        products.append(product)
                        found_ids.add(product['id'])
                        break

        # 판매량과 평점으로 정렬
        products.sort(
            key=lambda x: (x.get('sale_count', 0), x.get('rating', 0)),
            reverse=True
        )

        return products[:limit]

    except Exception as e:
        print(f"Keyword search error: {e}")
        return []


def get_user_purchase_history(user_id: str, limit: int = 10) -> List[Dict]:
    """
    사용자 구매 이력 조회

    Args:
        user_id: 사용자 ID
        limit: 조회할 개수

    Returns:
        구매한 상품 리스트 (최근 순)
    """
    try:
        # orders 테이블에서 사용자의 주문 조회
        orders_result = supabase.table('orders')\
            .select('id, created_at')\
            .eq('buyer_id', user_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()

        orders = orders_result.data or []

        if not orders:
            return []

        # order_items에서 상품 ID 추출
        purchased_products = []
        for order in orders:
            items_result = supabase.table('order_items')\
                .select('product_id, product_name')\
                .eq('order_id', order['id'])\
                .execute()

            for item in items_result.data or []:
                # 상품 정보 조회
                product_result = supabase.table('products')\
                    .select('id, name, description, price, sale_count, rating, review_count, tags, thumbnail_url')\
                    .eq('id', item['product_id'])\
                    .execute()

                if product_result.data:
                    purchased_products.append(product_result.data[0])

        return purchased_products

    except Exception as e:
        print(f"Purchase history query error: {e}")
        return []


def format_products_for_llm(products: List[Dict], include_reviews: bool = True) -> str:
    """
    상품 리스트를 LLM 프롬프트용 텍스트로 포맷팅

    Args:
        products: 상품 리스트
        include_reviews: 리뷰 내용 포함 여부 (기본값: True)

    Returns:
        포맷팅된 텍스트
    """
    if not products:
        return "관련 상품이 없습니다."

    formatted = []
    for i, product in enumerate(products, 1):
        text = f"{i}. {product.get('name', '이름 없음')}\n"
        text += f"   - 가격: {product.get('price', 0):,}원\n"
        text += f"   - 판매량: {product.get('sale_count', 0)}개\n"
        text += f"   - 평점: {product.get('rating', 0):.1f}/5.0 ({product.get('review_count', 0)}개 리뷰)\n"

        if product.get('tags'):
            text += f"   - 태그: {', '.join(product['tags'])}\n"

        if product.get('description'):
            desc = product['description'][:100] + "..." if len(product['description']) > 100 else product['description']
            text += f"   - 설명: {desc}\n"

        # 리뷰 내용 포함
        if include_reviews and product.get('review_count', 0) > 0:
            try:
                reviews_result = supabase.table('reviews')\
                    .select('rating, content')\
                    .eq('product_id', product['id'])\
                    .order('created_at', desc=True)\
                    .limit(3)\
                    .execute()

                if reviews_result.data:
                    text += f"   - 최근 리뷰:\n"
                    for idx, review in enumerate(reviews_result.data, 1):
                        content = review.get('content', '')
                        if content:
                            review_text = content[:80] + "..." if len(content) > 80 else content
                            text += f"     {idx}) {review['rating']}/5 - {review_text}\n"
            except Exception as e:
                print(f"Error fetching reviews for product {product.get('id')}: {e}")

        formatted.append(text)

    return "\n".join(formatted)


def extract_keywords_from_query(query: str) -> List[str]:
    """
    사용자 질문에서 키워드 추출 (간단한 구현)

    Args:
        query: 사용자 질문

    Returns:
        추출된 키워드 리스트
    """
    # 불용어 제거 (질문 관련 단어들)
    stopwords = [
        '추천', '해줘', '알려줘', '뭐', '있어', '좀', '해', '주세요', '요', '가', '이', '을', '를', '은', '는', '의', '에',
        '상품', '제품', '뭐야', '뭔데', '어디', '어떤', '어떻게', '중에서', '중에', '가장', '제일', '가져와',
        '인기', '인기많은', '인기있는', '인기많은게', '많은', '많이', '좋은', '좋은거', '괜찮은', '괜찮은거',
        '베스트', '베스트셀러', '신상', '신상품', '새로운', '새로', '나온', '평점', '리뷰', '후기',
        '잘', '팔리는', '팔린', '판매', '판매량', '구매', '구입', '사고', '싶어', '싶은', '주문',
        '보여줘', '찾아줘', '검색', '뭐있어', '뭐야', '뭐지', '뭔가', '있나', '있나요', '있어요', '주문'
    ]

    # 공백으로 분리
    words = query.split()

    # 불용어 제거 및 2글자 이상 키워드만 추출
    keywords = []
    for word in words:
        # 불용어 체크 (포함 관계도 확인)
        is_stopword = False
        for stopword in stopwords:
            if stopword in word or word in stopword:
                is_stopword = True
                break

        if not is_stopword and len(word) >= 2:
            keywords.append(word)

    return keywords
