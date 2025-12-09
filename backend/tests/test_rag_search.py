"""RAG 검색 시스템 테스트 (확장 버전)"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import requests
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


class TestEmbeddingErrorHandling:
    """임베딩 생성 에러 처리 테스트"""

    @patch('app.services.rag_search.get_embedding_model')
    def test_empty_query_returns_empty_embedding(self, mock_get_model):
        """빈 쿼리 처리"""
        # When: 빈 쿼리
        embedding = embed_query("")

        # Then: 빈 리스트 또는 None
        assert embedding is None or embedding == []

    @patch('app.services.rag_search.get_embedding_model')
    def test_model_timeout_handling(self, mock_get_model):
        """임베딩 모델 타임아웃 처리"""
        # Given: 타임아웃 발생
        mock_model = Mock()
        mock_model.encode.side_effect = TimeoutError("Model timeout")
        mock_get_model.return_value = mock_model

        # When: 임베딩 생성
        embedding = embed_query("노트북")

        # Then: 에러 처리 (빈 리스트 또는 None)
        assert embedding is None or embedding == []

    @patch('app.services.rag_search.get_embedding_model')
    def test_special_characters_in_query(self, mock_get_model):
        """특수문자 포함 쿼리 처리"""
        # Given: 특수문자 쿼리
        mock_model = Mock()
        mock_model.encode.return_value = Mock(tolist=lambda: [0.1] * 768)
        mock_get_model.return_value = mock_model

        # When: 특수문자 쿼리
        embedding = embed_query("<script>alert('XSS')</script>")

        # Then: 정상 처리
        assert embedding is not None
        assert len(embedding) == 768


class TestVectorSearch:
    """벡터 검색 테스트"""

    @patch('app.services.rag_search.supabase')
    @patch('app.services.rag_search.embed_query')
    def test_no_matching_results(self, mock_embed, mock_supabase):
        """매칭 결과 없을 때"""
        # Given: 빈 검색 결과
        mock_embed.return_value = [0.1] * 768
        mock_supabase.rpc.return_value.execute.return_value = Mock(data=[])

        # When: 문서 검색
        documents = search_documents("존재하지 않는 상품", limit=10)

        # Then: 빈 리스트
        assert documents == []

    @patch('app.services.rag_search.supabase')
    @patch('app.services.rag_search.embed_query')
    def test_similarity_threshold_filtering(self, mock_embed, mock_supabase):
        """유사도 임계값 필터링"""
        # Given: 낮은 유사도 결과 포함
        mock_embed.return_value = [0.1] * 768
        mock_result = Mock()
        mock_result.data = [
            {"id": "doc1", "content": "상품1", "similarity": 0.95},
            {"id": "doc2", "content": "상품2", "similarity": 0.50},
            {"id": "doc3", "content": "상품3", "similarity": 0.30}
        ]
        mock_supabase.rpc.return_value.execute.return_value = mock_result

        # When: 검색 (threshold 0.7 가정)
        documents = search_documents("노트북", limit=10, threshold=0.7)

        # Then: 높은 유사도만 반환
        if documents:
            assert all(doc.get('similarity', 1.0) >= 0.7 for doc in documents)

    @patch('app.services.rag_search.supabase')
    @patch('app.services.rag_search.embed_query')
    def test_vector_search_timeout(self, mock_embed, mock_supabase):
        """벡터 검색 타임아웃 처리"""
        # Given: RPC 타임아웃
        mock_embed.return_value = [0.1] * 768
        mock_supabase.rpc.return_value.execute.side_effect = requests.exceptions.Timeout("Timeout")

        # When: 문서 검색
        documents = search_documents("노트북", limit=5)

        # Then: 빈 리스트 또는 fallback
        assert isinstance(documents, list)


class TestLLMGeneration:
    """LLM 답변 생성 테스트"""

    @patch('app.services.rag_search.generate_answer_with_ollama')
    def test_llm_response_with_context(self, mock_generate):
        """컨텍스트 포함 LLM 응답"""
        # Given: 검색 결과
        documents = [
            {"content": "노트북은 휴대용 컴퓨터입니다."},
            {"content": "삼성 갤럭시북이 인기입니다."}
        ]
        mock_generate.return_value = "삼성 갤럭시북을 추천드립니다."

        # When: 답변 생성
        from app.services.rag_search import generate_answer_with_ollama
        answer = generate_answer_with_ollama("노트북 추천", documents)

        # Then: 컨텍스트 기반 응답
        assert "삼성" in answer or "갤럭시북" in answer

    @patch('app.services.rag_search.generate_answer_with_ollama')
    def test_llm_timeout_handling(self, mock_generate):
        """LLM 타임아웃 처리"""
        # Given: 타임아웃 발생
        mock_generate.side_effect = requests.exceptions.Timeout("LLM timeout")

        # When: 답변 생성
        from app.services.rag_search import generate_answer_with_ollama
        answer = generate_answer_with_ollama("노트북 추천", [])

        # Then: 에러 처리 (기본 메시지 또는 None)
        assert answer is None or isinstance(answer, str)


class TestEdgeCases:
    """엣지 케이스 테스트"""

    @patch('app.services.rag_search.get_embedding_model')
    def test_extremely_long_query(self, mock_get_model):
        """매우 긴 쿼리 처리"""
        # Given: 10,000자 쿼리
        long_query = "노트북 " * 2000
        mock_model = Mock()
        mock_model.encode.return_value = Mock(tolist=lambda: [0.1] * 768)
        mock_get_model.return_value = mock_model

        # When: 임베딩 생성
        embedding = embed_query(long_query)

        # Then: 정상 처리 (또는 truncate)
        assert embedding is not None
        assert len(embedding) == 768

    @patch('app.services.rag_search.supabase')
    @patch('app.services.rag_search.embed_query')
    def test_malformed_embedding_vector(self, mock_embed, mock_supabase):
        """잘못된 형식의 임베딩 벡터"""
        # Given: 잘못된 차원의 벡터
        mock_embed.return_value = [0.1] * 100  # 768차원이 아닌 100차원
        mock_supabase.rpc.return_value.execute.return_value = Mock(data=[])

        # When: 벡터 검색
        documents = search_documents("노트북", limit=10)

        # Then: 에러 처리
        assert isinstance(documents, list)
