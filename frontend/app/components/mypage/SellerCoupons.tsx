'use client';

export default function SellerCoupons() {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">쿠폰 발행</h3>
        <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          + 쿠폰 발행
        </button>
      </div>

      {/* 쿠폰 발행 폼 */}
      <div className="mb-6 space-y-4 border border-gray-200 p-4 dark:border-gray-700">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">새 쿠폰 발행</h5>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">쿠폰 이름</label>
            <input
              type="text"
              placeholder="신규 회원 10% 할인"
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">할인 유형</label>
            <select className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option>정률 할인 (%)</option>
              <option>정액 할인 (원)</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">할인 금액/율</label>
            <input
              type="number"
              placeholder="10"
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">최소 주문 금액</label>
            <input
              type="number"
              placeholder="30000"
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">발행 수량</label>
            <input
              type="number"
              placeholder="100"
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">유효 기간 (일)</label>
            <input
              type="number"
              placeholder="30"
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <button className="w-full border border-gray-900 bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          쿠폰 발행
        </button>
      </div>

      {/* 발행된 쿠폰 목록 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">발행한 쿠폰</h4>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">신규 회원 10% 할인</h5>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                할인: 10% · 최소 주문: ₩30,000 · 유효기간: 30일
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                발행: 100개 · 사용: 23개 · 남은 수량: 77개
              </p>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">중지</button>
              <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
