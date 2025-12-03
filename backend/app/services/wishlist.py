from typing import List, Dict, Optional
from app.services.supabase import get_supabase_admin_client


class WishlistService:
    """찜 목록 관련 비즈니스 로직"""

    @staticmethod
    def get_user_wishlist(user_id: str) -> List[Dict]:
        """
        사용자의 찜 목록을 조회합니다.

        Args:
            user_id: 사용자 ID

        Returns:
            찜 목록 아이템 리스트
        """
        supabase = get_supabase_admin_client()

        # 찜 목록 조회
        wishlist_response = (
            supabase.table("wishlist_items")
            .select("id, product_id, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        wishlist_items = wishlist_response.data or []

        if not wishlist_items:
            return []

        # 상품 ID 목록 추출
        product_ids = [item["product_id"] for item in wishlist_items]

        # 상품 정보 조회
        products_response = (
            supabase.table("products")
            .select("id, name, price, thumbnail_url, category_id, description, stock_quantity, is_active")
            .in_("id", product_ids)
            .execute()
        )

        # 상품 정보를 딕셔너리로 매핑
        products_map = {p["id"]: p for p in products_response.data or []}

        # 카테고리 ID 목록 추출 (중복 제거)
        category_ids = list(set([p.get("category_id") for p in products_response.data or [] if p.get("category_id")]))

        # 카테고리 정보 조회
        categories_map = {}
        if category_ids:
            categories_response = (
                supabase.table("categories")
                .select("id, name")
                .in_("id", category_ids)
                .execute()
            )
            categories_map = {c["id"]: c["name"] for c in categories_response.data or []}

        # 응답 데이터 구성
        items = []
        for wishlist_item in wishlist_items:
            product = products_map.get(wishlist_item["product_id"])
            if not product:
                continue

            category_name = None
            if product.get("category_id"):
                category_name = categories_map.get(product["category_id"])

            items.append({
                "id": wishlist_item["id"],
                "product_id": wishlist_item["product_id"],
                "product_name": product["name"],
                "product_price": float(product["price"]),
                "product_thumbnail": product.get("thumbnail_url"),
                "category": category_name,
                "description": product.get("description"),
                "stock_quantity": product["stock_quantity"],
                "is_active": product["is_active"],
                "created_at": wishlist_item["created_at"]
            })

        return items

    @staticmethod
    def check_wishlist_status(user_id: str, product_id: str) -> Dict:
        """
        특정 상품이 찜 목록에 있는지 확인합니다.

        Args:
            user_id: 사용자 ID
            product_id: 상품 ID

        Returns:
            찜 상태 정보 (is_wishlisted, wishlist_item_id)
        """
        supabase = get_supabase_admin_client()

        wishlist_response = (
            supabase.table("wishlist_items")
            .select("id")
            .eq("user_id", user_id)
            .eq("product_id", product_id)
            .execute()
        )

        if wishlist_response.data and len(wishlist_response.data) > 0:
            return {
                "is_wishlisted": True,
                "wishlist_item_id": wishlist_response.data[0]["id"]
            }
        else:
            return {
                "is_wishlisted": False,
                "wishlist_item_id": None
            }

    @staticmethod
    def get_product_info(product_id: str) -> Optional[Dict]:
        """
        상품 정보를 조회합니다.

        Args:
            product_id: 상품 ID

        Returns:
            상품 정보 또는 None
        """
        supabase = get_supabase_admin_client()

        product_response = (
            supabase.table("products")
            .select("id, name, is_active")
            .eq("id", product_id)
            .single()
            .execute()
        )

        return product_response.data

    @staticmethod
    def add_to_wishlist(user_id: str, product_id: str) -> Dict:
        """
        찜 목록에 상품을 추가합니다.

        Args:
            user_id: 사용자 ID
            product_id: 상품 ID

        Returns:
            추가된 찜 아이템 정보
        """
        supabase = get_supabase_admin_client()

        insert_response = (
            supabase.table("wishlist_items")
            .insert({
                "user_id": user_id,
                "product_id": product_id
            })
            .execute()
        )

        return insert_response.data[0]

    @staticmethod
    def remove_from_wishlist(user_id: str, product_id: str) -> None:
        """
        찜 목록에서 상품을 삭제합니다.

        Args:
            user_id: 사용자 ID
            product_id: 상품 ID
        """
        supabase = get_supabase_admin_client()

        supabase.table("wishlist_items").delete().eq("user_id", user_id).eq("product_id", product_id).execute()

    @staticmethod
    def clear_wishlist(user_id: str) -> None:
        """
        사용자의 찜 목록을 전체 비웁니다.

        Args:
            user_id: 사용자 ID
        """
        supabase = get_supabase_admin_client()

        supabase.table("wishlist_items").delete().eq("user_id", user_id).execute()
