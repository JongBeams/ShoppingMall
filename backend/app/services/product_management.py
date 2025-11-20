from uuid import uuid4
from pathlib import Path
from datetime import datetime, timezone

from app.services.supabase import get_supabase_admin_client
from fastapi import HTTPException, status, UploadFile
from app.models.product import CreateProductRequset, VendorProductResponse


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
                .select("id, name, category_id, meta_description, description, price, stock_quantity, low_stock_threshold, images, thumbnail_url, is_active, view_count, sale_count, rating, review_count, tags, created_at, updated_at")
                .eq("vendor_id", vendor_id)
                .execute()
            )

            products_data = product_response.data
            if not products_data:
                return []

            # 각 상품의 카테고리 이름을 조회하여 VendorProductResponse 배열로 변환
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

                # VendorProductResponse 객체 생성
                vendor_product = VendorProductResponse(
                    id=product["id"],
                    name=product["name"],
                    category_slug=category_slug,
                    meta_description=product.get("meta_description"),
                    description=product.get("description"),
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
                    created_at=product["created_at"],
                    updated_at=product["updated_at"]
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

            return product


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
        """
        # 판매자 권한 확인 및 vendor_id 조회 (헬퍼 함수 사용)
        vendor_id = get_vendor_id(self.current_user)

        # 상품 존재 여부 및 소유권 확인
        try:
            product_response = (
                self.supabase_admin.table("products")
                .select("id, vendor_id")
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

        # 상품 삭제
        try:
            (
                self.supabase_admin.table("products")
                .delete()
                .eq("id", self.product_id)
                .execute()
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"상품 삭제 중 오류가 발생했습니다: {str(e)}"
            )

        return {"message": "상품이 삭제되었습니다.", "product_id": self.product_id}


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

            return {
                "image_url": public_url,
                "storage_path": storage_path
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"이미지 URL 생성 중 오류가 발생했습니다: {str(e)}"
            )
