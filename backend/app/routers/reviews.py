from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_middleware import get_current_user
from app.services.supabase import get_supabase_admin_client
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/reviews", tags=["reviews"])


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
