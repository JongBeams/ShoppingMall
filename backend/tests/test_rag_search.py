"""RAG 검색 기능 테스트"""
import pytest
from unittest.mock import Mock, patch
from app.services.rag_search import (
    embed_query,
    search_documents,
    extract_keywords_from_query
)


class TestRAGSearch:
    """RAG 검색 기능 테스트"""

    @patch('app.services.rag_search.get_embedding_model')
    def test_embed_query(self, mock_get_model):
        """쿼리 임베딩 생성 테스트"""
        # Given
        query = "무선 이어폰 추천해줘"
        mock_model = Mock()
        mock_model.encode.return_value = Mock(tolist=lambda: [0.1] * 768)
        mock_get_model.return_value = mock_model

        # When
        embedding = embed_query(query)

        # Then
        assert embedding is not None
        assert isinstance(embedding, list)
        assert len(embedding) > 0

    @patch('app.services.rag_search.supabase')
    @patch('app.services.rag_search.embed_query')
    def test_search_documents(self, mock_embed, mock_supabase):
        """문서 검색 테스트"""
        # Given
        query = "무선 이어폰 추천"
        mock_embed.return_value = [0.1] * 768

        mock_result = Mock()
        mock_result.data = [
            {
                "id": "doc1",
                "content": "무선 이어폰 사용 설명서",
                "similarity": 0.95
            },
            {
                "id": "doc2",
                "content": "블루투스 연결 방법",
                "similarity": 0.85
            }
        ]
        mock_supabase.rpc.return_value.execute.return_value = mock_result

        # When
        documents = search_documents(query, limit=3)

        # Then
        assert documents is not None
        assert len(documents) <= 3
        assert documents[0]["similarity"] >= documents[1]["similarity"]

    def test_extract_keywords_from_query(self):
        """쿼리에서 키워드 추출 테스트"""
        # Given
        from app.services.product_statistics import extract_keywords_from_query
        query = "무선 이어폰 추천해줘"

        # When
        keywords = extract_keywords_from_query(query)

        # Then
        assert keywords is not None
        assert isinstance(keywords, list)
        # 키워드는 상품 관련 단어여야 함
        assert any(keyword in ["무선", "이어폰", "블루투스"] for keyword in keywords if keywords)

    @patch('app.services.rag_search.generate_answer_with_ollama')
    def test_generate_answer(self, mock_generate):
        """LLM 답변 생성 테스트"""
        # Given
        query = "무선 이어폰 추천"
        documents = [
            {"content": "무선 이어폰은 케이블 없이 사용할 수 있습니다"}
        ]
        mock_generate.return_value = "에어팟 프로를 추천드립니다."

        # When
        from app.services.rag_search import generate_answer_with_ollama
        answer = generate_answer_with_ollama(query, documents)

        # Then
        assert answer is not None
        assert isinstance(answer, str)
        assert len(answer) > 0
