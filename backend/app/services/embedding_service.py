"""
임베딩 벡터 생성 및 유사도 검색 서비스
"""
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import get_settings

settings = get_settings()


class EmbeddingService:
    """임베딩 벡터 생성 및 유사도 검색"""

    _model = None

    @classmethod
    def get_model(cls):
        """임베딩 모델 싱글톤"""
        if cls._model is None:
            print(f"임베딩 모델 로딩 중: {settings.EMBEDDING_MODEL}")
            cls._model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return cls._model


    @staticmethod
    def generate_embedding(text: str) -> np.ndarray:
        """
        텍스트를 임베딩 벡터로 변환

        Args:
            text: 임베딩할 텍스트

        Returns:
            임베딩 벡터 (numpy array)
        """
        model = EmbeddingService.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding


    @staticmethod
    def generate_embeddings_batch(texts: List[str]) -> np.ndarray:
        """
        여러 텍스트를 한 번에 임베딩

        Args:
            texts: 텍스트 리스트

        Returns:
            임베딩 벡터 배열 (numpy array)
        """
        model = EmbeddingService.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        return embeddings


    @staticmethod
    def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        코사인 유사도 계산

        Args:
            vec1: 벡터 1
            vec2: 벡터 2

        Returns:
            코사인 유사도 (0~1)
        """
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))


    @staticmethod
    def find_most_similar(
        query_embedding: np.ndarray,
        product_embeddings: List[np.ndarray],
        products: List[Dict],
        top_k: int = 50
    ) -> List[Dict]:
        """
        쿼리와 가장 유사한 상품들 찾기

        Args:
            query_embedding: 쿼리 임베딩 벡터
            product_embeddings: 상품 임베딩 벡터 리스트
            products: 상품 정보 리스트
            top_k: 반환할 상품 수

        Returns:
            유사도 점수가 포함된 상품 리스트
        """
        if len(product_embeddings) == 0 or len(products) == 0:
            return []

        # 유사도 계산
        similarities = []
        for idx, prod_embedding in enumerate(product_embeddings):
            similarity = EmbeddingService.cosine_similarity(query_embedding, prod_embedding)
            similarities.append({
                'product': products[idx],
                'similarity': similarity
            })

        # 유사도 높은 순으로 정렬
        similarities.sort(key=lambda x: x['similarity'], reverse=True)

        # 상위 top_k개 반환
        results = []
        for item in similarities[:top_k]:
            product = item['product'].copy()
            product['similarity_score'] = item['similarity']
            results.append(product)

        return results


    @staticmethod
    def create_product_text(product: Dict) -> str:
        """
        상품 정보를 임베딩용 텍스트로 변환

        Args:
            product: 상품 딕셔너리

        Returns:
            임베딩용 텍스트
        """
        parts = []

        # 카테고리
        if product.get('categories'):
            category_name = product['categories'].get('name', '')
            if category_name:
                parts.append(f"카테고리: {category_name}")

        # 상품명
        if product.get('name'):
            parts.append(f"상품명: {product['name']}")

        # 설명
        if product.get('description'):
            desc = product['description'][:200]  # 너무 길면 자르기
            parts.append(f"설명: {desc}")

        # 태그
        if product.get('tags') and isinstance(product['tags'], list):
            tags_str = ', '.join(product['tags'])
            parts.append(f"태그: {tags_str}")

        return ' | '.join(parts)


    @staticmethod
    def create_gift_query_text(
        relationship: str,
        interests: List[str],
        style: str,
        occasion: str,
        age_range: str
    ) -> str:
        """
        선물 검색 쿼리를 텍스트로 변환

        Args:
            relationship: 관계
            interests: 관심사 리스트
            style: 스타일
            occasion: 상황
            age_range: 연령대

        Returns:
            쿼리 텍스트
        """
        parts = []

        # 관계
        relationship_text = relationship.replace('_', ' ')
        parts.append(f"선물 받을 사람: {relationship_text}")

        # 상황
        parts.append(f"선물 상황: {occasion}")

        # 스타일
        parts.append(f"스타일: {style}")

        # 관심사
        if interests:
            interests_str = ', '.join(interests)
            parts.append(f"관심사: {interests_str}")

        # 연령대
        parts.append(f"연령대: {age_range}")

        return ' | '.join(parts)
