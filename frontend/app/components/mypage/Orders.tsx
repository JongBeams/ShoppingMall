'use client';

import { useState } from 'react';
import { CartItem as CartItemType } from '@/app/types';

interface OrdersProps {
  user: any;
  dummyOrders: CartItemType[];
}

export default function Orders({ user, dummyOrders }: OrdersProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const toggleDeliveryInfo = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };
  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">
          {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user?.user_type === 'seller'
            ? '고객으로부터 받은 주문 요청을 확인하고 승인/거부할 수 있습니다.'
            : '주문하신 상품의 주문 내역과 배송 현황을 확인할 수 있습니다.'}
        </p>
      </div>

      {user?.user_type === 'seller' ? (
        /* 판매자용 - 주문 요청 목록 */
        <div className="space-y-3">
          {/* 주문 요청 1 */}
          <div className="border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001234</span>
                <span className="ml-4 text-xs text-gray-600 dark:text-gray-400">2025.01.13</span>
              </div>
              <span className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                승인 대기
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</h4>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">수량: 3개</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">구매자: 김**</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900 dark:text-white">₩45,000</p>
                <button className="mt-2 border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                  승인
                </button>
              </div>
            </div>
          </div>

          {/* 주문 요청 2 */}
          <div className="border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001198</span>
                <span className="ml-4 text-xs text-gray-600 dark:text-gray-400">2025.01.12</span>
              </div>
              <span className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                승인 대기
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-900 dark:text-white">GAP 인증 유기농 상추 500g</h4>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">수량: 5개</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">구매자: 이**</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900 dark:text-white">₩62,500</p>
                <button className="mt-2 border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                  승인
                </button>
              </div>
            </div>
          </div>

          {/* 주문 요청 3 - 이미 승인됨 */}
          <div className="border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001165</span>
                <span className="ml-4 text-xs text-gray-600 dark:text-gray-400">2025.01.11</span>
              </div>
              <span className="border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                승인 완료
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-900 dark:text-white">무농약 친환경 딸기 2kg</h4>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">수량: 2개</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">구매자: 박**</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900 dark:text-white">₩89,600</p>
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
          <div className="space-y-3">
            {dummyOrders.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-700"
              >
                {/* 상품 이미지 */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                        {item.product.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-medium ${
                        item.status === 'delivered'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : item.status === 'shipping'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : item.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {item.status === 'delivered' ? '배송완료' : item.status === 'shipping' ? '배송중' : item.status === 'cancelled' ? '취소됨' : '준비중'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {item.product.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      카테고리: {item.product.category}
                    </p>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          수량: {item.quantity}개
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {(item.product.price * item.quantity).toLocaleString()}원
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleDeliveryInfo(item.product.id)}
                          className="border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          배송 조회
                        </button>
                        {item.status === 'delivered' && (
                          <button
                            onClick={() => window.location.href = `/reviews/write?productId=${item.product.id}`}
                            className="border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          >
                            리뷰 작성
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 배송 조회 정보 */}
                    {expandedOrders.has(item.product.id) && (
                      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                        <h5 className="mb-2 text-xs font-bold text-gray-900 dark:text-white">
                          배송 정보
                        </h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">주문번호</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ORD-2025-{String(item.product.id).padStart(6, '0')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">배송 상태</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              배송 중
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">택배사</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              CJ대한통운
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">송장번호</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {Math.floor(100000000000 + Math.random() * 900000000000)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">예상 도착일</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>

                        {/* 배송 추적 단계 */}
                        <div className="mt-3">
                          <h6 className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                            배송 추적
                          </h6>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="mt-1 h-2 w-2 flex-shrink-0 bg-blue-600"></div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  배송 중
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  상품이 배송 중입니다. ({new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString('ko-KR')})
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="mt-1 h-2 w-2 flex-shrink-0 bg-gray-400 dark:bg-gray-600"></div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  상품 발송
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  상품이 발송되었습니다. ({new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('ko-KR')})
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="mt-1 h-2 w-2 flex-shrink-0 bg-gray-400 dark:bg-gray-600"></div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  상품 준비 중
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  판매자가 상품을 준비하고 있습니다. ({new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString('ko-KR')})
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 총 주문 금액 */}
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="flex justify-between text-xs font-bold text-gray-900 dark:text-white">
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
