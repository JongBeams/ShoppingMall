'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export default function FAQsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 관리자 로그인 체크
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    fetchFaqs();
  }, [router]);

  const fetchFaqs = async (search?: string) => {
    try {
      const url = new URL(`${API_BASE_URL}/faqs`);
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('FAQ 조회 실패');

      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error('FAQ 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFaqs(searchQuery);
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/faqs/${faqId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');

      alert('삭제되었습니다.');
      fetchFaqs();
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">FAQ 관리</h1>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">자주 묻는 질문 작성 및 관리</p>
      </section>

      {/* Controls Section */}
      <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              전체 FAQ
            </h2>
            <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
              {faqs.length}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 md:max-w-md">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="질문 또는 답변으로 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
              <button
                type="submit"
                className="whitespace-nowrap border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
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
              href="/crm/faq/new"
              className="border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              + 새 FAQ
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>공개: {faqs.filter(f => f.is_published).length}개</span>
            <span>·</span>
            <span>총 조회: {faqs.reduce((sum, f) => sum + f.views, 0).toLocaleString()}회</span>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4">
          {faqs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              FAQ가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">질문</th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">카테고리</th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">작성자</th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">작성일</th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">조회수</th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">상태</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr
                      key={faq.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-3 py-3">
                        <Link
                          href={`/crm/faq/${faq.id}`}
                          className="text-xs font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                        >
                          {faq.question}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {faq.category || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {faq.author_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(faq.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {faq.views}
                      </td>
                      <td className="px-3 py-3">
                        {faq.is_published ? (
                          <span className="whitespace-nowrap inline-block bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            공개
                          </span>
                        ) : (
                          <span className="whitespace-nowrap inline-block bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            비공개
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/crm/faq/${faq.id}/edit`}
                            className="whitespace-nowrap border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="whitespace-nowrap border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
