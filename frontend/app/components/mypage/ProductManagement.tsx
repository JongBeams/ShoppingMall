'use client';

export default function ProductManagement() {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">상품 관리</h3>
        <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          + 상품 등록
        </button>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 border border-gray-200 p-4 dark:border-gray-700">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
              <div className="flex h-full items-center justify-center text-gray-400">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</h5>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">재고: 50개 · 가격: ₩15,000</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">카테고리: 농산물</p>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">수정</button>
              <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
