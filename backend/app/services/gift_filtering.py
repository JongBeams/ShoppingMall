"""
선물 추천을 위한 상품 필터링 서비스
"""
from typing import List, Dict, Optional
from app.services.supabase import supabase


# 관계별 추천 카테고리 매핑
GIFT_CATEGORY_MAP = {
    "연인_남": ["패션잡화", "향수", "지갑", "시계", "테크", "액세서리"],
    "연인_여": ["주얼리", "화장품", "가방", "향수", "꽃", "액세서리", "패션잡화"],
    "부모": ["건강", "가전", "식품", "인테리어", "의류"],
    "형제": ["패션", "게임", "스포츠", "도서", "테크"],
    "자녀": ["완구", "교육", "의류", "도서", "테크"],
    "친구": ["취미", "문구", "디저트", "체험권", "패션", "액세서리"],
    "동료": ["텀블러", "문구", "디퓨저", "커피", "다과", "책"],
}

# 관심사별 카테고리 매핑
INTEREST_CATEGORY_MAP = {
    "운동": ["스포츠", "운동복", "운동화", "헬스용품"],
    "독서": ["도서", "전자책", "북라이트", "북마크", "문구"],
    "게임": ["게임", "게이밍기어", "피규어", "굿즈", "테크"],
    "여행": ["여행용품", "캐리어", "백팩", "카메라", "액세서리"],
    "요리": ["주방용품", "식재료", "레시피북", "조리도구"],
    "음악": ["악기", "음향기기", "헤드폰", "음반"],
    "패션": ["의류", "신발", "가방", "액세서리", "주얼리"],
}

# 스타일별 키워드 매핑
STYLE_KEYWORDS = {
    "미니멀": ["심플", "베이직", "모던", "무지", "simple", "basic", "minimal"],
    "화려한": ["패턴", "컬러풀", "골드", "크리스탈", "화려", "럭셔리", "luxury"],
    "빈티지": ["레트로", "클래식", "앤틱", "vintage", "classic", "retro"],
    "모던": ["모던", "현대", "세련", "modern", "contemporary"],
    "캐주얼": ["캐주얼", "편한", "데일리", "casual", "comfortable"],
}


class GiftFilteringService:
    """선물 상품 필터링 서비스"""

    @staticmethod
    async def filter_products(
        relationship: str,
        interests: Optional[List[str]],
        budget_min: int,
        budget_max: int,
        style: str,
        age_range: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        선물 추천을 위한 상품 필터링

        Args:
            relationship: 관계 (예: 연인_남, 친구)
            interests: 관심사 리스트
            budget_min: 최소 예산
            budget_max: 최대 예산
            style: 스타일 (미니멀, 화려한 등)
            age_range: 연령대
            limit: 반환할 상품 수

        Returns:
            필터링된 상품 리스트
        """

        # 1단계: 관계 기반 카테고리 추출
        base_categories = GIFT_CATEGORY_MAP.get(relationship, [])

        # 2단계: 관심사 반영
        all_categories = base_categories.copy()
        if interests:
            for interest in interests:
                interest_categories = INTEREST_CATEGORY_MAP.get(interest, [])
                all_categories.extend(interest_categories)

        # 중복 제거
        all_categories = list(set(all_categories))

        # 3단계: 기본 쿼리 (활성 상품만, 평점 조건 제거)
        query = supabase.table('products').select(
            'id, name, slug, description, price, thumbnail_url, '
            'rating, review_count, tags, category_id, '
            'categories(name, slug), '
            'stock_quantity, is_active'
        ).eq('is_active', True)

        # 가격대 필터 (예산 ±30% 여유로 완화)
        price_min = int(budget_min * 0.7)
        price_max = int(budget_max * 1.5)
        query = query.gte('price', price_min).lte('price', price_max)

        # 재고 조건도 완화 (0개여도 일단 보여주기)
        # query = query.gt('stock_quantity', 0)

        # 카테고리 필터 (OR 조건)
        # Supabase는 OR 필터가 복잡하므로, 일단 전체 조회 후 필터링
        result = query.limit(500).execute()

        if not result.data:
            return []

        products = result.data

        # 4단계: 카테고리 필터링 (Python에서 처리)
        filtered_products = []
        for product in products:
            category_name = product.get('categories', {}).get('name', '') if product.get('categories') else ''

            # 카테고리 매칭 확인
            if all_categories:
                category_matched = any(
                    cat.lower() in category_name.lower()
                    for cat in all_categories
                )
            else:
                category_matched = True  # 카테고리 조건 없으면 통과

            if category_matched:
                filtered_products.append(product)

        # 카테고리 매칭 실패 시 전체 상품 반환
        if not filtered_products and products:
            print(f"카테고리 매칭 실패, 전체 상품 {len(products)}개 반환")
            filtered_products = products

        # 5단계: 스타일 키워드 매칭
        style_keywords = STYLE_KEYWORDS.get(style, [])
        if style_keywords:
            styled_products = []
            for product in filtered_products:
                name = product.get('name', '').lower()
                description = product.get('description', '').lower() if product.get('description') else ''
                tags = product.get('tags', [])
                tags_str = ' '.join(tags).lower() if tags else ''

                # 키워드 매칭 확인
                keyword_matched = any(
                    keyword.lower() in name or
                    keyword.lower() in description or
                    keyword.lower() in tags_str
                    for keyword in style_keywords
                )

                if keyword_matched:
                    product['style_score'] = 2  # 스타일 매칭 보너스
                    styled_products.append(product)
                else:
                    product['style_score'] = 0
                    styled_products.append(product)

            filtered_products = styled_products

        # 6단계: 정렬 (스타일 매칭 > 평점 > 리뷰 수)
        filtered_products.sort(
            key=lambda x: (
                x.get('style_score', 0),
                float(x.get('rating', 0)),
                x.get('review_count', 0)
            ),
            reverse=True
        )

        # 7단계: 상위 N개 반환
        return filtered_products[:limit]


    @staticmethod
    def format_products_for_llm(products: List[Dict]) -> str:
        """
        LLM에게 전달할 상품 목록 포맷팅

        Args:
            products: 상품 리스트

        Returns:
            포맷팅된 문자열
        """
        if not products:
            return "추천할 상품이 없습니다."

        formatted = []
        for idx, product in enumerate(products, 1):
            name = product.get('name', '이름 없음')
            price = int(product.get('price', 0))
            rating = float(product.get('rating', 0))
            review_count = product.get('review_count', 0)
            description = product.get('description', '')
            tags = product.get('tags', [])

            # 설명이 너무 길면 자르기
            if description and len(description) > 100:
                description = description[:100] + '...'

            formatted.append(
                f"{idx}. {name}\n"
                f"   가격: {price:,}원\n"
                f"   평점: {rating:.1f}점 (리뷰 {review_count}개)\n"
                f"   설명: {description}\n"
                f"   태그: {', '.join(tags) if tags else '없음'}\n"
            )

        return '\n'.join(formatted)


    @staticmethod
    async def get_user_purchase_history(user_id: str, limit: int = 10) -> List[Dict]:
        """
        사용자 구매 이력 조회 (선물 히스토리 참고용)

        Args:
            user_id: 사용자 ID
            limit: 조회 개수

        Returns:
            구매 이력 리스트
        """
        try:
            result = supabase.table('gift_history').select(
                'recipient_relationship, occasion, product_name, price, given_date'
            ).eq('user_id', user_id).order('given_date', desc=True).limit(limit).execute()

            return result.data if result.data else []
        except Exception as e:
            print(f"구매 이력 조회 오류: {e}")
            return []
