import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* 회사 정보 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">회사 정보</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  회사소개
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  고객센터
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  채용
                </Link>
              </li>
            </ul>
          </div>

          {/* 쇼핑 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">쇼핑</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  전체상품
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  장바구니
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  주문내역
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">고객지원</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  배송안내
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  반품/교환
                </Link>
              </li>
            </ul>
          </div>

          {/* 이용약관 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">약관 및 정책</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; 2025 ShopLogo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
