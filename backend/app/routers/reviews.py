from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.services.auth_middleware import get_current_user
from app.services.supabase import get_supabase_admin_client
from app.config import get_settings
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests
import json
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviews", tags=["reviews"])
settings = get_settings()


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class CreateReviewRequest(BaseModel):
    """리뷰 생성 요청"""
    order_id: str
    product_id: str
    rating: int  # 1-5
    content: str


class UpdateReviewRequest(BaseModel):
    """리뷰 수정 요청"""
    rating: Optional[int] = None
    content: Optional[str] = None


# ============================================
# REVIEW ENDPOINTS
# ============================================

@router.post("", status_code=status.HTTP_201_CREATED, summary="리뷰 작성")
async def create_review(
    request: CreateReviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    상품 리뷰를 작성합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    # 별점 유효성 검사
    if request.rating < 1 or request.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="별점은 1~5 사이여야 합니다."
        )

    # 리뷰 내용 최소 길이 검사
    if len(request.content.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="리뷰 내용은 최소 10자 이상이어야 합니다."
        )

    try:
        # 주문 확인 (본인 주문인지, 배송완료 상태인지)
        order_response = (
            supabase.table("orders")
            .select("id, buyer_id, status")
            .eq("id", request.order_id)
            .single()
            .execute()
        )

        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="주문을 찾을 수 없습니다."
            )

        order = order_response.data

        if order["buyer_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 주문에 대해서만 리뷰를 작성할 수 있습니다."
            )

        if order["status"] != "delivered":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="배송완료된 주문에 대해서만 리뷰를 작성할 수 있습니다."
            )

        # 이미 리뷰를 작성했는지 확인
        existing_review = (
            supabase.table("reviews")
            .select("id")
            .eq("order_id", request.order_id)
            .eq("product_id", request.product_id)
            .eq("user_id", user_id)
            .execute()
        )

        if existing_review.data and len(existing_review.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 해당 상품에 대한 리뷰를 작성하셨습니다."
            )

        # 리뷰 생성
        review_data = {
            "user_id": user_id,
            "order_id": request.order_id,
            "product_id": request.product_id,
            "rating": request.rating,
            "content": request.content.strip(),
        }

        review_response = (
            supabase.table("reviews")
            .insert(review_data)
            .execute()
        )

        if not review_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="리뷰 저장에 실패했습니다."
            )

        # 상품의 review_count와 rating 업데이트
        # 해당 상품의 모든 리뷰 조회
        all_reviews = (
            supabase.table("reviews")
            .select("rating")
            .eq("product_id", request.product_id)
            .execute()
        )

        total_reviews = len(all_reviews.data)
        avg_rating = sum(r["rating"] for r in all_reviews.data) / total_reviews if total_reviews > 0 else 0

        # 상품 정보 업데이트
        supabase.table("products").update({
            "review_count": total_reviews,
            "rating": round(avg_rating, 1)
        }).eq("id", request.product_id).execute()

        return {
            "message": "리뷰가 등록되었습니다.",
            "review_id": review_response.data[0]["id"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"리뷰 작성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/my", summary="내 리뷰 목록 조회")
async def get_my_reviews(
    current_user: dict = Depends(get_current_user)
):
    """
    로그인한 사용자가 작성한 리뷰 목록을 조회합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        reviews_response = (
            supabase.table("reviews")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        reviews = reviews_response.data or []

        # 각 리뷰에 상품 정보 추가
        for review in reviews:
            product_response = (
                supabase.table("products")
                .select("name, thumbnail_url")
                .eq("id", review["product_id"])
                .single()
                .execute()
            )
            if product_response.data:
                review["product_name"] = product_response.data.get("name")
                review["product_image"] = product_response.data.get("thumbnail_url")

        return {
            "reviews": reviews,
            "count": len(reviews)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"리뷰 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/product/{product_id}", summary="상품 리뷰 목록 조회")
async def get_product_reviews(
    product_id: str
):
    """
    특정 상품의 리뷰 목록을 조회합니다.
    """
    supabase = get_supabase_admin_client()

    try:
        reviews_response = (
            supabase.table("reviews")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .execute()
        )

        reviews = reviews_response.data or []

        # 각 리뷰에 사용자 정보 추가
        for review in reviews:
            user_response = (
                supabase.table("profiles")
                .select("full_name")
                .eq("id", review["user_id"])
                .single()
                .execute()
            )
            if user_response.data:
                # 이름 마스킹 (예: 홍길동 -> 홍*동)
                name = user_response.data.get("full_name", "")
                if len(name) > 2:
                    review["user_name"] = name[0] + "*" * (len(name) - 2) + name[-1]
                elif len(name) == 2:
                    review["user_name"] = name[0] + "*"
                else:
                    review["user_name"] = name

        # 평균 별점 계산
        avg_rating = 0
        if reviews:
            avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1)

        return {
            "reviews": reviews,
            "count": len(reviews),
            "avg_rating": avg_rating
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"리뷰 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/{review_id}", summary="리뷰 삭제")
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    리뷰를 삭제합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        # 리뷰 조회
        review_response = (
            supabase.table("reviews")
            .select("id, user_id")
            .eq("id", review_id)
            .single()
            .execute()
        )

        if not review_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="리뷰를 찾을 수 없습니다."
            )

        if review_response.data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 리뷰만 삭제할 수 있습니다."
            )

        # 리뷰 삭제
        supabase.table("reviews").delete().eq("id", review_id).execute()

        return {"message": "리뷰가 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"리뷰 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/check", summary="리뷰 작성 여부 확인")
async def check_review_written(
    order_id: str,
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    특정 주문의 상품에 대해 리뷰를 작성했는지 확인합니다.
    """
    supabase = get_supabase_admin_client()
    user_id = current_user["id"]

    try:
        review_response = (
            supabase.table("reviews")
            .select("id")
            .eq("order_id", order_id)
            .eq("product_id", product_id)
            .eq("user_id", user_id)
            .execute()
        )

        has_review = len(review_response.data or []) > 0

        return {"has_review": has_review}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"리뷰 확인 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/summary/{product_id}", summary="AI 리뷰 요약 생성")
async def generate_review_summary(product_id: str):
    """
    상품 리뷰를 AI로 요약합니다. (스트리밍)
    """
    supabase = get_supabase_admin_client()

    try:
        # 상품 리뷰 조회
        reviews_response = (
            supabase.table("reviews")
            .select("rating, content, created_at")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .execute()
        )

        reviews = reviews_response.data or []

        if not reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="리뷰가 없습니다."
            )

        # 리뷰 데이터를 LLM용 텍스트로 포맷팅
        review_text = f"총 {len(reviews)}개의 리뷰\n\n"

        # 평점별 분포
        rating_counts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for r in reviews:
            rating_counts[r['rating']] += 1

        review_text += "평점 분포:\n"
        for rating in [5, 4, 3, 2, 1]:
            if rating_counts[rating] > 0:
                review_text += f"- {rating}점: {rating_counts[rating]}개\n"

        review_text += "\n리뷰 내용:\n"

        # 최근 리뷰 최대 30개만 요약 (토큰 제한 고려)
        for i, review in enumerate(reviews[:30], 1):
            review_text += f"{i}. [{review['rating']}점] {review['content']}\n"

        # AI 프롬프트
        prompt = f"""당신은 쇼핑몰 리뷰 분석 전문가입니다. 다음 리뷰들을 분석하여 핵심 내용을 요약해주세요.

{review_text}

다음 형식으로 요약해주세요:

📊 전체 평가
- 평균 평점과 전반적인 만족도

👍 주요 장점
- 고객들이 가장 만족한 점 (3가지)

👎 단점 및 개선점
- 고객들이 아쉬워한 점 (있다면)

💡 구매 시 참고사항
- 사이즈, 품질, 배송 등 구매 전 알아두면 좋은 정보

간결하고 명확하게 작성해주세요."""

        # 스트리밍 응답 생성
        def generate():
            try:
                response = requests.post(
                    f"{settings.OLLAMA_HOST}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": True
                    },
                    stream=True,
                    timeout=settings.OLLAMA_TIMEOUT
                )

                for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            if "response" in chunk:
                                yield f"data: {json.dumps({'token': chunk['response']})}\n\n"
                            if chunk.get("done", False):
                                yield f"data: {json.dumps({'done': True})}\n\n"
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                logger.info(f"AI 요약 생성 오류: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 요약 생성 중 오류가 발생했습니다: {str(e)}"
        )
