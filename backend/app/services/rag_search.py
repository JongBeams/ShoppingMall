"""
RAG 검색 서비스 (pgvector + Ollama + 상품 추천)
"""

from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
import requests
from app.services.supabase import supabase
from app.services.product_statistics import (
    get_bestsellers,
    get_top_rated,
    get_new_arrivals,
    search_by_tags,
    search_by_keyword,
    get_user_purchase_history,
    format_products_for_llm,
    extract_keywords_from_query
)
from app.services.intent_classifier import classify_intent

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
    product_context: str = "",
    model: str = "qwen2.5:14b",
    ollama_host: str = "http://localhost:11435"
) -> str:
    """
    Ollama로 답변 생성 (상품 추천 포함)

    Args:
        query: 사용자 질문
        context_docs: 검색된 문서들
        product_context: 상품 정보 컨텍스트
        model: Ollama 모델명
        ollama_host: Ollama 서버 주소

    Returns:
        생성된 답변
    """
    # 1. 문서 컨텍스트 생성
    doc_context = "\n\n".join([
        f"문서 {i+1}:\n{doc.get('content', '')}"
        for i, doc in enumerate(context_docs)
    ])

    # 2. 프롬프트 생성 (상품 정보 추가)
    if product_context:
        prompt = f"""당신은 쇼핑몰 AI 어시스턴트입니다. 아래 정보를 참고하여 질문에 답변하세요.

참고 문서:
{doc_context}

추천 상품 정보:
{product_context}

사용자 질문: {query}

답변: (위 정보를 바탕으로 사용자에게 유용한 상품을 추천하거나 질문에 답변하세요. 판매량, 평점, 리뷰 수 등을 고려하여 구체적으로 추천해주세요.)"""
    else:
        prompt = f"""당신은 쇼핑몰 AI 어시스턴트입니다. 아래 문서를 참고하여 질문에 답변하세요.

참고 문서:
{doc_context}

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


def rag_search_with_products(
    query: str,
    user_id: Optional[str] = None,
    search_limit: int = 3,
    use_ollama: bool = True
) -> Dict:
    """
    상품 추천이 통합된 RAG 검색 프로세스

    Args:
        query: 사용자 질문
        user_id: 사용자 ID (개인화 추천용)
        search_limit: 검색할 문서 수
        use_ollama: Ollama 사용 여부

    Returns:
        {
            "query": 질문,
            "documents": 검색된 문서들,
            "products": 추천 상품들,
            "answer": Ollama 답변 (문서 + 상품 정보 통합)
        }
    """
    # 1. 기존 문서 검색
    documents = search_documents(query, limit=search_limit)

    # 2. 벡터 기반 의도 분류
    intent, confidence = classify_intent(query)
    print(f"[Intent] {intent} (confidence: {confidence:.3f})")

    # 3. 키워드 추출 (keyword_search용)
    keywords = extract_keywords_from_query(query)

    # 4. 상품 검색 전략 결정 (의도 기반)
    products = []
    product_context = ""

    if intent == 'bestseller':
        # 베스트셀러 조회
        products = get_bestsellers(limit=10)
        product_context = f"베스트셀러 상품:\n{format_products_for_llm(products)}"

    elif intent == 'top_rated':
        # 고평점 상품 조회
        products = get_top_rated(limit=10)
        product_context = f"고평점 상품:\n{format_products_for_llm(products)}"

    elif intent == 'new_arrival':
        # 신상품 조회
        products = get_new_arrivals(limit=10)
        product_context = f"신상품:\n{format_products_for_llm(products)}"

    elif intent == 'personal' and user_id:
        # 사용자 구매 이력 기반 추천
        purchase_history = get_user_purchase_history(user_id, limit=5)

        if purchase_history:
            # 구매한 상품의 태그 수집
            all_tags = []
            for product in purchase_history:
                if product.get('tags'):
                    all_tags.extend(product['tags'])

            # 유사 상품 검색
            if all_tags:
                products = search_by_tags(all_tags, limit=10)
                product_context = f"고객님의 구매 이력:\n{format_products_for_llm(purchase_history)}\n\n비슷한 상품:\n{format_products_for_llm(products)}"
            else:
                products = purchase_history
                product_context = f"고객님의 구매 이력:\n{format_products_for_llm(purchase_history)}"
        else:
            product_context = "구매 이력이 없습니다."

    elif intent == 'keyword_search' or keywords:
        # 키워드로 상품 검색 (태그 + 상품명)
        products = search_by_keyword(query, limit=10)

        if not products and keywords:
            # 태그로 재검색
            products = search_by_tags(keywords, limit=10)

        if products:
            product_context = f"'{query}' 관련 상품:\n{format_products_for_llm(products)}"
        else:
            product_context = f"'{query}' 관련 상품을 찾을 수 없습니다."

    # 4. 결과 구성
    result = {
        "query": query,
        "documents": documents,
        "products": products,
    }

    # 5. Ollama로 답변 생성 (문서 + 상품 정보 통합)
    if use_ollama:
        if documents or product_context:
            answer = generate_answer_with_ollama(query, documents, product_context)
            result["answer"] = answer
        else:
            result["answer"] = "관련 정보를 찾을 수 없습니다."
    else:
        result["answer"] = None

    return result
