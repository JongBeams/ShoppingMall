'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
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

export default function NoticeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notices/${id}`);
        if (!response.ok) throw new Error('공지사항을 찾을 수 없습니다.');
        const data = await response.json();
        setNotice(data);
      } catch (error) {
        console.error('공지사항 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchNotice();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              공지사항을 찾을 수 없습니다
            </h1>
            <Link
              href="/notice"
              className="mt-4 inline-block border border-gray-900 bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
        <Link
          href="/notice"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          목록으로
        </Link>
      </div>

      {/* Notice Info */}
      <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700">
        <div className="mb-3 flex items-center gap-2">
          {notice.is_important && (
            <span className="whitespace-nowrap rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              중요
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notice.created_at)}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">조회 {notice.views}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">작성자: {notice.author_name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{notice.title}</h1>
      </div>

      {/* Content */}
      <div className="mb-6 min-h-[400px]">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">
          {notice.content}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
        <Link
          href="/notice"
          className="border border-gray-900 bg-gray-900 px-6 py-2 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          목록
        </Link>
      </div>
    </div>
  );
}