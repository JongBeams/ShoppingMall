'use client';

export default function Promotions() {
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">프로모션 / 할인 관리</h3>
        <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          + 프로모션 생성
        </button>
      </div>

      {/* 진행 중인 프로모션 */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">진행 중인 프로모션</h4>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-gray-900 dark:text-white">1월 신년 특가 세일</h5>
                  <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                    진행중
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">D-5</span>
              </div>
              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                모든 상품 20% 할인 (최대 10,000원)
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>기간: 2025.01.10 ~ 2025.01.20</span>
                <div className="flex gap-2">
                  <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">수정</button>
                  <button className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">중지</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 예정된 프로모션 */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">예정된 프로모션</h4>
        <div className="space-y-3">
          <div className="border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h5 className="font-medium text-gray-900 dark:text-white">설날 특별 할인</h5>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  대기중
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">D+10</span>
            </div>
            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
              전 상품 15% 할인
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>기간: 2025.01.25 ~ 2025.02.02</span>
              <div className="flex gap-2">
                <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">수정</button>
                <button className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
