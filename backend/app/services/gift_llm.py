"""
선물 추천 LLM 프롬프트 생성 서비스
"""
import requests
import json
from typing import List, Dict, AsyncGenerator
from app.config import get_settings

settings = get_settings()


class GiftLLMService:
    """선물 추천 LLM 서비스"""

    @staticmethod
    def generate_recommendation_prompt(
        answers: Dict,
        products: List[Dict],
        purchase_history: List[Dict] = None
    ) -> str:
        """
        선물 추천 프롬프트 생성

        Args:
            answers: 사용자 답변
            products: 후보 상품 리스트
            purchase_history: 과거 선물 이력 (선택)

        Returns:
            LLM 프롬프트
        """

        # 제품 정보 포맷팅
        product_list = []
        for idx, p in enumerate(products, 1):
            name = p.get('name', '')
            price = int(p.get('price', 0))
            rating = float(p.get('rating', 0))
            review_count = p.get('review_count', 0)
            desc = p.get('description', '')[:100] if p.get('description') else ''
            tags = ', '.join(p.get('tags', []))

            product_list.append(
                f"{idx}. {name} - {price:,}원 (평점 {rating:.1f}, 리뷰 {review_count}개)\n"
                f"   {desc}\n"
                f"   태그: {tags}"
            )

        products_text = '\n\n'.join(product_list)

        # 과거 이력 텍스트
        history_text = ""
        if purchase_history:
            history_items = [
                f"- {h['occasion']} 선물: {h['product_name']} ({int(h['price']):,}원)"
                for h in purchase_history[:5]
            ]
            history_text = f"\n\n[과거 선물 이력]\n" + '\n'.join(history_items)

        prompt = f"""당신은 20년 경력의 선물 전문가입니다.
다음 정보를 바탕으로 완벽한 선물 3개를 추천하고, 각각에 대한 상세한 추천 이유와 선물 메시지를 작성해주세요.

[받는 사람 정보]
- 관계: {answers.get('relationship', '알 수 없음')}
- 성별: {answers.get('gender', '알 수 없음')}
- 나이: {answers.get('age_range', '알 수 없음')}
- 스타일: {answers.get('style', '알 수 없음')}
- 관심사: {', '.join(answers.get('interests', [])) if answers.get('interests') else '없음'}

[상황]
- 목적: {answers.get('occasion', '알 수 없음')}
- 예산: {answers.get('budget_min', 0):,}원 ~ {answers.get('budget_max', 0):,}원
- 특별 요청: {answers.get('special_request', '없음')}
{history_text}

[상품 후보 목록]
{products_text}

---

위 상품 목록에서 **정확히 3개**를 선택하여 다음 JSON 형식으로 답변해주세요.
반드시 JSON만 출력하고, 다른 텍스트는 포함하지 마세요.

{{
  "recommendations": [
    {{
      "rank": 1,
      "product_number": 1,
      "product_name": "상품명",
      "reasons": [
        "받는 사람의 {answers.get('style', '')} 스타일에 완벽하게 맞는 디자인입니다.",
        "{answers.get('occasion', '')}에 어울리는 의미 있는 선택입니다.",
        "가격 대비 품질이 우수하고, 평점 4.5 이상의 검증된 상품입니다."
      ],
      "caution": "사이즈 확인이 필요합니다. (있다면)",
      "gift_messages": [
        "{{감성적}} 2-3문장의 진심 어린 메시지",
        "{{위트있는}} 재치있고 유머러스한 메시지",
        "{{진지한}} 따뜻하고 진지한 메시지"
      ]
    }},
    {{
      "rank": 2,
      "product_number": 2,
      "product_name": "상품명",
      "reasons": [...],
      "caution": "...",
      "gift_messages": [...]
    }},
    {{
      "rank": 3,
      "product_number": 3,
      "product_name": "상품명",
      "reasons": [...],
      "caution": "...",
      "gift_messages": [...]
    }}
  ],
  "packaging_tips": "포장 관련 조언 (색상, 스타일 등)",
  "delivery_tips": "전달 방법 조언",
  "overall_advice": "{answers.get('relationship', '')}에게 선물할 때 전반적인 조언"
}}

중요:
1. 받는 사람의 성격, 스타일, 관심사를 반드시 언급하세요
2. {answers.get('occasion', '')}이라는 상황에 맞는 의미를 부여하세요
3. 선물 메시지는 각각 2-3문장, 이모지 1-2개 포함
4. 반드시 위 형식의 JSON만 출력하세요
"""

        return prompt


    @staticmethod
    def generate_message_prompt(
        product_name: str,
        relationship: str,
        occasion: str,
        tone: str = "감성적"
    ) -> str:
        """
        선물 메시지 생성 프롬프트

        Args:
            product_name: 상품명
            relationship: 관계
            occasion: 목적
            tone: 톤 (감성적, 위트있는, 진지한)

        Returns:
            프롬프트
        """

        prompt = f"""'{relationship}'에게 '{occasion}' 선물로 '{product_name}'을(를) 줍니다.
'{tone}' 톤으로 진심이 담긴 선물 메시지를 3가지 버전으로 작성해주세요.

각 메시지는 2-3문장, 이모지 1-2개 포함.

다음 JSON 형식으로만 출력하세요:

{{
  "messages": [
    "메시지 1",
    "메시지 2",
    "메시지 3"
  ]
}}
"""
        return prompt


    @staticmethod
    async def call_ollama_stream(prompt: str, model: str = "qwen2.5:14b") -> AsyncGenerator[str, None]:
        """
        Ollama API 스트리밍 호출

        Args:
            prompt: LLM 프롬프트
            model: 모델명

        Yields:
            스트리밍 응답 청크
        """
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
            }
        }

        try:
            response = requests.post(url, json=payload, stream=True, timeout=120)
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if 'response' in chunk:
                            yield chunk['response']
                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            print(f"Ollama 호출 오류: {e}")
            yield f"오류가 발생했습니다: {str(e)}"


    @staticmethod
    async def call_ollama(prompt: str, model: str = "qwen2.5:14b") -> str:
        """
        Ollama API 일반 호출 (비스트리밍)

        Args:
            prompt: LLM 프롬프트
            model: 모델명

        Returns:
            LLM 응답
        """
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
            }
        }

        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            return result.get('response', '')

        except Exception as e:
            print(f"Ollama 호출 오류: {e}")
            return f"오류가 발생했습니다: {str(e)}"


    @staticmethod
    def parse_recommendation_response(llm_response: str) -> Dict:
        """
        LLM 응답 파싱 (JSON 추출)

        Args:
            llm_response: LLM 응답 텍스트

        Returns:
            파싱된 딕셔너리
        """
        try:
            # JSON 부분만 추출 (```json ``` 제거)
            response = llm_response.strip()

            # 코드 블록 제거
            if response.startswith('```'):
                lines = response.split('\n')
                response = '\n'.join(lines[1:-1])  # 첫 줄(```json)과 마지막 줄(```) 제거

            # JSON 파싱
            data = json.loads(response)
            return data

        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            print(f"응답: {llm_response[:500]}")
            return None
