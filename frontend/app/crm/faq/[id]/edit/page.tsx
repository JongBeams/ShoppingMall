'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import CRMLayout from '../../../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_published: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 관리자 로그인 체크
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    if (params.id) {
      fetchFaq(params.id as string);
    }
  }, [params.id, router]);

  const fetchFaq = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faqs/${id}`);
      if (!response.ok) throw new Error('FAQ 조회 실패');

      const data = await response.json();
      setFormData({
        question: data.question,
        answer: data.answer,
        category: data.category || '',
        is_published: data.is_published,
      });
    } catch (error) {
      console.error('FAQ 조회 실패:', error);
      alert('FAQ를 찾을 수 없습니다.');
      router.push('/crm/faq');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        alert('로그인이 필요합니다.');
        router.push('/crm/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/faqs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...formData,
          category: formData.category || null,
        }),
      });

      if (!response.ok) {
        throw new Error('FAQ 수정 실패');
      }

      alert('FAQ가 수정되었습니다.');
      router.push(`/crm/faq/${params.id}`);
    } catch (error) {
      console.error('FAQ 수정 실패:', error);
      alert('FAQ 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/crm/faq/${params.id}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            취소
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-6">
            <div className="space-y-6">
              {/* 공개 여부 체크박스 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-900 dark:text-white">
                  공개 FAQ
                </label>
              </div>

              {/* 카테고리 */}
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  카테고리
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                  placeholder="예: 결제, 배송, 반품 등"
                />
              </div>

              {/* 질문 */}
              <div>
                <label htmlFor="question" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  질문 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="question"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                  placeholder="자주 묻는 질문을 입력하세요"
                />
              </div>

              {/* 답변 */}
              <div>
                <label htmlFor="answer" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  답변 <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="answer"
                  required
                  rows={15}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                  placeholder="답변 내용을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
            <Link
              href={`/crm/faq/${params.id}`}
              className="border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-gray-900 bg-gray-900 px-6 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
