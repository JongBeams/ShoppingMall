from uuid import uuid4
from pathlib import Path
from datetime import datetime, timezone
import logging


logger = logging.getLogger(__name__)

from app.services.supabase import get_supabase_admin_client
from fastapi import HTTPException, status, UploadFile
from app.models.product import CreateProductRequset, VendorProductResponse
from app.services.image_embedding import get_image_embedding_service


#======================================================
#공용 사용 (추후 분리)
#======================================================

# 판매자 권한 확인 및 vendor_id 조회
def get_vendor_id(current_user: dict) -> str:
    """
    현재 로그인한 사용자가 판매자인지 확인하고, vendor_id를 반환합니다.
    Service Role Key로 RLS를 우회하여 조회합니다.

    Args:
        current_user: JWT에서 추출한 사용자 정보

    Returns:
        str: vendor_id

    Raises:
        HTTPException: 판매자가 아니거나, 판매자 정보를 찾을 수 없는 경우
    """
    # 판매자 권한 확인
    if current_user.get("user_type") != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="판매자만 접근할 수 있습니다."
        )

    try:
        supabase_admin = get_supabase_admin_client()

        # 유저 프로필 정보에 판매자 아이디가 없어 판매자 테이블에서 유저 id 대조로 판매자 id 값 가져오기
        vendor_response = (
            supabase_admin.table("vendors")
            .select("id, user_id")
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )

        vendor = vendor_response.data
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )

        return vendor["id"]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"판매자 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )


# 카테고리 slug를 category_id로 변환
def getCategoryIdToSlug(category_slug: str):
    """
    카테고리 slug를 category_id로 변환합니다.
    Service Role Key로 RLS를 우회하여 조회합니다.
    """
    if not category_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="카테고리 slug가 필요합니다."
        )

    try:
        supabase_admin = get_supabase_admin_client()
        response = (
            supabase_admin.table("categories")
            .select("id, slug")
            .eq("slug", category_slug)
            .single()
            .execute()
        )

        category = response.data
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="카테고리를 찾을 수 없습니다."
            )

        return category["id"]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"카테고리 조회 중 오류가 발생했습니다: {str(e)}"
        )


# 상품 옵션 조회
def get_product_options(supabase_admin, product_id: str):
    """
    상품의 옵션 정보를 조회합니다.
    """
    try:
        # product_options 조회
        options_response = (
            supabase_admin.table("product_options")
            .select("id, custom_type")
            .eq("product_id", product_id)
            .execute()
        )

        if not options_response.data:
            return []

        options = []
        for option in options_response.data:
            # product_option_values 조회
            values_response = (
                supabase_admin.table("product_option_values")
                .select("id, value, price, stock")
                .eq("option_id", option["id"])
                .order("num")
                .execute()
            )

            options.append({
                "id": option["id"],
                "customType": option["custom_type"],
                "values": values_response.data or []
            })

        return options
    except Exception:
        return []


#======================================================
#판매자 상품 관리
#======================================================


#판매자 상품 조회
def GetVendorProducts(current_user: dict):
    """
    현재 로그인한 판매자의 상품 목록을 조회합니다.
    Service Role Key로 RLS를 우회하고, 애플리케이션 레벨에서 권한을 확인합니다.
    """
    try:
        # 판매자 권한 확인 및 vendor_id 조회 (헬퍼 함수 사용)
        vendor_id = get_vendor_id(current_user)

        # Service Role Key 사용 (RLS 우회)
        supabase_admin = get_supabase_admin_client()

        #판매자 id로 상품 목록 조회
        try:
            product_response = (
                supabase_admin.table("products")
                .select("id, name, category_id, description, meta_description, price, stock_quantity, low_stock_threshold, images, thumbnail_url, is_active, view_count, sale_count, rating, review_count, tags, created_at, updated_at, discount_price, discount_start, discount_end")
                .eq("vendor_id", vendor_id)
                .execute()
            )

            products_data = product_response.data
            if not products_data:
                return []

            # 각 상품의 카테고리 이름과 옵션을 조회하여 VendorProductResponse 배열로 변환
            vendor_products = []
            for product in products_data:
                # 카테고리 ID로 카테고리 이름 조회
                try:
                    category_response = (
                        supabase_admin.table("categories")
                        .select("slug")
                        .eq("id", product["category_id"])
                        .single()
                        .execute()
                    )
                    category_slug = category_response.data["slug"] if category_response.data else "알 수 없음"
                except Exception:
                    category_slug = "알 수 없음"

                # 옵션 조회
                options = get_product_options(supabase_admin, product["id"])

                # VendorProductResponse 객체 생성
                vendor_product = VendorProductResponse(
                    id=product["id"],
                    name=product["name"],
                    category_slug=category_slug,
                    description=product.get("description"),
                    meta_description=product.get("meta_description"),
                    price=product["price"],
                    stock_quantity=product["stock_quantity"],
                    low_stock_threshold=product["low_stock_threshold"],
                    images=product.get("images"),
                    thumbnail_url=product.get("thumbnail_url"),
                    is_active=product["is_active"],
                    view_count=product["view_count"],
                    sale_count=product["sale_count"],
                    rating=product["rating"],
                    review_count=product["review_count"],
                    tags=product.get("tags"),
                    options=options,
                    created_at=product["created_at"],
                    updated_at=product["updated_at"],
                    discount_price=product.get("discount_price"),
                    discount_start=product.get("discount_start"),
                    discount_end=product.get("discount_end")
                )
                vendor_products.append(vendor_product)

            return vendor_products

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"상품 목록 조회 중 오류가 발생했습니다: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"상품 조회 중 오류가 발생했습니다: {str(e)}"
        )




#상품 등록
class CreateProduct:
    """
    상품 생성 비즈니스 로직
    Service Role Key로 RLS를 우회하고, 애플리케이션 레벨에서 권한을 확인합니다.
    """

    # 상품정보, 사용자 정보를 받아오는 단계
    def __init__(self, product_data: CreateProductRequset, current_user: dict):
        self.product_data = product_data
        self.current_user = current_user
        # Service Role Key 사용 (RLS 우회)
        self.supabase_admin = get_supabase_admin_client()

    #생성/수정 단계
    def execute(self):
        """
        상품을 생성하거나 수정합니다.
        product_data.id가 -1이면 신규 생성, 그 외에는 수정입니다.
        """
        # 판매자 권한 확인 및 vendor_id 조회 (헬퍼 함수 사용)
        vendor_id = get_vendor_id(self.current_user)

        #카테고리 슬러그로 카테고리 아이디 추출
        category_id = getCategoryIdToSlug(category_slug=self.product_data.category)

        # 신규 등록인지 수정인지 확인
        is_new = self.product_data.id == "-1" or self.product_data.id is None

        #상품 정보 json 형태로 저장 키쌍
        payload = {
            "category_id": category_id,
            "name": self.product_data.name,
            "meta_description": self.product_data.meta_description,
            "description": self.product_data.description,
            "price": float(self.product_data.price),
            "stock_quantity": self.product_data.stock_quantity,
            "low_stock_threshold": self.product_data.low_stock_threshold,
        }

        # 태그가 있으면 추가
        if hasattr(self.product_data, 'tags') and self.product_data.tags:
            payload["tags"] = self.product_data.tags

        # 대표 이미지 URL이 있으면 thumbnail_url에 저장
        if hasattr(self.product_data, 'image_url') and self.product_data.image_url:
            payload["thumbnail_url"] = self.product_data.image_url

        # 추가 이미지 URLs가 있으면 images JSONB에 배열로 저장
        if hasattr(self.product_data, 'image_urls') and self.product_data.image_urls:
            # JSONB 형식으로 저장 (PostgreSQL JSONB 타입)
            payload["images"] = self.product_data.image_urls

        if is_new:
            # 신규 등록
            payload["meta_title"] = self.product_data.name
            payload["vendor_id"] = vendor_id
            payload["slug"] = self.product_data.name  # 임시 slug
            payload["is_active"] = True
            payload["is_featured"] = False

            # 상품 정보 insert
            try:
                insert_response = (
                    self.supabase_admin.table("products")
                    .insert(payload)
                    .execute()
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"상품 생성 중 오류가 발생했습니다: {str(e)}"
                )

            product = insert_response.data[0] if insert_response.data else None
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="상품 생성 결과를 가져오지 못했습니다."
                )

            #생성된 상품의 id값으로 슬러그값 바꾸기
            slug = str(product["id"])
            try:
                (
                    self.supabase_admin.table("products")
                    .update({"slug": slug})
                    .eq("id", product["id"])
                    .execute()
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"상품 slug 업데이트 중 오류가 발생했습니다: {str(e)}"
                )

            product["slug"] = slug
            product["category_id"] = category_id
            product["vendor_id"] = vendor_id

            # 옵션 저장
            if self.product_data.options and len(self.product_data.options) > 0:
                self._save_product_options(product["id"], self.product_data.options)

            return product

        else:
            # 기존 상품 수정
            product_id = self.product_data.id

            # updated_at을 현재 시각으로 갱신
            payload["updated_at"] = datetime.now(timezone.utc).isoformat()

            # 상품 존재 여부 및 소유권 확인
            try:
                existing_product = (
                    self.supabase_admin.table("products")
                    .select("id, vendor_id, name")
                    .eq("id", product_id)
                    .single()
                    .execute()
                )
                if not existing_product.data:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="상품을 찾을 수 없습니다."
                    )

                # 소유권 확인
                if existing_product.data["vendor_id"] != vendor_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="본인의 상품만 수정할 수 있습니다."
                    )

                # 상품명이 변경되었다면 meta_title도 함께 업데이트
                if existing_product.data.get("name") != self.product_data.name:
                    payload["meta_title"] = self.product_data.name
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"상품 조회 중 오류가 발생했습니다: {str(e)}"
                )

            # 상품 정보 업데이트
            try:
                update_response = (
                    self.supabase_admin.table("products")
                    .update(payload)
                    .eq("id", product_id)
                    .execute()
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"상품 수정 중 오류가 발생했습니다: {str(e)}"
                )

            product = update_response.data[0] if update_response.data else None
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="상품 수정 결과를 가져오지 못했습니다."
                )

            # 기존 옵션 삭제 후 새로 저장
            if self.product_data.options is not None:
                self._delete_product_options(product_id)
                if len(self.product_data.options) > 0:
                    self._save_product_options(product_id, self.product_data.options)

            # 🔥 상품 수정 시 이미지 임베딩 재생성
            # 1. 기존 임베딩 삭제
            try:
                self.supabase_admin.table("products").update({
                    "image_embedding": None
                }).eq("id", product_id).execute()
                logger.info(f"[ProductUpdate] Deleted old image embedding for product {product_id}")
            except Exception as e:
                logger.info(f"[ProductUpdate] Warning: Failed to delete old embedding: {e}")

            # 2. 현재 이미지의 임베딩 재생성
            if product.get("thumbnail_url"):
                try:
                    from app.services.image_embedding import get_image_embedding_service
                    embedding_service = get_image_embedding_service()
                    embedding = embedding_service.generate_embedding(product["thumbnail_url"])

                    # 임베딩 DB에 저장
                    self.supabase_admin.table("products").update({
                        "image_embedding": embedding
                    }).eq("id", product_id).execute()

                    logger.info(f"[ProductUpdate] Regenerated image embedding for product {product_id}")
                except Exception as e:
                    logger.info(f"[ProductUpdate] Warning: Failed to regenerate image embedding: {e}")

            return product

    def _save_product_options(self, product_id: str, options: list):
        """
        상품 옵션을 product_options 및 product_option_values 테이블에 저장합니다.
        """
        try:
            for option in options:
                # product_options 테이블에 옵션 타입 저장
                option_response = (
                    self.supabase_admin.table("product_options")
                    .insert({
                        "product_id": product_id,
                        "custom_type": option.customType
                    })
                    .execute()
                )

                if not option_response.data or len(option_response.data) == 0:
                    raise Exception("옵션 저장에 실패했습니다.")

                option_id = option_response.data[0]["id"]

                # product_option_values 테이블에 옵션 값들 저장
                for idx, value_data in enumerate(option.values):
                    self.supabase_admin.table("product_option_values").insert({
                        "option_id": option_id,
                        "num": idx,
                        "value": value_data.value,
                        "price": float(value_data.price) if value_data.price else 0,
                        "stock": int(value_data.stock) if value_data.stock else 0
                    }).execute()

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"옵션 저장 중 오류가 발생했습니다: {str(e)}"
            )

    def _delete_product_options(self, product_id: str):
        """
        상품의 기존 옵션을 모두 삭제합니다.
        product_option_values는 외래키 제약조건으로 CASCADE 삭제됩니다.
        """
        try:
            # product_options 조회
            options_response = (
                self.supabase_admin.table("product_options")
                .select("id")
                .eq("product_id", product_id)
                .execute()
            )

            # 각 옵션의 값들 먼저 삭제
            if options_response.data:
                for option in options_response.data:
                    self.supabase_admin.table("product_option_values").delete().eq("option_id", option["id"]).execute()

            # 옵션 삭제
            self.supabase_admin.table("product_options").delete().eq("product_id", product_id).execute()

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"기존 옵션 삭제 중 오류가 발생했습니다: {str(e)}"
            )


#상품 삭제
class DeleteProduct:
    """
    상품 삭제 비즈니스 로직
    Service Role Key로 RLS를 우회하고, 애플리케이션 레벨에서 권한을 확인합니다.
    """

    def __init__(self, product_id: str, current_user: dict):
        self.product_id = product_id
        self.current_user = current_user
        # Service Role Key 사용 (RLS 우회)
        self.supabase_admin = get_supabase_admin_client()

    def execute(self):
        """
        상품을 삭제합니다. 판매자 본인의 상품만 삭제 가능합니다.

        삭제 항목:
        1. Supabase Storage의 이미지 파일들 (thumbnail + images)
        2. products 테이블 레코드 (image_embedding 벡터 포함)
        3. product_options, product_option_values (CASCADE로 자동 삭제)
        """
        # 판매자 권한 확인 및 vendor_id 조회 (헬퍼 함수 사용)
        vendor_id = get_vendor_id(self.current_user)

        # 상품 존재 여부 및 소유권 확인 + 이미지 URL 가져오기
        try:
            product_response = (
                self.supabase_admin.table("products")
                .select("id, vendor_id, thumbnail_url, images")
                .eq("id", self.product_id)
                .single()
                .execute()
            )
            product = product_response.data
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="상품을 찾을 수 없습니다."
                )

            # 상품의 소유자가 현재 판매자인지 확인
            if product["vendor_id"] != vendor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인의 상품만 삭제할 수 있습니다."
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"상품 조회 중 오류가 발생했습니다: {str(e)}"
            )

        # 🔥 1. Supabase Storage에서 이미지 파일들 삭제
        self._delete_product_images(product)

        # 🔥 2. 상품 옵션 삭제 (product_options, product_option_values)
        self._delete_product_options(self.product_id)

        # 🔥 3. products 테이블 삭제 (image_embedding 벡터도 함께 삭제됨)
        try:
            (
                self.supabase_admin.table("products")
                .delete()
                .eq("id", self.product_id)
                .execute()
            )
            logger.info(f"[DeleteProduct] Deleted product {self.product_id} from DB (including image_embedding)")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"상품 삭제 중 오류가 발생했습니다: {str(e)}"
            )

        return {"message": "상품이 삭제되었습니다.", "product_id": self.product_id}

    def _delete_product_images(self, product: dict):
        """
        Supabase Storage에서 상품 이미지 파일들을 삭제합니다.

        Args:
            product: 상품 데이터 (thumbnail_url, images 포함)
        """
        bucket_name = "ProductImage"
        storage_paths = []

        try:
            # thumbnail_url에서 storage path 추출
            thumbnail_url = product.get("thumbnail_url")
            if thumbnail_url and "ProductImage" in thumbnail_url:
                # URL 예시: https://.../storage/v1/object/public/ProductImage/products/{vendor_id}/{uuid}.jpg
                path = thumbnail_url.split("ProductImage/")[-1]
                storage_paths.append(path)

            # images 배열에서 storage path 추출
            images = product.get("images")
            if images and isinstance(images, list):
                for img_url in images:
                    if img_url and "ProductImage" in img_url:
                        path = img_url.split("ProductImage/")[-1]
                        storage_paths.append(path)

            # Storage에서 파일 삭제
            if storage_paths:
                for path in storage_paths:
                    try:
                        self.supabase_admin.storage.from_(bucket_name).remove([path])
                        logger.info(f"[DeleteProduct] Deleted image from storage: {path}")
                    except Exception as e:
                        logger.info(f"[DeleteProduct] Warning: Failed to delete {path}: {e}")
                        # 파일 삭제 실패해도 계속 진행 (이미 삭제됐을 수도 있음)

        except Exception as e:
            logger.info(f"[DeleteProduct] Warning: Error during image deletion: {e}")
            # 이미지 삭제 실패해도 상품 DB 레코드는 삭제 진행


#이미지 업로드
class UploadProductImage:
    """
    상품 이미지 Supabase Storage 업로드 비즈니스 로직
    Service Role Key로 RLS를 우회하고, 애플리케이션 레벨에서 권한을 확인합니다.
    """

    def __init__(self, file: UploadFile, current_user: dict):
        self.file = file
        self.current_user = current_user
        # Service Role Key 사용 (RLS 우회)
        self.supabase_admin = get_supabase_admin_client()
        self.bucket_name = "ProductImage"  # Supabase Storage 버킷 이름

    async def execute(self):
        """
        이미지를 Supabase Storage에 업로드하고 public URL을 반환합니다.
        """
        # 판매자 권한 확인 및 vendor_id 조회 (헬퍼 함수 사용)
        vendor_id = get_vendor_id(self.current_user)

        # 파일 유효성 검사
        if not self.file.content_type or not self.file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미지 파일만 업로드 가능합니다."
            )

        # 파일 크기 제한 (예: 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        file_content = await self.file.read()
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="파일 크기는 5MB를 초과할 수 없습니다."
            )

        # 파일 확장자 추출
        filename = Path(self.file.filename or "image.jpg")
        ext = filename.suffix if filename.suffix else ".jpg"

        # Storage 경로 생성: products/{vendor_id}/{uuid4()}{ext}
        storage_path = f"products/{vendor_id}/{uuid4()}{ext}"

        # Supabase Storage에 업로드
        try:
            upload_response = self.supabase_admin.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": self.file.content_type}
            )

            # 업로드 실패 확인
            if hasattr(upload_response, 'error') and upload_response.error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"이미지 업로드에 실패했습니다: {upload_response.error}"
                )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"이미지 업로드 중 오류가 발생했습니다: {str(e)}"
            )

        # Public URL 생성
        try:
            public_url = self.supabase_admin.storage.from_(self.bucket_name).get_public_url(storage_path)

            # 이미지 임베딩 생성 (CLIP 모델)
            embedding = None
            try:
                embedding_service = get_image_embedding_service()
                embedding = embedding_service.generate_embedding_from_bytes(file_content)
                logger.info(f"[UploadProductImage] Image embedding generated: {len(embedding)} dimensions")
            except Exception as e:
                logger.info(f"[UploadProductImage] Warning: Failed to generate image embedding: {e}")
                # 임베딩 실패해도 이미지 업로드는 성공시킴

            return {
                "image_url": public_url,
                "storage_path": storage_path,
                "image_embedding": embedding  # 512차원 float 리스트 (또는 None)
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"이미지 URL 생성 중 오류가 발생했습니다: {str(e)}"
            )
