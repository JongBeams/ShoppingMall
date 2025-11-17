import { CartItem as CartItemType } from '@/app/types';

interface OrdersProps {
  user: any;
  dummyOrders: CartItemType[];
}

export default function Orders({ user, dummyOrders }: OrdersProps) {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
        {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
      </h3>

      {user?.user_type === 'seller' ? (
        /* 판매자용 - 주문 요청 목록 */
        <div className="space-y-4">
          {/* 주문 요청 1 */}
          <div className="border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001234</span>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">2025.01.13</span>
              </div>
              <span className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                승인 대기
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">수량: 3개</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">구매자: 김**</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">₩45,000</p>
                <button className="mt-2 border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                  승인
                </button>
              </div>
            </div>
          </div>

          {/* 주문 요청 2 */}
          <div className="border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001198</span>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">2025.01.12</span>
              </div>
              <span className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                승인 대기
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">GAP 인증 유기농 상추 500g</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">수량: 5개</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">구매자: 이**</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">₩62,500</p>
                <button className="mt-2 border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                  승인
                </button>
              </div>
            </div>
          </div>

          {/* 주문 요청 3 - 이미 승인됨 */}
          <div className="border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001165</span>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">2025.01.11</span>
              </div>
              <span className="border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                승인 완료
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">무농약 친환경 딸기 2kg</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">수량: 2개</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">구매자: 박**</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">₩89,600</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 일반 사용자용 - 주문 내역 */
        dummyOrders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">주문 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dummyOrders.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 border-b border-gray-100 pb-4 last:border-b-0 dark:border-gray-700"
              >
                {/* 상품 이미지 */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      {item.product.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {item.product.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      카테고리: {item.product.category}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        수량: {item.quantity}개
                      </span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        {(item.product.price * item.quantity).toLocaleString()}원
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button className="border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        배송 조회
                      </button>
                      <button
                        onClick={() => window.location.href = '/mypage?tab=reviews'}
                        className="border border-gray-900 bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                      >
                        리뷰 작성
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 총 주문 금액 */}
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>총 주문 금액</span>
                <span>
                  {dummyOrders.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                  ).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
