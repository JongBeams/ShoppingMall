'use client';

export default function DeliveryManagement() {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">배송 관리</h3>

      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">주문번호: ORD-2025-{String(i).padStart(6, '0')}</span>
                <span className="ml-3 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  배송 대기
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">2025.01.15</span>
            </div>
            <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              상품: 프리미엄 유기농 토마토 1kg x 3개
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="송장번호 입력"
                className="flex-1 border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <select className="border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option>CJ대한통운</option>
                <option>우체국택배</option>
                <option>한진택배</option>
                <option>로젠택배</option>
              </select>
              <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                발송 처리
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
