'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CRMLayout from '../../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function NewNoticePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_important: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('공지사항 작성 실패');
      }

      alert('공지사항이 작성되었습니다.');
      router.push('/crm/notices');
    } catch (error) {
      console.error('공지사항 작성 실패:', error);
      alert('공지사항 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-6">
            <div className="space-y-6">
              {/* 중요 공지 체크박스 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_important"
                  checked={formData.is_important}
                  onChange={(e) => setFormData({ ...formData, is_important: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="is_important" className="text-sm font-medium text-gray-900 dark:text-white">
                  중요 공지사항으로 표시
                </label>
              </div>

              {/* 제목 */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  제목 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              {/* 내용 */}
              <div>
                <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  내용 <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="content"
                  required
                  rows={15}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                  placeholder="공지사항 내용을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
            <Link
              href="/crm/notices"
              className="border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-gray-900 bg-gray-900 px-6 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {isSubmitting ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
