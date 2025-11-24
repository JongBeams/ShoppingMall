"""
기존 리뷰 데이터를 기반으로 products 테이블의 review_count와 rating 동기화
"""

from app.services.supabase import get_supabase_admin_client

supabase = get_supabase_admin_client()

print("=== 리뷰 통계 동기화 시작 ===\n")

# 1. 모든 상품 조회
products = supabase.table('products').select('id, name').execute()

print(f"총 {len(products.data)}개 상품 확인 중...")

updated_count = 0

for product in products.data:
    product_id = product['id']
    product_name = product['name']

    # 해당 상품의 모든 리뷰 조회
    reviews = supabase.table('reviews').select('rating').eq('product_id', product_id).execute()

    if reviews.data:
        total_reviews = len(reviews.data)
        avg_rating = sum(r['rating'] for r in reviews.data) / total_reviews
        avg_rating_rounded = round(avg_rating, 1)

        # 상품 정보 업데이트
        supabase.table('products').update({
            'review_count': total_reviews,
            'rating': avg_rating_rounded
        }).eq('id', product_id).execute()

        print(f"✅ {product_name}: {total_reviews}개 리뷰, 평균 {avg_rating_rounded}/5.0")
        updated_count += 1

print(f"\n=== 완료: {updated_count}개 상품 업데이트 ===")
