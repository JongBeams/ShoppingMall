'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  admin_reply?: string;
  admin_name?: string;
  replied_at?: string;
  created_at: string;
}

export default function Inquiry() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '배송'
  });

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/inquiries/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('문의가 등록되었습니다.');
        setShowForm(false);
        setFormData({ title: '', content: '', category: '배송' });
        fetchInquiries();
      } else {
        const error = await response.json();
        alert(error.detail || '문의 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create inquiry:', error);
      alert('문의 등록 중 오류가 발생했습니다.');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '답변 대기';
      case 'answered': return '답변 완료';
      case 'closed': return '종료';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 dark:text-orange-400';
      case 'answered': return 'text-green-600 dark:text-green-400';
      case 'closed': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* 헤더 & 새 문의 작성 버튼 */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">건의하기</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {showForm ? '취소' : '+ 새 건의 작성'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          서비스 개선을 위한 건의사항이나 문의사항을 남겨주세요. 관리자가 확인 후 답변드립니다.
        </p>
      </div>

      {/* 문의 작성 폼 */}
      {showForm && (
        <div className="mb-3 border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-3 text-xs font-bold text-gray-900 dark:text-white">새 건의 작성</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="배송">배송</option>
                <option value="결제">결제</option>
                <option value="제품">제품</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="문의 제목을 입력하세요"
                className="w-full border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                내용
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="문의 내용을 상세히 입력해주세요"
                rows={6}
                className="w-full border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 bg-white py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 border border-gray-900 bg-gray-900 py-2 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                문의 등록
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 문의 목록 */}
      <div className="space-y-2">
        {inquiries.length > 0 ? (
          inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="border border-gray-200 dark:border-gray-700"
            >
              <div
                className="cursor-pointer p-3 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setSelectedInquiry(selectedInquiry?.id === inquiry.id ? null : inquiry)}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {inquiry.category}
                    </span>
                    <h3 className="text-xs font-medium text-gray-900 dark:text-white">
                      {inquiry.title}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                    {getStatusText(inquiry.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(inquiry.created_at)}</p>
              </div>

              {/* 문의 상세 (펼쳤을 때) */}
              {selectedInquiry?.id === inquiry.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-3">
                    <p className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-300">문의 내용</p>
                    <div className="border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{inquiry.content}</p>
                    </div>
                  </div>
                  {inquiry.admin_reply ? (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        답변 ({inquiry.admin_name || '관리자'})
                      </p>
                      <div className="border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950">
                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{inquiry.admin_reply}</p>
                        {inquiry.replied_at && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDate(inquiry.replied_at)}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                      관리자 답변을 기다리고 있습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">등록된 문의가 없습니다</p>
            <p className="mt-1 text-xs text-gray-400">궁금한 사항이 있으시면 문의를 남겨주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
