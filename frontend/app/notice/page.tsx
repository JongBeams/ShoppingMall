import Link from 'next/link';

interface Notice {
  id: number;
  title: string;
  date: string;
  category: string;
}

export default function NoticePage() {
  const notices: Notice[] = [
    {
      id: 1,
      title: '2025년 설날 배송 및 고객센터 운영 안내',
      date: '2025.01.20',
      category: '배송',
    },
    {
      id: 2,
      title: '개인정보 처리방침 변경 안내',
      date: '2025.01.15',
      category: '정책',
    },
    {
      id: 3,
      title: '신규 결제 수단 추가 안내',
      date: '2025.01.10',
      category: '서비스',
    },
    {
      id: 4,
      title: '회원 등급제 도입 안내',
      date: '2025.01.05',
      category: '이벤트',
    },
    {
      id: 5,
      title: '시스템 점검 안내',
      date: '2024.12.28',
      category: '시스템',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">공지사항</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            서비스 관련 새로운 소식을 확인하세요
          </p>
        </div>

        {/* Notice List */}
        <div className="space-y-2">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/notice/${notice.id}`}
              className="block"
            >
              <div className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        notice.category === '배송' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        notice.category === '정책' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        notice.category === '서비스' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        notice.category === '이벤트' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {notice.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{notice.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {notice.title}
                    </h3>
                  </div>
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State (if no notices) */}
        {notices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">등록된 공지사항이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}