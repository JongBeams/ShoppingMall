export default function Sales() {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">판매 내역</h3>
        <div className="flex gap-2">
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            필터
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            다운로드
          </button>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">총 판매액</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₩2,450,000</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">판매 건수</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">37건</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 판매가</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₩66,216</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">반품/교환</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">2건</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">상품명</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">주문번호</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">구매자</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">판매일</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">수량</th>
              <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">판매액</th>
              <th className="pb-3 text-center text-sm font-semibold text-gray-900 dark:text-white">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: TOM-001</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001234</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">김**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.12</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">3</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩45,000</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  배송완료
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">GAP 인증 유기농 상추 500g</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: LET-002</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001198</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">이**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.11</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">5</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩62,500</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  배송중
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">무농약 친환경 딸기 2kg</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: STR-003</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001165</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">박**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.10</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩89,600</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  배송완료
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">국내산 유기농 쌀 10kg</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: RIC-004</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001132</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">최**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.09</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">1</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩58,000</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  배송준비
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">제철 유기농 배추 1통</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: CAB-005</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001089</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">정**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.08</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">4</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩52,000</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  배송완료
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          총 <span className="font-medium text-gray-900 dark:text-white">37</span>건 중 1-5 표시
        </p>
        <div className="flex gap-2">
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" disabled>
            이전
          </button>
          <button className="border border-gray-300 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900">
            1
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            2
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            3
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
