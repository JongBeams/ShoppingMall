from fastapi import APIRouter, Header, status

from app.models.product import CreateProductRequset
from app.services.product_management import CreateProduct, get_profile_from_token, GetVendorProducts

router = APIRouter(prefix="/products", tags=["products"])


# ============================================
# 공개 API (인증 불필요)
# ============================================

#상품 조회

#판매자 상품 조회
@router.get("/management", summary="내 상품 목록 조회")
async def get_management_products():
    """
    로그인한 판매자의 상품 목록을 조회합니다
    """
    # GetVendorProducts 서비스 함수 사용
    products = GetVendorProducts()

    return {
        "message": "내 상품 목록 조회",
        "products": products
    }

# ============================================
# 판매자 전용 API (인증 필요)
# ============================================


# 상품 등록
@router.post("/management/-1", status_code=status.HTTP_201_CREATED, summary="상품 등록")
async def create_product(
    product_data: CreateProductRequset, authorization: str = Header(None)
):
    """
    새 상품을 등록합니다 (판매자 전용)

    - **name**: 상품명 (필수)
    - **description**: 상품 설명 (필수, 최소 20자)
    - **price**: 가격 (필수, 0보다 큼)
    - **category**: 카테고리 slug (필수)
    - **stock_quantity**: 재고 수량 (기본값: 0)
    - **low_stock_threshold**: 재고 부족 알림 기준 (기본값: 10)
    - **image_url**: 상품 이미지 URL (선택)
    """

    current_user, access_token = get_profile_from_token(authorization)

    # CreateProduct 서비스 클래스 사용
    service = CreateProduct(product_data, current_user, access_token)
    product = service.execute()

    return {"message": "상품이 등록되었습니다", "product": product}

    # 상품 수정

    # 상품 삭제
