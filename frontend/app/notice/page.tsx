'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notices?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setNotices(data);
        }
      } catch (error) {
        console.error('공지사항 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <section className="mb-4 border-b border-gray-200 bg-white pb-4 dark:border-gray-700 dark:bg-gray-800">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">공지사항</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">서비스 관련 새로운 소식을 확인하세요</p>
        </section>

        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
          </div>
        )}

        {/* Notice List */}
        {!isLoading && (
          <section className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="p-4">
              {notices.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">제목</th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">작성자</th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">작성일</th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">조회수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notices.map((notice) => (
                        <tr
                          key={notice.id}
                          className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {notice.is_important && (
                                <span className="whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                                  중요
                                </span>
                              )}
                              <Link
                                href={`/notice/${notice.id}`}
                                className="text-xs font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                              >
                                {notice.title}
                              </Link>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {notice.author_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(notice.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {notice.views}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
