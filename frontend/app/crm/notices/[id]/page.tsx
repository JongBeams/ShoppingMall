'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CRMLayout from '../../components/CRMLayout';

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
  const router = useRouter();
  const params = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // 이미 fetch했으면 중복 실행 방지
    if (hasFetched.current) return;

    // 관리자 로그인 체크
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    if (params.id) {
      hasFetched.current = true;
      fetchNotice(params.id as string);
    }
  }, [params.id, router]);

  const fetchNotice = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${id}`);
      if (!response.ok) throw new Error('공지사항 조회 실패');

      const data = await response.json();
      setNotice(data);
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      alert('공지사항을 찾을 수 없습니다.');
      router.push('/crm/notices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/notices/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');

      alert('삭제되었습니다.');
      router.push('/crm/notices');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
        </div>
      </CRMLayout>
    );
  }

  if (!notice) {
    return null;
  }

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/crm/notices"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            목록으로
          </Link>
        </div>

        {/* Notice Content */}
        <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {/* Title */}
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-2">
              {notice.is_important && (
                <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white dark:bg-red-500">
                  중요
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{notice.title}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>작성자: {notice.author_name}</span>
              <span>·</span>
              <span>작성일: {formatDate(notice.created_at)}</span>
              <span>·</span>
              <span>조회: {notice.views}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
              {notice.content}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
            <Link
              href="/crm/notices"
              className="border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              목록
            </Link>
            <Link
              href={`/crm/notices/${notice.id}/edit`}
              className="border border-gray-900 bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              className="border border-red-600 bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
