from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth_middleware import get_current_user
from app.services.wishlist import WishlistService
from app.models.wishlist import (
    WishlistItemResponse,
    WishlistCheckResponse,
    AddToWishlistResponse,
    RemoveFromWishlistResponse
)
from typing import List

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


# ============================================
# WISHLIST ENDPOINTS
# ============================================

@router.get("", response_model=List[WishlistItemResponse], summary="찜 목록 조회")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    """
    로그인한 사용자의 찜 목록을 조회합니다.
    """
    user_id = current_user["id"]

    try:
        items = WishlistService.get_user_wishlist(user_id)
        return items

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"찜 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/check/{product_id}", response_model=WishlistCheckResponse, summary="찜 상태 확인")
async def check_wishlist_status(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    특정 상품이 찜 목록에 있는지 확인합니다.
    """
    user_id = current_user["id"]

    try:
        status_info = WishlistService.check_wishlist_status(user_id, product_id)
        return status_info

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"찜 상태 확인 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/{product_id}", status_code=status.HTTP_201_CREATED, response_model=AddToWishlistResponse, summary="찜 추가")
async def add_to_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    상품을 찜 목록에 추가합니다.
    """
    user_id = current_user["id"]

    try:
        # 상품 존재 여부 확인
        product = WishlistService.get_product_info(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="상품을 찾을 수 없습니다."
            )

        # 이미 찜한 상품인지 확인
        status_info = WishlistService.check_wishlist_status(user_id, product_id)
        if status_info["is_wishlisted"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 찜한 상품입니다."
            )

        # 찜 목록에 추가
        wishlist_item = WishlistService.add_to_wishlist(user_id, product_id)

        return {
            "message": "찜 목록에 추가되었습니다.",
            "wishlist_item_id": wishlist_item["id"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"찜 추가 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/{product_id}", response_model=RemoveFromWishlistResponse, summary="찜 삭제")
async def remove_from_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    찜 목록에서 상품을 삭제합니다.
    """
    user_id = current_user["id"]

    try:
        # 찜 목록에 있는지 확인
        status_info = WishlistService.check_wishlist_status(user_id, product_id)
        if not status_info["is_wishlisted"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="찜 목록에서 해당 상품을 찾을 수 없습니다."
            )

        # 삭제
        WishlistService.remove_from_wishlist(user_id, product_id)

        return {
            "message": "찜 목록에서 삭제되었습니다."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"찜 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("", response_model=RemoveFromWishlistResponse, summary="찜 목록 전체 비우기")
async def clear_wishlist(current_user: dict = Depends(get_current_user)):
    """
    찜 목록을 전체 비웁니다.
    """
    user_id = current_user["id"]

    try:
        WishlistService.clear_wishlist(user_id)
        return {
            "message": "찜 목록이 비워졌습니다."
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"찜 목록 비우기 중 오류가 발생했습니다: {str(e)}"
        )
