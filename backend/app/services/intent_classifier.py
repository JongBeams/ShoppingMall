"""
벡터 기반 질문 의도 분류기
하드코딩 대신 임베딩 유사도로 사용자 의도 파악
"""

from typing import Dict, List
from sentence_transformers import SentenceTransformer
import numpy as np
from app.config import get_settings
import logging


logger = logging.getLogger(__name__)

settings = get_settings()

# 의도별 대표 문장들
INTENT_EXAMPLES = {
    "bestseller": [
        "베스트셀러 알려줘",
        "잘 팔리는 상품이 뭐야",
        "인기 상품 추천해줘",
        "많이 팔린 상품",
        "판매량 높은 상품",
        "가장 잘 팔린 것",
        "핫한 상품",
        "대박난 상품"
    ],
    "top_rated": [
        "평점 좋은 상품",
        "리뷰 좋은 제품",
        "고평점 상품 추천",
        "별점 높은 상품",
        "평가 좋은 것",
        "후기 좋은 상품"
    ],
    "new_arrival": [
        "신상품 뭐있어",
        "새로 나온 상품",
        "최신 상품 보여줘",
        "신제품 추천",
        "최근 등록된 상품",
        "새로운 제품"
    ],
    "keyword_search": [
        "코트 추천해줘",
        "키링 있어?",
        "파스타 소스 찾아줘",
        "면요리 관련 상품",
        "특정 상품 검색"
    ],
    "personal": [
        "내가 좋아하는 거 추천해줘",
        "나한테 맞는 상품",
        "평소에 내가 사던 거",
        "나랑 비슷한 상품",
        "내 취향에 맞는 것"
    ]
}


class IntentClassifier:
    def __init__(self, model_name: str = None):
        """벡터 기반 의도 분류기 초기화"""
        if model_name is None:
            model_name = settings.EMBEDDING_MODEL
        self.model = SentenceTransformer(model_name)
        self.intent_embeddings = self._create_intent_embeddings()

    def _create_intent_embeddings(self) -> Dict[str, np.ndarray]:
        """각 의도별 평균 임베딩 생성"""
        intent_embeddings = {}

        for intent, examples in INTENT_EXAMPLES.items():
            # 의도별 예시 문장들을 임베딩
            embeddings = self.model.encode(examples, normalize_embeddings=True)
            # 평균 벡터 계산
            mean_embedding = np.mean(embeddings, axis=0)
            intent_embeddings[intent] = mean_embedding

        return intent_embeddings

    def classify(self, query: str, threshold: float = 0.5) -> tuple[str, float]:
        """
        질문의 의도를 분류

        Args:
            query: 사용자 질문
            threshold: 유사도 임계값 (이 값 이하면 keyword_search로 분류)

        Returns:
            (의도, 유사도 점수)
        """
        # 질문 임베딩
        query_embedding = self.model.encode(query, normalize_embeddings=True)

        # 각 의도와의 코사인 유사도 계산
        similarities = {}
        for intent, intent_emb in self.intent_embeddings.items():
            similarity = float(np.dot(query_embedding, intent_emb))
            similarities[intent] = similarity

        # 가장 높은 유사도를 가진 의도 선택
        best_intent = max(similarities, key=similarities.get)
        best_score = similarities[best_intent]

        # 유사도가 너무 낮으면 keyword_search로 분류
        if best_score < threshold and best_intent != 'keyword_search':
            return 'keyword_search', best_score

        return best_intent, best_score


# 싱글톤 인스턴스
_classifier = None


def get_intent_classifier() -> IntentClassifier:
    """의도 분류기 싱글톤"""
    global _classifier
    if _classifier is None:
        logger.info("Loading intent classifier...")
        _classifier = IntentClassifier()
    return _classifier


def classify_intent(query: str) -> tuple[str, float]:
    """
    질문 의도 분류 (편의 함수)

    Returns:
        (intent, score)
        - intent: 'bestseller', 'top_rated', 'new_arrival', 'keyword_search', 'personal'
        - score: 0.0 ~ 1.0 유사도 점수
    """
    classifier = get_intent_classifier()
    return classifier.classify(query)


# 테스트용
if __name__ == "__main__":
    test_queries = [
        "베스트셀러 알려줘",
        "가장 잘 팔린 상품이 뭐야?",
        "평점 좋은 거 추천해줘",
        "신상품 보여줘",
        "코트 추천해줘",
        "내가 좋아하는 스타일 추천",
        "핫한 아이템 뭐있어?",
        "대박난 상품 알려줘"
    ]

    classifier = get_intent_classifier()

    print("=" * 60)
    logger.info("의도 분류 테스트")
    print("=" * 60)

    for query in test_queries:
        intent, score = classifier.classify(query)
        logger.info(f"질문: {query}")
        logger.info(f"→ 의도: {intent} (유사도: {score:.3f})")
        print()
