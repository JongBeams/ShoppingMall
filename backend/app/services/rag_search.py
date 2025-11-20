"""
RAG 검색 서비스 (pgvector + Ollama)
"""

from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
import requests
from app.services.supabase import supabase

# 전역 임베딩 모델
_embedding_model: Optional[SentenceTransformer] = None

def get_embedding_model() -> SentenceTransformer:
    """임베딩 모델 싱글톤"""
    global _embedding_model
    if _embedding_model is None:
        print("Loading embedding model: BAAI/bge-m3...")
        _embedding_model = SentenceTransformer('BAAI/bge-m3')
    return _embedding_model


def embed_query(query: str) -> List[float]:
    """질문을 벡터로 임베딩"""
    model = get_embedding_model()
    embedding = model.encode(query, normalize_embeddings=True)
    return embedding.tolist()


def search_documents(query: str, limit: int = 3) -> List[Dict]:
    """
    pgvector로 유사 문서 검색

    Args:
        query: 검색 질문
        limit: 반환할 최대 문서 수

    Returns:
        유사 문서 리스트 (content, similarity 포함)
    """
    # 1. 질문 임베딩
    query_embedding = embed_query(query)

    # 2. Supabase에서 pgvector 검색
    # cosine similarity로 가장 유사한 청크 검색
    try:
        # RPC 함수 호출 (Supabase에 RPC 함수 생성 필요)
        result = supabase.rpc(
            'search_document_chunks',
            {
                'query_embedding': query_embedding,
                'match_count': limit
            }
        ).execute()

        return result.data or []

    except Exception as e:
        print(f"pgvector search error: {e}")
        # RPC 함수가 없으면 fallback: 모든 청크 가져와서 Python에서 계산
        return fallback_search(query_embedding, limit)


def fallback_search(query_embedding: List[float], limit: int) -> List[Dict]:
    """
    RPC 함수가 없을 때 대체 검색
    (비효율적이지만 작은 데이터셋에서는 OK)
    """
    try:
        # 모든 청크 가져오기
        result = supabase.table('document_chunks').select('id, content, embedding').execute()

        if not result.data:
            return []

        # Python에서 코사인 유사도 계산
        import numpy as np

        chunks_with_similarity = []
        query_vec = np.array(query_embedding)

        for chunk in result.data:
            if chunk.get('embedding'):
                chunk_vec = np.array(chunk['embedding'])
                # 코사인 유사도
                similarity = float(np.dot(query_vec, chunk_vec))
                chunks_with_similarity.append({
                    'id': chunk['id'],
                    'content': chunk['content'],
                    'similarity': similarity
                })

        # 유사도 순으로 정렬
        chunks_with_similarity.sort(key=lambda x: x['similarity'], reverse=True)

        return chunks_with_similarity[:limit]

    except Exception as e:
        print(f"Fallback search error: {e}")
        return []


def generate_answer_with_ollama(
    query: str,
    context_docs: List[Dict],
    model: str = "qwen2.5:14b",
    ollama_host: str = "http://localhost:11435"
) -> str:
    """
    Ollama로 답변 생성

    Args:
        query: 사용자 질문
        context_docs: 검색된 문서들
        model: Ollama 모델명
        ollama_host: Ollama 서버 주소

    Returns:
        생성된 답변
    """
    # 1. 컨텍스트 생성
    context = "\n\n".join([
        f"문서 {i+1}:\n{doc.get('content', '')}"
        for i, doc in enumerate(context_docs)
    ])

    # 2. 프롬프트 생성
    prompt = f"""당신은 쇼핑몰 AI 어시스턴트입니다. 아래 문서를 참고하여 질문에 답변하세요.

참고 문서:
{context}

사용자 질문: {query}

답변: (문서 내용을 바탕으로 간결하고 정확하게 답변하세요. 문서에 없는 내용은 "문서에서 찾을 수 없습니다"라고 답변하세요.)"""

    # 3. Ollama API 호출
    try:
        response = requests.post(
            f"{ollama_host}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            return result.get("response", "답변 생성 실패")
        else:
            return f"Ollama 오류: {response.status_code}"

    except Exception as e:
        print(f"Ollama error: {e}")
        return f"답변 생성 중 오류 발생: {str(e)}"


def rag_search(
    query: str,
    search_limit: int = 3,
    use_ollama: bool = True
) -> Dict:
    """
    전체 RAG 검색 프로세스

    Args:
        query: 사용자 질문
        search_limit: 검색할 문서 수
        use_ollama: Ollama 사용 여부

    Returns:
        {
            "query": 질문,
            "documents": 검색된 문서들,
            "answer": Ollama 답변 (use_ollama=True일 때)
        }
    """
    # 1. 문서 검색
    documents = search_documents(query, limit=search_limit)

    result = {
        "query": query,
        "documents": documents
    }

    # 2. Ollama로 답변 생성
    if use_ollama and documents:
        answer = generate_answer_with_ollama(query, documents)
        result["answer"] = answer
    else:
        result["answer"] = "검색된 문서가 없습니다." if not documents else None

    return result
