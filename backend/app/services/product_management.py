import httpx
from supabase import create_client

from app.services.supabase import get_supabase_client
from fastapi import HTTPException, status
from app.models.product import CreateProductRequset
from app.models.user import ProfileResponse
from app.config import get_settings





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

    #생성 단계
    def execute(self):
        """
        상품을 생성하고 생성된 product ID로 slug를 업데이트합니다.
        """
        #판매자 확인 검증
        if self.profile.user_type != "seller":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="판매자만 상품을 등록할 수 있습니다."
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

        #상품 정보 json 형태로 저장 키쌍
        #slug 값은 id값으로 저장할꺼라 임의로 name값을 준 후 생성 후 id값으로 변환 
        payload = {
            "vendor_id": vendor_id,
            "category_id": category_id,
            "name": self.product_data.name,
            "description": self.product_data.description,
            "price": float(self.product_data.price),
            "stock_quantity": self.product_data.stock_quantity,
            "low_stock_threshold": self.product_data.low_stock_threshold,
            "slug": self.product_data.name,
            # "image_url": self.product_data.image_url,
            "is_active": True,
            "is_featured": False,
        }

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
