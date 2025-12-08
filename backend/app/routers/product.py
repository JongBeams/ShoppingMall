from fastapi import APIRouter, status, UploadFile, File, HTTPException, Depends
import asyncio
import logging


logger = logging.getLogger(__name__)

from app.models.product import CreateProductRequset
from app.services.product_management import CreateProduct, DeleteProduct, UploadProductImage, GetVendorProducts, get_product_options
from app.services.supabase import get_supabase_client, get_supabase_admin_client
from app.services.auth_middleware import get_current_user
from app.services.image_embedding import get_image_embedding_service

router = APIRouter(prefix="/products", tags=["products"])


# ============================================
# 공개 API (인증 불필요)
# ============================================

@router.get("/search", summary="상품 검색")
async def search_products(q: str = ""):
    """
    상품을 검색합니다 (이름, 설명, 해시태그로 검색)
    """
    if not q or len(q.strip()) < 2:
        return {"products": [], "count": 0}

    supabase = get_supabase_client()
    search_term = q.strip()

    try:
        # 상품명, 설명으로 검색
        products_response = (
            supabase.table("products")
            .select("id, name, description, price, stock_quantity, category_id, vendor_id, thumbnail_url, tags, created_at")
            .eq("is_active", True)
            .or_(f"name.ilike.%{search_term}%,description.ilike.%{search_term}%")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )

        products = products_response.data or []

        # 해시태그로도 검색
        if products:
            # 이미 찾은 상품 ID들
            found_ids = {p["id"] for p in products}
        else:
            found_ids = set()

        # tags 배열에 검색어가 포함된 상품 검색 (DB 쿼리 최적화)
        try:
            # PostgreSQL의 @> 연산자 사용 (배열 포함 검색)
            # 또는 cs (contains) 연산자 사용
            tag_response = (
                supabase.table("products")
                .select("id, name, description, price, stock_quantity, category_id, vendor_id, thumbnail_url, tags, created_at")
                .eq("is_active", True)
                .contains("tags", [search_term])  # 태그 배열에 검색어가 포함된 경우
                .execute()
            )

            for product in tag_response.data or []:
                if product["id"] not in found_ids:
                    products.append(product)
                    found_ids.add(product["id"])
        except Exception as e:
            # contains 검색 실패 시 기존 방식으로 fallback
            logger.warning(f"태그 검색 최적화 실패, fallback 사용: {str(e)}")
            try:
                tag_response = (
                    supabase.table("products")
                    .select("id, name, description, price, stock_quantity, category_id, vendor_id, thumbnail_url, tags, created_at")
                    .eq("is_active", True)
                    .execute()
                )

                for product in tag_response.data or []:
                    if product["id"] not in found_ids and product.get("tags"):
                        # 태그 배열에서 검색어 찾기
                        for tag in product["tags"]:
                            if search_term.lower() in tag.lower():
                                products.append(product)
                                found_ids.add(product["id"])
                                break
            except Exception:
                pass

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"상품 검색 중 오류가 발생했습니다: {str(e)}"
        )

    category_ids = {product["category_id"] for product in products if product.get("category_id")}
    vendor_ids = {product["vendor_id"] for product in products if product.get("vendor_id")}
    category_map = {}
    vendor_map = {}

    if category_ids:
        try:
            categories_response = (
                supabase.table("categories")
                .select("id, slug, name")
                .in_("id", list(category_ids))
                .execute()
            )
            for category in categories_response.data or []:
                category_map[category["id"]] = {
                    "slug": category.get("slug"),
                    "name": category.get("name"),
                }
        except Exception:
            category_map = {}

    if vendor_ids:
        try:
            from app.services.supabase import get_supabase_admin_client
            supabase_admin = get_supabase_admin_client()
            vendors_response = (
                supabase_admin.table("vendors")
                .select("id, store_name")
                .in_("id", list(vendor_ids))
                .execute()
            )
            for vendor in vendors_response.data or []:
                vendor_map[vendor["id"]] = vendor.get("store_name")
        except Exception as e:
            logger.info(f"Error fetching vendors: {str(e)}")
            vendor_map = {}

    product_list = []
    for product in products:
        category_info = category_map.get(product.get("category_id"), {})
        vendor_name = vendor_map.get(product.get("vendor_id"))
        product_list.append({
            "id": product["id"],
            "name": product["name"],
            "description": product.get("description"),
            "price": product["price"],
            "stock_quantity": product.get("stock_quantity", 0),
            "thumbnail_url": product.get("thumbnail_url"),
            "category_slug": category_info.get("slug"),
            "category_name": category_info.get("name"),
            "vendor_name": vendor_name,
            "tags": product.get("tags", []),
            "created_at": product.get("created_at"),
        })

    return {"products": product_list, "count": len(product_list)}


@router.get("/categories", summary="카테고리 목록 조회")
async def get_categories():
    """
    전체 카테고리 목록을 조회합니다 (공개 API)
    """
    supabase = get_supabase_client()

    try:
        categories_response = (
            supabase.table("categories")
            .select("id, slug, name")
            .order("name")
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"카테고리 목록을 조회하는 중 오류가 발생했습니다: {str(e)}"
        )

    categories = categories_response.data or []

    return {"categories": categories}


@router.get("/", summary="전체 상품 목록 조회")
async def get_all_products():
    """
    활성화된 전체 상품 목록을 조회합니다 (공개 API)
    """
    supabase = get_supabase_client()

    try:
        products_response = (
            supabase.table("products")
            .select("id, name, description, price, stock_quantity, category_id, vendor_id, thumbnail_url, is_active, created_at, discount_price, discount_start, discount_end")
            .eq("is_active", True)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"상품 목록을 조회하는 중 오류가 발생했습니다: {str(e)}"
        )

    products = products_response.data or []
    category_ids = {product["category_id"] for product in products if product.get("category_id")}
    vendor_ids = {product["vendor_id"] for product in products if product.get("vendor_id")}
    category_map = {}
    vendor_map = {}

    if category_ids:
        try:
            categories_response = (
                supabase.table("categories")
                .select("id, slug, name")
                .in_("id", list(category_ids))
                .execute()
            )
            for category in categories_response.data or []:
                category_map[category["id"]] = {
                    "slug": category.get("slug"),
                    "name": category.get("name"),
                }
        except Exception:
            category_map = {}

    if vendor_ids:
        try:
            from app.services.supabase import get_supabase_admin_client
            supabase_admin = get_supabase_admin_client()
            vendors_response = (
                supabase_admin.table("vendors")
                .select("id, store_name")
                .in_("id", list(vendor_ids))
                .execute()
            )
            for vendor in vendors_response.data or []:
                vendor_map[vendor["id"]] = vendor.get("store_name")
        except Exception as e:
            logger.info(f"Error fetching vendors: {str(e)}")
            vendor_map = {}

    product_list = []
    for product in products:
        category_info = category_map.get(product.get("category_id"), {})
        vendor_name = vendor_map.get(product.get("vendor_id"))
        product_list.append({
            "id": product["id"],
            "name": product["name"],
            "description": product.get("description"),
            "price": product["price"],
            "stock_quantity": product.get("stock_quantity", 0),
            "thumbnail_url": product.get("thumbnail_url"),
            "category_slug": category_info.get("slug"),
            "category_name": category_info.get("name"),
            "vendor_name": vendor_name,
            "created_at": product.get("created_at"),
            "discount_price": product.get("discount_price"),
            "discount_start": product.get("discount_start"),
            "discount_end": product.get("discount_end"),
        })

    return {"products": product_list}

#판매자 상품 조회
@router.get("/management", summary="내 상품 목록 조회")
async def get_management_products(current_user: dict = Depends(get_current_user)):
    """
    로그인한 판매자의 상품 목록을 조회합니다 (JWT 인증 필요)
    """
    # GetVendorProducts 서비스 함수 사용
    products = GetVendorProducts(current_user)

    return {
        "message": "내 상품 목록 조회",
        "products": products
    }


# 상품 상세 조회
@router.get("/{product_id}", summary="특정 상품 조회")
async def get_product(product_id: str):
    """
    활성화된 특정 상품을 조회합니다 (공개 API)
    """
    supabase = get_supabase_client()

    try:
        product_response = (
            supabase.table("products")
            .select(
                "id, name, description, price, stock_quantity, low_stock_threshold, category_id, vendor_id, "
                "thumbnail_url, images, meta_title, meta_description, is_active, created_at, updated_at, "
                "discount_price, discount_start, discount_end"
            )
            .eq("id", product_id)
            .eq("is_active", True)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"상품을 조회하는 중 오류가 발생했습니다: {str(e)}"
        )

    product = product_response.data

    if not product:
        raise HTTPException(
            status_code=404,
            detail="상품을 찾을 수 없습니다."
        )

    category_info = {"slug": None, "name": None}
    category_id = product.get("category_id")
    if category_id:
        try:
            category_response = (
                supabase.table("categories")
                .select("slug, name")
                .eq("id", category_id)
                .single()
                .execute()
            )
            if category_response.data:
                category_info["slug"] = category_response.data.get("slug")
                category_info["name"] = category_response.data.get("name")
        except Exception:
            category_info = {"slug": None, "name": None}

    # vendor 정보 조회 (RLS 우회를 위해 admin client 사용)
    supabase_admin = get_supabase_admin_client()
    vendor_name = None
    vendor_address = None
    store_logo_url = None
    vendor_email = None
    vendor_id = product.get("vendor_id")
    logger.info(f"Product vendor_id: {vendor_id}")
    if vendor_id:
        try:
            # vendor_id로 user_id를 먼저 찾거나, 직접 조회
            # 먼저 id로 시도
            vendor_response = (
                supabase_admin.table("vendors")
                .select("store_name, business_address, store_logo_url, email")
                .eq("id", vendor_id)
                .execute()
            )
            logger.info(f"Vendor response (by id): {vendor_response.data}")

            if vendor_response.data and len(vendor_response.data) > 0:
                vendor_name = vendor_response.data[0].get("store_name")
                vendor_address = vendor_response.data[0].get("business_address")
                store_logo_url = vendor_response.data[0].get("store_logo_url")
                vendor_email = vendor_response.data[0].get("email")
                logger.info(f"Vendor found by id: {vendor_name}, {vendor_address}, {store_logo_url}")
            else:
                # id로 못 찾으면 user_id로 시도
                vendor_response = (
                    supabase_admin.table("vendors")
                    .select("store_name, business_address, store_logo_url, email")
                    .eq("user_id", vendor_id)
                    .execute()
                )
                logger.info(f"Vendor response (by user_id): {vendor_response.data}")
                if vendor_response.data and len(vendor_response.data) > 0:
                    vendor_name = vendor_response.data[0].get("store_name")
                    vendor_address = vendor_response.data[0].get("business_address")
                    store_logo_url = vendor_response.data[0].get("store_logo_url")
                    vendor_email = vendor_response.data[0].get("email")
                    logger.info(f"Vendor found by user_id: {vendor_name}, {vendor_address}, {store_logo_url}")
        except Exception as e:
            logger.info(f"Error fetching vendor: {str(e)}")
            vendor_name = None
            vendor_address = None
            store_logo_url = None
            vendor_email = None

    # 상품 옵션 조회
    options = get_product_options(supabase_admin, product_id)

    product_data = {
        **product,
        "category_slug": category_info["slug"],
        "category_name": category_info["name"],
        "vendor_name": vendor_name,
        "vendor_address": vendor_address,
        "store_logo_url": store_logo_url,
        "vendor_email": vendor_email,
        "options": options,
    }

    logger.info(f"Final product_data vendor_name: {product_data.get('vendor_name')}")

    return {"message": "특정 상품 조회", "product": product_data}




# ============================================
# 판매자 전용 API (인증 필요)
# ============================================


# 상품 등록/수정
@router.post("/management/{product_id}", status_code=status.HTTP_201_CREATED, summary="상품 등록/수정")
async def create_or_update_product(
    product_id: str,
    product_data: CreateProductRequset,
    current_user: dict = Depends(get_current_user)
):
    """
    상품을 등록하거나 수정합니다 (판매자 전용, JWT 인증 필요)

    - **product_id**: -1이면 신규 등록, 그 외에는 해당 ID의 상품 수정
    - **name**: 상품명 (필수)
    - **description**: 상품 설명 (필수, 최소 20자)
    - **price**: 가격 (필수, 0보다 큼)
    - **category**: 카테고리 slug (필수)
    - **stock_quantity**: 재고 수량 (기본값: 0)
    - **low_stock_threshold**: 재고 부족 알림 기준 (기본값: 10)
    - **image**: 상품 이미지 URL (선택)
    """

    # product_id를 product_data에 설정
    product_data.id = product_id

    # CreateProduct 서비스 클래스 사용 (current_user만 전달)
    service = CreateProduct(product_data, current_user)
    product = service.execute()

    is_new = product_id == "-1"
    message = "상품이 등록되었습니다" if is_new else "상품이 수정되었습니다"

    return {"message": message, "product": product}


# 이미지 업로드 (여러 파일 지원)
@router.post("/product-image/{product_id}", summary="상품 이미지 업로드")
async def upload_product_image(
    product_id: str,
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    상품 이미지를 Supabase Storage에 업로드합니다 (판매자 전용, JWT 인증 필요)
    최대 5개의 이미지를 업로드할 수 있습니다.

    - **product_id**: 상품 ID (temp는 임시 ID로 신규 상품용)
    - **files**: 업로드할 이미지 파일들 (최대 5개)

    Returns:
        - **thumbnail_url**: 첫 번째 이미지의 Public URL
        - **image_urls**: 모든 이미지의 Public URL 배열
    """

    # 최대 5개까지만 허용
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="최대 5개의 이미지만 업로드할 수 있습니다."
        )

    # 파일 크기 및 확장자 검증
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}

    for file in files:
        # 파일 확장자 검증
        file_extension = file.filename.split(".")[-1].lower() if file.filename else ""
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"허용되지 않는 파일 형식입니다. 허용 형식: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 파일 크기 검증 (파일 내용을 읽어서 확인)
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"파일 크기는 최대 5MB까지 허용됩니다. ({file.filename})"
            )
        # 파일 포인터를 처음으로 되돌림
        await file.seek(0)

    # 모든 파일을 병렬로 업로드
    upload_tasks = []
    for file in files:
        service = UploadProductImage(file, current_user)
        upload_tasks.append(service.execute())

    # asyncio.gather로 모든 업로드를 동시에 실행
    results = await asyncio.gather(*upload_tasks)
    image_urls = [result["image_url"] for result in results]

    # 첫 번째 이미지의 임베딩을 DB에 저장
    if results and results[0].get("image_embedding") and product_id != "temp":
        try:
            supabase = get_supabase_admin_client()
            supabase.table("products").update({
                "image_embedding": results[0]["image_embedding"]
            }).eq("id", product_id).execute()
            logger.info(f"[ProductImage] Saved image embedding for product {product_id}")
        except Exception as e:
            logger.info(f"[ProductImage] Warning: Failed to save embedding to DB: {e}")

    return {
        "thumbnail_url": image_urls[0] if image_urls else None,
        "image_urls": image_urls
    }


# 이미지 기반 유사 상품 검색
@router.post("/search-by-image", summary="이미지로 유사 상품 검색")
async def search_products_by_image(
    file: UploadFile = File(...)
):
    """
    이미지를 업로드하면 시각적으로 유사한 상품을 찾아줍니다.

    - **file**: 검색할 이미지 파일 (jpg, png 등)

    Returns:
        - **products**: 유사도 높은 순으로 정렬된 상품 목록 (최대 20개)
        - **count**: 검색된 상품 수
    """
    # 파일 유효성 검사
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일만 업로드 가능합니다."
        )

    try:
        # 이미지 읽기
        image_bytes = await file.read()

        # 이미지 임베딩 생성
        embedding_service = get_image_embedding_service()
        query_embedding = embedding_service.generate_embedding_from_bytes(image_bytes)

        logger.info(f"[ImageSearch] Query embedding generated: {len(query_embedding)} dimensions")

        # pgvector 유사도 검색
        supabase = get_supabase_client()
        result = supabase.rpc("match_products_by_image", {
            "query_embedding": query_embedding,
            "match_threshold": 0.3,  # 유사도 30% 이상
            "match_count": 5  # 상위 5개만 반환
        }).execute()

        products = result.data or []

        logger.info(f"[ImageSearch] Found {len(products)} similar products")

        # 카테고리 및 벤더 정보 추가
        if products:
            category_ids = {p["category_id"] for p in products if p.get("category_id")}
            vendor_ids = {p["vendor_id"] for p in products if p.get("vendor_id")}

            category_map = {}
            vendor_map = {}

            if category_ids:
                categories_response = (
                    supabase.table("categories")
                    .select("id, slug, name")
                    .in_("id", list(category_ids))
                    .execute()
                )
                for category in categories_response.data or []:
                    category_map[category["id"]] = {
                        "slug": category.get("slug"),
                        "name": category.get("name"),
                    }

            if vendor_ids:
                from app.services.supabase import get_supabase_admin_client
                supabase_admin = get_supabase_admin_client()
                vendors_response = (
                    supabase_admin.table("vendors")
                    .select("id, store_name")
                    .in_("id", list(vendor_ids))
                    .execute()
                )
                for vendor in vendors_response.data or []:
                    vendor_map[vendor["id"]] = vendor.get("store_name")

            # 상품 데이터 포맷팅
            product_list = []
            for product in products:
                category_info = category_map.get(product.get("category_id"), {})
                vendor_name = vendor_map.get(product.get("vendor_id"))
                product_list.append({
                    "id": product["id"],
                    "name": product["name"],
                    "description": product.get("description"),
                    "price": product["price"],
                    "thumbnail_url": product.get("thumbnail_url"),
                    "category_slug": category_info.get("slug"),
                    "category_name": category_info.get("name"),
                    "vendor_name": vendor_name,
                    "rating": product.get("rating", 0),
                    "review_count": product.get("review_count", 0),
                    "stock_quantity": product.get("stock_quantity", 0),
                    "similarity": round(product.get("similarity", 0), 3)  # 유사도 점수
                })

            return {"products": product_list, "count": len(product_list)}

        return {"products": [], "count": 0}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 검색 중 오류가 발생했습니다: {str(e)}"
        )


# 상품 삭제
@router.delete("/management/{product_id}", summary="상품 삭제")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    상품을 삭제합니다 (판매자 전용, 본인 상품만 삭제 가능, JWT 인증 필요)

    - **product_id**: 삭제할 상품의 ID (필수)
    """

    # DeleteProduct 서비스 클래스 사용
    service = DeleteProduct(product_id, current_user)
    result = service.execute()

    return result
