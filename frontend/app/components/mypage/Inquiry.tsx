export default function Inquiry() {
  return (
    <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-5 dark:border-gray-800">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">1:1 문의</h2>
      </div>

      <div className="p-5">
        {/* 문의 목록 */}
        <div className="mb-5 space-y-3">
          {[
            {
              id: 1,
              title: '배송 관련 문의',
              status: '답변 완료',
              date: '2025.01.15',
              statusColor: 'text-green-600 dark:text-green-400'
            },
            {
              id: 2,
              title: '제품 교환 문의',
              status: '답변 대기',
              date: '2025.01.14',
              statusColor: 'text-orange-600 dark:text-orange-400'
            },
            {
              id: 3,
              title: '결제 오류 문의',
              status: '답변 완료',
              date: '2025.01.10',
              statusColor: 'text-green-600 dark:text-green-400'
            },
          ].map((inquiry) => (
            <div
              key={inquiry.id}
              className="border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800"
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {inquiry.title}
                </h3>
                <span className={`text-xs font-medium ${inquiry.statusColor}`}>
                  {inquiry.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{inquiry.date}</p>
            </div>
          ))}
        </div>

        {/* 새 문의 작성 버튼 */}
        <button className="w-full border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
          새 문의 작성
        </button>
      </div>
    </div>
  );
}
