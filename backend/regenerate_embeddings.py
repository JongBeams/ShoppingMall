"""
기존 상품들의 이미지 임베딩 재생성 스크립트 (전체 삭제 후 재생성)
"""

import sys
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.supabase import get_supabase_admin_client
from app.services.image_embedding import get_image_embedding_service

def regenerate_embeddings():
    """
    모든 상품의 이미지 임베딩을 재생성 (기존 임베딩 삭제 후 전체 재생성)
    """
    supabase = get_supabase_admin_client()
    embedding_service = get_image_embedding_service()

    print("=" * 60)
    print("[START] Image Embedding FULL Regeneration")
    print("=" * 60)

    # 1단계: 모든 임베딩 삭제
    print("\n[STEP 1] Deleting all existing embeddings...")
    try:
        # 모든 활성 상품의 image_embedding을 NULL로 설정
        result = supabase.table("products").update({
            "image_embedding": None
        }).eq("is_active", True).execute()
        print(f"[OK] All embeddings deleted ({len(result.data)} products)")
    except Exception as e:
        print(f"[ERROR] Failed to delete embeddings: {e}")
        return

    # 2단계: 활성화된 모든 상품 조회
    print("\n[STEP 2] Loading all active products...")
    result = supabase.table("products").select(
        "id, name, thumbnail_url"
    ).eq("is_active", True).execute()

    products = result.data or []
    print(f"[INFO] Total products to process: {len(products)}")

    if len(products) == 0:
        print("[WARN] No products found!")
        return

    print(f"\n[STEP 3] Generating embeddings for all {len(products)} products...\n")

    # 모든 상품 처리
    success_count = 0
    fail_count = 0

    for idx, product in enumerate(products, 1):
        product_id = product["id"]
        product_name = product["name"]
        thumbnail_url = product.get("thumbnail_url")

        if not thumbnail_url:
            print(f"[{idx}/{len(products)}] [SKIP] {product_name[:30]} - No image")
            fail_count += 1
            continue

        try:
            print(f"[{idx}/{len(products)}] [WORK] {product_name[:30]}...", end=" ")

            # 임베딩 생성
            embedding = embedding_service.generate_embedding(thumbnail_url)

            # DB 업데이트
            supabase.table("products").update({
                "image_embedding": embedding
            }).eq("id", product_id).execute()

            print(f"[OK] Done (dim={len(embedding)})")
            success_count += 1

        except Exception as e:
            print(f"[ERROR] Failed: {str(e)}")
            fail_count += 1

    print("\n" + "=" * 60)
    print("[COMPLETE] Regeneration Complete")
    print("=" * 60)
    print(f"[OK] Success: {success_count}")
    print(f"[ERROR] Failed: {fail_count}")
    print(f"[INFO] Total: {len(products)}")
    print("=" * 60)

if __name__ == "__main__":
    try:
        regenerate_embeddings()
    except KeyboardInterrupt:
        print("\n\n[WARN] Interrupted by user.")
    except Exception as e:
        print(f"\n\n[ERROR] Exception: {e}")
        import traceback
        traceback.print_exc()
