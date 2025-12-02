"""
선물 추천을 위한 상품 필터링 서비스 (임베딩 기반)
"""
from typing import List, Dict, Optional
from app.services.supabase import supabase
from app.services.embedding_service import EmbeddingService


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
    """선물 상품 필터링 서비스 (임베딩 기반)"""

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
        선물 추천을 위한 상품 필터링 (임베딩 기반 의미 검색)

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

        # 1단계: 기본 쿼리 (활성 상품만)
        query = supabase.table('products').select(
            'id, name, slug, description, price, thumbnail_url, '
            'rating, review_count, tags, category_id, '
            'categories(name, slug), '
            'stock_quantity, is_active'
        ).eq('is_active', True)

        # 가격대 필터 (예산 ±50% 여유)
        price_min = int(budget_min * 0.5)
        price_max = int(budget_max * 1.5)
        query = query.gte('price', price_min).lte('price', price_max)

        result = query.limit(500).execute()

        if not result.data:
            print("조건에 맞는 상품 없음")
            return []

        products = result.data
        print(f"가격 필터링 후 상품 수: {len(products)}개")

        # 2단계: 쿼리 텍스트 생성
        query_text = EmbeddingService.create_gift_query_text(
            relationship=relationship,
            interests=interests or [],
            style=style,
            occasion="선물",  # 나중에 answers에서 가져오도록 수정 가능
            age_range=age_range
        )

        print(f"검색 쿼리: {query_text}")

        # 3단계: 쿼리 임베딩
        query_embedding = EmbeddingService.generate_embedding(query_text)

        # 4단계: 상품 텍스트 생성 및 임베딩
        product_texts = [
            EmbeddingService.create_product_text(product)
            for product in products
        ]

        print("상품 임베딩 생성 중...")
        product_embeddings = EmbeddingService.generate_embeddings_batch(product_texts)

        # 5단계: 유사도 검색
        print("유사도 계산 중...")
        similar_products = EmbeddingService.find_most_similar(
            query_embedding=query_embedding,
            product_embeddings=list(product_embeddings),
            products=products,
            top_k=limit
        )

        print(f"최종 추천 상품 수: {len(similar_products)}개")
        if similar_products:
            print(f"최고 유사도: {similar_products[0].get('similarity_score', 0):.3f}")

        return similar_products


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
