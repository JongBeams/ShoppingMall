'use client';

export default function InquiryManagement() {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">상품 문의 관리</h3>

      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</span>
                <span className="bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  답변 대기
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">2025.01.15</span>
            </div>
            <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              문의: 유기농 인증서가 있나요?
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="답변 입력"
                className="flex-1 border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                답변 등록
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
