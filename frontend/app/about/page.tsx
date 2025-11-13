export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        회사 소개
      </h1>

      <div className="space-y-6 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
            ShopLogo
          </h2>
          <p>
            ShopLogo는 고객에게 최고의 쇼핑 경험을 제공하는 것을 목표로 하는 온라인 쇼핑몰입니다.
            심플하고 세련된 디자인과 사용하기 편리한 인터페이스로 누구나 쉽게 원하는 상품을 찾을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
            우리의 비전
          </h2>
          <p>
            고객 만족을 최우선으로 생각하며, 품질 좋은 상품을 합리적인 가격에 제공하고자 합니다.
            빠른 배송과 안전한 결제 시스템을 통해 신뢰할 수 있는 쇼핑 환경을 만들어갑니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
            연락처
          </h2>
          <div className="space-y-1">
            <p>이메일: contact@shoplogo.com</p>
            <p>전화: 1234-5678</p>
            <p>주소: 서울특별시 강남구</p>
          </div>
        </section>
      </div>
    </div>
  );
}
