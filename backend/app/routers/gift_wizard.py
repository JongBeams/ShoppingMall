from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
import json

from app.models.gift_wizard import (
    GiftWizardAnswers,
    GiftMessageRequest,
    GiftHistoryResponse,
    AnniversaryResponse
)
from app.services.gift_filtering import GiftFilteringService
from app.services.gift_llm import GiftLLMService
from app.services.supabase import supabase
from app.routers.auth import get_current_user

router = APIRouter(prefix="/gift-wizard", tags=["gift-wizard"])


@router.post("/recommendations")
async def get_gift_recommendations(
    answers: GiftWizardAnswers,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    선물 추천 받기 (스트리밍)

    사용자의 답변을 바탕으로 AI가 선물 3개를 추천합니다.
    """
    try:
        # 1. 상품 필터링 (50개)
        products = await GiftFilteringService.filter_products(
            relationship=answers.relationship,
            interests=answers.interests,
            budget_min=answers.budget_min,
            budget_max=answers.budget_max,
            style=answers.style,
            age_range=answers.age_range,
            limit=50
        )

        if not products:
            raise HTTPException(
                status_code=404,
                detail="조건에 맞는 상품을 찾을 수 없습니다. 예산이나 스타일을 조정해보세요."
            )

        # 2. 과거 선물 이력 조회 (로그인한 경우)
        purchase_history = []
        if current_user:
            purchase_history = await GiftFilteringService.get_user_purchase_history(
                user_id=current_user['id'],
                limit=5
            )

        # 3. LLM 프롬프트 생성
        prompt = GiftLLMService.generate_recommendation_prompt(
            answers=answers.dict(),
            products=products,
            purchase_history=purchase_history
        )

        # 4. 추천 로그 저장 (분석용)
        try:
            supabase.table('gift_recommendation_logs').insert({
                'user_id': current_user['id'] if current_user else None,
                'relationship': answers.relationship,
                'age_range': answers.age_range,
                'style': answers.style,
                'interests': answers.interests,
                'occasion': answers.occasion,
                'budget_min': answers.budget_min,
                'budget_max': answers.budget_max,
                'special_request': answers.special_request,
                'recommended_products': [],  # LLM 응답 후 업데이트 예정
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"로그 저장 실패: {e}")

        # 5. LLM 스트리밍 응답
        async def stream_response():
            full_response = ""
            async for chunk in GiftLLMService.call_ollama_stream(prompt):
                full_response += chunk
                yield chunk

            # 스트리밍 완료 후, 제품 ID 매핑 및 반환
            # (클라이언트에서 JSON 파싱)

        return StreamingResponse(
            stream_response(),
            media_type="text/plain"
        )

    except Exception as e:
        print(f"선물 추천 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations-json")
async def get_gift_recommendations_json(
    answers: GiftWizardAnswers
):
    """
    선물 추천 받기 (JSON, 비스트리밍)

    더 안정적인 JSON 응답을 원할 경우 사용
    """
    try:
        # 1. 상품 필터링
        products = await GiftFilteringService.filter_products(
            relationship=answers.relationship,
            interests=answers.interests,
            budget_min=answers.budget_min,
            budget_max=answers.budget_max,
            style=answers.style,
            age_range=answers.age_range,
            limit=50
        )

        if not products:
            raise HTTPException(
                status_code=404,
                detail="조건에 맞는 상품을 찾을 수 없습니다."
            )

        # 2. 과거 이력 (로그인하지 않은 경우 빈 리스트)
        purchase_history = []

        # 3. LLM 호출
        prompt = GiftLLMService.generate_recommendation_prompt(
            answers=answers.dict(),
            products=products,
            purchase_history=purchase_history
        )

        llm_response = await GiftLLMService.call_ollama(prompt)

        # 4. JSON 파싱
        parsed_data = GiftLLMService.parse_recommendation_response(llm_response)

        if not parsed_data:
            raise HTTPException(
                status_code=500,
                detail="AI 응답 파싱에 실패했습니다."
            )

        # 5. 제품 정보 매핑 (실제 상품명 덮어쓰기)
        recommendations = parsed_data.get('recommendations', [])
        for rec in recommendations:
            product_num = rec.get('product_number', 1) - 1
            if 0 <= product_num < len(products):
                product = products[product_num]
                rec['product_id'] = str(product['id'])
                rec['product_name'] = product.get('name')  # 실제 상품명 덮어쓰기
                rec['product_price'] = float(product['price'])
                rec['product_image'] = product.get('thumbnail_url')
                rec['product_rating'] = float(product.get('rating', 0))
                rec['product_review_count'] = product.get('review_count', 0)

        return {
            "recommendations": recommendations,
            "packaging_tips": parsed_data.get('packaging_tips', ''),
            "delivery_tips": parsed_data.get('delivery_tips', ''),
            "overall_advice": parsed_data.get('overall_advice', '')
        }

    except Exception as e:
        import traceback
        error_detail = f"추천 오류: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/messages")
async def generate_gift_message(request: GiftMessageRequest):
    """
    선물 메시지 생성

    선택한 상품에 대한 선물 메시지를 3가지 톤으로 생성합니다.
    """
    try:
        prompt = GiftLLMService.generate_message_prompt(
            product_name=request.product_name,
            relationship=request.relationship,
            occasion=request.occasion,
            tone=request.tone
        )

        llm_response = await GiftLLMService.call_ollama(prompt)

        # JSON 파싱
        try:
            data = json.loads(llm_response.strip())
            return data
        except json.JSONDecodeError:
            # 파싱 실패 시 기본 메시지 반환
            return {
                "messages": [
                    f"{request.relationship}에게 드리는 특별한 선물입니다. 마음에 드셨으면 좋겠어요! ❤️",
                    f"고민 끝에 고른 선물이에요. {request.occasion} 축하해요! 🎉",
                    f"이 선물이 {request.relationship}의 마음에 닿기를 바랍니다."
                ]
            }

    except Exception as e:
        print(f"메시지 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/history")
async def save_gift_history(
    product_id: str,
    product_name: str,
    product_image: Optional[str],
    price: float,
    relationship: str,
    occasion: str,
    current_user: dict = Depends(get_current_user)
):
    """
    선물 히스토리 저장

    구매한 선물 정보를 저장합니다.
    """
    try:
        result = supabase.table('gift_history').insert({
            'user_id': current_user['id'],
            'recipient_relationship': relationship,
            'occasion': occasion,
            'product_id': product_id,
            'product_name': product_name,
            'product_image': product_image,
            'price': price,
            'given_date': datetime.utcnow().isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }).execute()

        return {"message": "선물 히스토리가 저장되었습니다.", "id": result.data[0]['id']}

    except Exception as e:
        print(f"히스토리 저장 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_gift_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 20
):
    """
    선물 히스토리 조회

    사용자의 과거 선물 기록을 조회합니다.
    """
    try:
        result = supabase.table('gift_history').select('*').eq(
            'user_id', current_user['id']
        ).order('given_date', desc=True).limit(limit).execute()

        return {"history": result.data}

    except Exception as e:
        print(f"히스토리 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/anniversaries")
async def create_anniversary(
    name: str,
    date: str,
    auto_remind: bool = True,
    remind_days_before: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """
    기념일 등록

    중요한 기념일을 등록하고 자동 알림을 설정합니다.
    """
    try:
        result = supabase.table('anniversaries').insert({
            'user_id': current_user['id'],
            'name': name,
            'date': date,
            'auto_remind': auto_remind,
            'remind_days_before': remind_days_before,
            'created_at': datetime.utcnow().isoformat()
        }).execute()

        return {"message": "기념일이 등록되었습니다.", "id": result.data[0]['id']}

    except Exception as e:
        print(f"기념일 등록 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anniversaries")
async def get_anniversaries(
    current_user: dict = Depends(get_current_user)
):
    """
    기념일 목록 조회
    """
    try:
        result = supabase.table('anniversaries').select('*').eq(
            'user_id', current_user['id']
        ).order('date').execute()

        return {"anniversaries": result.data}

    except Exception as e:
        print(f"기념일 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
