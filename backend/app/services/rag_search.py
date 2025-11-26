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
from app.services.personalized_recommendation import (
    get_personalized_recommendations,
    format_personalized_recommendations_for_llm
)
from app.config import get_settings
import json

settings = get_settings()

# 전역 임베딩 모델
_embedding_model: Optional[SentenceTransformer] = None

def get_embedding_model() -> SentenceTransformer:
    """임베딩 모델 싱글톤"""
    global _embedding_model
    if _embedding_model is None:
        model_name = settings.EMBEDDING_MODEL
        print(f"Loading embedding model: {model_name}...")
        _embedding_model = SentenceTransformer(model_name)
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


def generate_answer_with_ollama_streaming(
    query: str,
    context_docs: List[Dict],
    product_context: str = "",
    model: str = None,
    ollama_host: str = None
):
    """
    Ollama로 스트리밍 답변 생성 (상품 추천 포함)

    Yields:
        dict: {"token": str} 또는 {"done": bool}
    """
    # 설정값 사용
    if model is None:
        model = settings.OLLAMA_MODEL
    if ollama_host is None:
        ollama_host = settings.OLLAMA_HOST

    # 1. 문서 컨텍스트 생성
    doc_context = "\n\n".join([
        f"문서 {i+1}:\n{doc.get('content', '')}"
        for i, doc in enumerate(context_docs)
    ])

    # 2. 프롬프트 생성 (상품 정보 추가)
    if product_context:
        # 개인화 추천인지 확인 (구매 패턴 분석 포함 여부)
        is_personalized = "고객 구매 패턴 분석" in product_context

        if is_personalized:
            prompt = f"""당신은 쇼핑몰의 개인 맞춤 AI 쇼핑 어시스턴트입니다. 고객의 구매 이력을 분석하여 취향에 딱 맞는 상품을 추천하세요.

참고 문서:
{doc_context}

{product_context}

사용자 질문: {query}

지침:
1. 고객의 구매 패턴(선호 태그, 가격대, 구매 주기 등)을 근거로 추천하세요
2. "고객님께서 평소 XX를 선호하시는데, 이 상품은..." 같은 개인화된 멘트를 사용하세요
3. 재구매 상품이 있다면 "지난번 구매하신 XX와 비슷한..." 처럼 언급하세요
4. 추천 이유를 구체적으로 설명하세요 (고객 취향 일치, 매칭 점수 등)
5. 상품명을 정확히 언급하세요
6. 친근하고 신뢰감 있는 톤으로 작성하세요

답변:"""
        else:
            prompt = f"""당신은 쇼핑몰 AI 어시스턴트입니다. 사용자의 질문을 정확히 분석하고 아래 상품 목록에서 적합한 상품을 직접 선택하여 추천하세요.

참고 문서:
{doc_context}

상품 목록:
{product_context}

사용자 질문: {query}

지침:
1. 사용자가 요청한 조건을 정확히 파악하세요 (예: "리뷰 많은", "판매량 높은", "평점 좋은", "top 3", "상위 5개" 등)
2. 상품 목록에서 해당 조건에 맞는 상품을 직접 선택하세요
3. 사용자가 개수를 지정했다면 (예: "3개만", "top 5") 정확히 그 개수만 추천하세요
4. 리뷰가 없는 상품(review_count: 0)은 "리뷰 많은" 질문에서 제외하세요
5. 추천 이유를 간결하게 설명하세요 (판매량, 평점, 리뷰 등 근거 제시)
6. 상품명을 정확히 언급하세요

답변:"""
    else:
        prompt = f"""당신은 쇼핑몰 AI 어시스턴트입니다. 아래 문서를 참고하여 질문에 답변하세요.

참고 문서:
{doc_context}

사용자 질문: {query}

답변: (문서 내용을 바탕으로 간결하고 정확하게 답변하세요. 문서에 없는 내용은 "문서에서 찾을 수 없습니다"라고 답변하세요.)"""

    # 3. Ollama API 스트리밍 호출
    try:
        response = requests.post(
            f"{ollama_host}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": True
            },
            stream=True,
            timeout=settings.OLLAMA_TIMEOUT
        )

        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if chunk.get("response"):
                            yield {"token": chunk["response"]}
                        if chunk.get("done"):
                            yield {"done": True}
                            break
                    except json.JSONDecodeError:
                        continue
        else:
            yield {"error": f"Ollama 오류: {response.status_code}"}

    except Exception as e:
        print(f"Ollama streaming error: {e}")
        yield {"error": f"답변 생성 중 오류 발생: {str(e)}"}


def generate_answer_with_ollama(
    query: str,
    context_docs: List[Dict],
    product_context: str = "",
    model: str = None,
    ollama_host: str = None
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
    # 설정값 사용
    if model is None:
        model = settings.OLLAMA_MODEL
    if ollama_host is None:
        ollama_host = settings.OLLAMA_HOST

    # 1. 문서 컨텍스트 생성
    doc_context = "\n\n".join([
        f"문서 {i+1}:\n{doc.get('content', '')}"
        for i, doc in enumerate(context_docs)
    ])

    # 2. 프롬프트 생성 (상품 정보 추가)
    if product_context:
        prompt = f"""당신은 쇼핑몰 AI 어시스턴트입니다. 사용자의 질문을 정확히 분석하고 아래 상품 목록에서 적합한 상품을 직접 선택하여 추천하세요.

참고 문서:
{doc_context}

상품 목록:
{product_context}

사용자 질문: {query}

지침:
1. 사용자가 요청한 조건을 정확히 파악하세요 (예: "리뷰 많은", "판매량 높은", "평점 좋은", "top 3", "상위 5개" 등)
2. 상품 목록에서 해당 조건에 맞는 상품을 직접 선택하세요
3. 사용자가 개수를 지정했다면 (예: "3개만", "top 5") 정확히 그 개수만 추천하세요
4. 리뷰가 없는 상품(review_count: 0)은 "리뷰 많은" 질문에서 제외하세요
5. 추천 이유를 간결하게 설명하세요 (판매량, 평점, 리뷰 등 근거 제시)
6. 상품명을 정확히 언급하세요

답변:"""
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
            timeout=settings.OLLAMA_TIMEOUT
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

    # 2. 키워드 추출 (태그 필터링용)
    keywords = extract_keywords_from_query(query)
    print(f"[Keywords] {keywords}")

    # 3. 상품 데이터 가져오기 (필터링 없이 LLM이 판단하도록)
    products = []
    product_context = ""

    if keywords:
        # 키워드가 있으면 태그로 필터링 (넉넉하게 50개)
        products = search_by_tags(keywords, limit=50)

        if not products:
            product_context = f"'{', '.join(keywords)}' 관련 상품을 찾을 수 없습니다."
        else:
            # 정렬 없이 모든 상품 정보를 LLM에게 전달
            product_context = f"'{', '.join(keywords)}' 관련 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"

    elif user_id:
        # ⭐ 개인화 추천: 구매 패턴 분석 기반 맞춤 상품
        personalized = get_personalized_recommendations(user_id, limit=50)

        if personalized['recommendations']:
            products = personalized['recommendations']
            product_context = format_personalized_recommendations_for_llm(personalized)
        else:
            # fallback: 구매 이력 기반 유사 상품
            purchase_history = get_user_purchase_history(user_id, limit=5)

            if purchase_history:
                all_tags = []
                for product in purchase_history:
                    if product.get('tags'):
                        all_tags.extend(product['tags'])

                if all_tags:
                    products = search_by_tags(all_tags, limit=50)
                    product_context = f"고객님의 구매 이력:\n{format_products_for_llm(purchase_history, include_reviews=False)}\n\n비슷한 상품:\n{format_products_for_llm(products, include_reviews=True)}"
                else:
                    products = purchase_history
                    product_context = f"고객님의 구매 이력:\n{format_products_for_llm(purchase_history, include_reviews=False)}"
            else:
                # 전체 상품 (최근 등록 순으로 50개)
                products = get_new_arrivals(limit=50)
                product_context = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"

    else:
        # 키워드도 없고 로그인도 안 한 경우: 전체 상품 제공
        products = get_new_arrivals(limit=50)
        product_context = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"

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

            # 6. LLM이 언급한 상품만 필터링 (상품명 기준)
            if answer and products:
                mentioned_products = []
                for product in products:
                    # LLM 답변에 상품명이 포함되어 있으면 해당 상품 포함
                    if product['name'] in answer:
                        mentioned_products.append(product)
                        print(f"[Matched Product] {product['name']}")

                print(f"[Total Mentioned] {len(mentioned_products)} out of {len(products)}")

                # LLM이 언급한 상품이 있으면 해당 상품만, 없으면 상위 5개
                if mentioned_products:
                    result["products"] = mentioned_products[:10]  # 최대 10개
                    print(f"[Returning] {len(result['products'])} mentioned products")
                else:
                    result["products"] = products[:5]  # fallback: 상위 5개
                    print(f"[Returning] {len(result['products'])} fallback products (no mentions found)")
        else:
            result["answer"] = "관련 정보를 찾을 수 없습니다."
    else:
        result["answer"] = None

    return result
