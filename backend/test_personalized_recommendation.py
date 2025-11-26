"""
개인화 추천 시스템 테스트 스크립트
실제 사용자 데이터로 추천 기능 검증
"""

import sys
from app.services.personalized_recommendation import (
    get_personalized_recommendations,
    PurchasePattern,
    format_personalized_recommendations_for_llm
)


def test_pattern_analysis(user_id: str):
    """구매 패턴 분석 테스트"""
    print("=" * 80)
    print(f"사용자 {user_id} 구매 패턴 분석")
    print("=" * 80)

    analyzer = PurchasePattern(user_id)
    pattern = analyzer.analyze()

    print(f"\n[구매 통계]")
    print(f"  - 총 주문 수: {pattern['total_orders']}회")
    print(f"  - 총 구매 금액: {pattern['total_spent']:,.0f}원")
    print(f"  - 평균 구매 가격: {pattern['avg_price']:,.0f}원")
    print(f"  - 구매 주기: {pattern['purchase_frequency']}")

    if pattern['last_purchase_date']:
        print(f"  - 마지막 구매일: {pattern['last_purchase_date']}")

    print(f"\n[선호 태그 Top 5]")
    for tag, count in pattern['favorite_tags'][:5]:
        print(f"  - {tag}: {count}회")

    print(f"\n[선호 가격대]")
    price_min, price_max = pattern['price_range']
    print(f"  - 최저: {price_min:,.0f}원 ~ 최고: {price_max:,.0f}원")

    if pattern['repurchase_products']:
        print(f"\n[재구매 상품]")
        for rp in pattern['repurchase_products']:
            print(f"  - {rp['product_name']}: {rp['purchase_count']}회 구매")

    print(f"\n[계절별 구매 패턴]")
    for season, count in pattern['seasonal_preference'].items():
        print(f"  - {season}: {count}회")

    return pattern


def test_personalized_recommendations(user_id: str):
    """개인화 추천 테스트"""
    print("\n" + "=" * 80)
    print(f"사용자 {user_id} 맞춤 추천")
    print("=" * 80)

    result = get_personalized_recommendations(user_id, limit=10)

    print(f"\n[추천 이유]")
    print(f"  {result['reason']}")

    print(f"\n[추천 상품 Top {len(result['recommendations'])}]")
    for i, product in enumerate(result['recommendations'][:5], 1):
        print(f"\n  {i}. {product['name']}")
        print(f"     가격: {product['price']:,}원")
        print(f"     평점: {product.get('rating', 0):.1f}/5.0 ({product.get('review_count', 0)}개 리뷰)")
        print(f"     판매량: {product.get('sale_count', 0)}개")

        if product.get('match_score'):
            print(f"     매칭 점수: {product['match_score']}/5")

        if product.get('tags'):
            print(f"     태그: {', '.join(product['tags'][:3])}")

    return result


def test_llm_format(user_id: str):
    """LLM 프롬프트 포맷 테스트"""
    print("\n" + "=" * 80)
    print(f"LLM 프롬프트 포맷 테스트")
    print("=" * 80)

    result = get_personalized_recommendations(user_id, limit=5)
    llm_text = format_personalized_recommendations_for_llm(result)

    print("\n[생성된 LLM 컨텍스트]")
    print("-" * 80)
    print(llm_text)
    print("-" * 80)

    return llm_text


if __name__ == "__main__":
    # 테스트할 사용자 ID (실제 주문이 있는 사용자)
    # 예시: test_user_id = "user_uuid_here"

    if len(sys.argv) > 1:
        test_user_id = sys.argv[1]
    else:
        print("사용법: python test_personalized_recommendation.py <user_id>")
        print("\n예시 테스트를 진행합니다 (더미 사용자)...")
        test_user_id = "dummy_user_123"

    try:
        # 1. 구매 패턴 분석
        pattern = test_pattern_analysis(test_user_id)

        if pattern['total_orders'] == 0:
            print("\n[경고] 구매 이력이 없는 사용자입니다.")
            print("실제 주문이 있는 사용자 ID를 입력해주세요.")
        else:
            # 2. 개인화 추천
            recommendations = test_personalized_recommendations(test_user_id)

            # 3. LLM 포맷 테스트
            llm_format = test_llm_format(test_user_id)

            print("\n[테스트 완료]")

    except Exception as e:
        print(f"\n[에러] {e}")
        import traceback
        traceback.print_exc()
