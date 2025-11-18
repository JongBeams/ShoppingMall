from fastapi import APIRouter, Header, status, UploadFile, File

from app.models.product import CreateProductRequset
from app.services.product_management import CreateProduct, DeleteProduct, UploadProductImage, get_profile_from_token, GetVendorProducts

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


# 상품 등록/수정
@router.post("/management/{product_id}", status_code=status.HTTP_201_CREATED, summary="상품 등록/수정")
async def create_or_update_product(
    product_id: str,
    product_data: CreateProductRequset,
    authorization: str = Header(None)
):
    """
    상품을 등록하거나 수정합니다 (판매자 전용)

    - **product_id**: -1이면 신규 등록, 그 외에는 해당 ID의 상품 수정
    - **name**: 상품명 (필수)
    - **description**: 상품 설명 (필수, 최소 20자)
    - **price**: 가격 (필수, 0보다 큼)
    - **category**: 카테고리 slug (필수)
    - **stock_quantity**: 재고 수량 (기본값: 0)
    - **low_stock_threshold**: 재고 부족 알림 기준 (기본값: 10)
    - **image**: 상품 이미지 URL (선택)
    """

    current_user, access_token = get_profile_from_token(authorization)

    # product_id를 product_data에 설정
    product_data.id = product_id

    # CreateProduct 서비스 클래스 사용
    service = CreateProduct(product_data, current_user, access_token)
    product = service.execute()

    is_new = product_id == "-1"
    message = "상품이 등록되었습니다" if is_new else "상품이 수정되었습니다"

    return {"message": message, "product": product}


# 이미지 업로드
@router.post("/product-image/{product_id}", summary="상품 이미지 업로드")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """
    상품 이미지를 Supabase Storage에 업로드합니다 (판매자 전용)

    - **product_id**: 상품 ID (temp는 임시 ID로 신규 상품용)
    - **file**: 업로드할 이미지 파일 (필수)

    Returns:
        - **image_url**: 업로드된 이미지의 Public URL
        - **storage_path**: Storage 내부 경로
    """

    current_user, _ = get_profile_from_token(authorization)

    # UploadProductImage 서비스 클래스 사용 (Service Role 키 사용)
    service = UploadProductImage(file, current_user)
    result = await service.execute()

    return result


# 상품 삭제
@router.delete("/management/{product_id}", summary="상품 삭제")
async def delete_product(
    product_id: str, authorization: str = Header(None)
):
    """
    상품을 삭제합니다 (판매자 전용, 본인 상품만 삭제 가능)

    - **product_id**: 삭제할 상품의 ID (필수)
    """

    current_user, access_token = get_profile_from_token(authorization)

    # DeleteProduct 서비스 클래스 사용
    service = DeleteProduct(product_id, current_user, access_token)
    result = service.execute()

    return result
