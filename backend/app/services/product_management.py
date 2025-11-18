import httpx
from supabase import create_client
from uuid import uuid4
from pathlib import Path

from app.services.supabase import get_supabase_client
from fastapi import HTTPException, status, UploadFile
from app.models.product import CreateProductRequset, VendorProductResponse
from app.models.user import ProfileResponse
from app.config import get_settings


#======================================================
#공용 사용 (추후 분리)
#======================================================

# 사용자 정보 확인
def _get_current_profile():
    """
    Supabase에서 현재 로그인한 사용자의 프로필 정보를 조회합니다.
    """
    supabase = get_supabase_client()

    try:
        user = supabase.auth.get_user()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="인증되지 않은 사용자입니다."
            )

        profile_response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user.user.id)
            .single()
            .execute()
        )

        profile = profile_response.data
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자 정보를 찾을 수 없습니다."
            )

        return profile

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )



# 카테고리 slug를 category_id로 변환
def getCategoryIdToSlug(category_slug: str, supabase_client=None):
    """
    현재 로그인한 사용자가 요청한 카테고리 slug를 category_id로 변환합니다.
    """
    if not category_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="카테고리 slug가 필요합니다."
        )

    try:
        supabase = supabase_client or get_supabase_client()
        response = (
            supabase.table("categories")
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


#프론트에서 토큰으로 사용자 검증
#(유저정보를 로컬 스토리지에서 바로 받아와 사용가능하지만 로컬 수정이 가능하기에 검증 구간 추가)
#프론트에서 받아온 토큰으로 사용자 정보, 토큰 반환
def get_profile_from_token(authorization_header: str) -> tuple[ProfileResponse, str]:
    """
    Authorization 헤더의 access token을 검증하고 사용자 프로필을 반환합니다.
    """
    if not authorization_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다."
        )

    #토큰 종류 확인 jwt는 bearer로 시작함
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효한 Authorization 헤더가 필요합니다."
        )

    access_token = parts[1]
    settings = get_settings()

    #anon 키와 토큰을 전달하여 현재 유저 정보를 get
    #로컬 스토리지가 가지고있는 유저정보를 그대로 읽어오면 데이터 보안상 문제가 될 수 있다.
    try:
        response = httpx.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {access_token}",
            },
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"인증 서버에 연결할 수 없습니다: {str(exc)}"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 토큰입니다."
        )

    #현재 유저 정보에서 유저id를 받아옴
    user_data = response.json()
    user_id = user_data.get("id") or user_data.get("user", {}).get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 정보를 확인할 수 없습니다."
        )

    # 받아온 유저 id로 get_supabase_client로 db에 접근해 profiles에서 유저 정보를 읽어옴
    supabase = get_supabase_client()
    profile_response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

    profile = profile_response.data
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자 프로필을 찾을 수 없습니다."
        )

    profile_obj = ProfileResponse(
        id=profile["id"],
        email=profile["email"],
        full_name=profile["full_name"],
        phone=profile.get("phone"),
        avatar_url=profile.get("avatar_url"),
        user_type=profile["user_type"],
        created_at=profile["created_at"],
        updated_at=profile["updated_at"],
    )
    return profile_obj, access_token



#======================================================
#판매자 상품 관리
#======================================================


#판매자 상품 조회
def GetVendorProducts():
    """
    현재 로그인한 판매자의 상품 목록을 조회합니다.
    """
    try:
        #현재 사용자 정보 호출
        profile = _get_current_profile()
        supabase = get_supabase_client()

        #유저 프로필 정보에 판매자 아이디가 없어 판매자 테이블에서 유저 id 대조로 판매자 id 값 가져오기
        try:
            vendor_response = (
                supabase.table("vendors")
                .select("id, user_id")
                .eq("user_id", profile["id"])
                .single()
                .execute()
            )
            vendor = vendor_response.data
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="판매자 정보를 찾을 수 없습니다."
                )
            vendor_id = vendor["id"]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"판매자 정보 조회 중 오류가 발생했습니다: {str(e)}"
            )

        #판매자 id로 상품 목록 조회
        try:
            product_response = (
                supabase.table("products")
                .select("id, name, category_id, description, price, stock_quantity, low_stock_threshold, images, thumbnail_url, is_active, view_count, sale_count, rating, review_count, created_at, updated_at")
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
                        supabase.table("categories")
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
    """

    # 상품정보, 토큰, 사용자 정보를 받아오는 단계
    def __init__(self, product_data: CreateProductRequset, profile: ProfileResponse, access_token: str):
        self.product_data = product_data
        self.profile = profile
        settings = get_settings()
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        self.supabase.postgrest.auth(access_token)

    #생성/수정 단계
    def execute(self):
        """
        상품을 생성하거나 수정합니다.
        product_data.id가 -1이면 신규 생성, 그 외에는 수정입니다.
        """
        #판매자 확인 검증
        if self.profile.user_type != "seller":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="판매자만 상품을 등록/수정할 수 있습니다."
            )

        #카테고리 슬러그로 카테고리 아이디 추출
        category_id = getCategoryIdToSlug(
            category_slug=self.product_data.category,
            supabase_client=self.supabase
        )

        #유저 프로필 정보에 판매자 아이디가 없어 판매자 테이블에서 유저 id 대조로 판매자 id 값 가져오기
        vendor_response = (
            self.supabase.table("vendors")
            .select("id, user_id")
            .eq("user_id", self.profile.id)
            .single()
            .execute()
        )
        vendor = vendor_response.data
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )

        vendor_id = vendor["id"]

        # 신규 등록인지 수정인지 확인
        is_new = self.product_data.id == "-1" or self.product_data.id is None

        #상품 정보 json 형태로 저장 키쌍
        payload = {
            "category_id": category_id,
            "name": self.product_data.name,
            "description": self.product_data.description,
            "price": float(self.product_data.price),
            "stock_quantity": self.product_data.stock_quantity,
            "low_stock_threshold": self.product_data.low_stock_threshold,
        }

        # 이미지 URL이 있으면 thumbnail_url에 저장 (프론트에서 이미 업로드된 URL)
        if hasattr(self.product_data, 'image_url') and self.product_data.image_url:
            payload["thumbnail_url"] = self.product_data.image_url

        if is_new:
            # 신규 등록
            payload["vendor_id"] = vendor_id
            payload["slug"] = self.product_data.name  # 임시 slug
            payload["is_active"] = True
            payload["is_featured"] = False

            # 상품 정보 insert
            try:
                insert_response = (
                    self.supabase.table("products")
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
                    self.supabase.table("products")
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

            # 상품 존재 여부 및 소유권 확인
            try:
                existing_product = (
                    self.supabase.table("products")
                    .select("id, vendor_id")
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
                    self.supabase.table("products")
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
    """

    def __init__(self, product_id: str, profile: ProfileResponse, access_token: str):
        self.product_id = product_id
        self.profile = profile
        settings = get_settings()
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        self.supabase.postgrest.auth(access_token)

    def execute(self):
        """
        상품을 삭제합니다. 판매자 본인의 상품만 삭제 가능합니다.
        """
        # 판매자 확인 검증
        if self.profile.user_type != "seller":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="판매자만 상품을 삭제할 수 있습니다."
            )

        # 유저 프로필 정보에 판매자 아이디가 없어 판매자 테이블에서 유저 id 대조로 판매자 id 값 가져오기
        vendor_response = (
            self.supabase.table("vendors")
            .select("id, user_id")
            .eq("user_id", self.profile.id)
            .single()
            .execute()
        )
        vendor = vendor_response.data
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="판매자 정보를 찾을 수 없습니다."
            )

        vendor_id = vendor["id"]

        # 상품 존재 여부 및 소유권 확인
        try:
            product_response = (
                self.supabase.table("products")
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
                self.supabase.table("products")
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
    """

    def __init__(self, file: UploadFile, profile: ProfileResponse):
        self.file = file
        self.profile = profile
        settings = get_settings()
        # Storage 업로드는 Service Role 키 사용 (RLS 우회, 판매자 권한은 코드에서 검증)
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        self.bucket_name = "ProductImage"  # Supabase Storage 버킷 이름

    async def execute(self):
        """
        이미지를 Supabase Storage에 업로드하고 public URL을 반환합니다.
        """
        # 판매자 확인 검증
        if self.profile.user_type != "seller":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="판매자만 이미지를 업로드할 수 있습니다."
            )

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

        # 유저 프로필 정보에 판매자 아이디가 없어 판매자 테이블에서 유저 id 대조로 판매자 id 값 가져오기
        try:
            vendor_response = (
                self.supabase.table("vendors")
                .select("id, user_id")
                .eq("user_id", self.profile.id)
                .single()
                .execute()
            )
            vendor = vendor_response.data
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="판매자 정보를 찾을 수 없습니다."
                )
            vendor_id = vendor["id"]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"판매자 정보 조회 중 오류가 발생했습니다: {str(e)}"
            )

        # 파일 확장자 추출
        filename = Path(self.file.filename or "image.jpg")
        ext = filename.suffix if filename.suffix else ".jpg"

        # Storage 경로 생성: products/{vendor_id}/{uuid4()}{ext}
        storage_path = f"products/{vendor_id}/{uuid4()}{ext}"

        # Supabase Storage에 업로드
        try:
            upload_response = self.supabase.storage.from_(self.bucket_name).upload(
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
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(storage_path)

            return {
                "image_url": public_url,
                "storage_path": storage_path
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"이미지 URL 생성 중 오류가 발생했습니다: {str(e)}"
            )
