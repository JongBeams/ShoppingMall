'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

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

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 관리자 로그인 체크
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    fetchNotices();
  }, [router]);

  const fetchNotices = async (search?: string) => {
    try {
      const url = new URL(`${API_BASE_URL}/notices`);
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('공지사항 조회 실패');

      const data = await response.json();
      setNotices(data);
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices(searchQuery);
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');

      alert('삭제되었습니다.');
      fetchNotices();
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

  return (
    <CRMLayout>
      <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">공지사항 관리</h1>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">공지사항 작성 및 관리</p>
      </section>

      {/* Controls Section */}
      <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              전체 공지사항
            </h2>
            <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
              {notices.length}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 md:max-w-md">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목 또는 내용으로 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
              <button
                type="submit"
                className="border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                검색
              </button>
            </form>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Link
              href="/crm/notices/new"
              className="border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              + 새 공지사항
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>중요 공지: {notices.filter(n => n.is_important).length}개</span>
            <span>·</span>
            <span>총 조회: {notices.reduce((sum, n) => sum + n.views, 0).toLocaleString()}회</span>
          </div>
        </div>
      </section>

      {/* Notice List */}
      <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4">
          {notices.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              공지사항이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">제목</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">작성자</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">작성일</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">조회수</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">관리</th>
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
                            <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                              중요
                            </span>
                          )}
                          <Link
                            href={`/crm/notices/${notice.id}`}
                            className="text-xs font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                          >
                            {notice.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {notice.author_name}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(notice.created_at)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {notice.views}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/crm/notices/${notice.id}/edit`}
                            className="border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleDelete(notice.id)}
                            className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      </div>
    </CRMLayout>
  );
}
