'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Inquiry {
  id: string;
  user_id: string;
  user_name: string;
  user_type: string;
  title: string;
  content: string;
  category: string;
  status: string;
  admin_reply?: string;
  admin_name?: string;
  replied_at?: string;
  created_at: string;
}

export default function CRMInquiriesPage() {
  const searchParams = useSearchParams();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  // URL 파라미터에서 id 또는 status를 읽어서 필터 설정
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const idParam = searchParams.get('id');

    if (statusParam === 'pending' || statusParam === 'answered') {
      setFilter(statusParam);
    }

    // id 파라미터가 있으면 해당 문의를 자동으로 펼치기
    if (idParam && inquiries.length > 0) {
      const inquiry = inquiries.find(inq => inq.id === idParam);
      if (inquiry) {
        setSelectedInquiry(inquiry);
        // 해당 문의가 있는 필터로 변경
        if (inquiry.status === 'pending' || inquiry.status === 'answered') {
          setFilter(inquiry.status);
        }
      }
    }
  }, [searchParams, inquiries]);

  const fetchInquiries = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (inquiryId: string) => {
    if (!replyText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ admin_reply: replyText })
      });

      if (response.ok) {
        alert('답변이 등록되었습니다.');
        setReplyText('');
        setSelectedInquiry(null);
        fetchInquiries();
      } else {
        const error = await response.json();
        alert(error.detail || '답변 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('답변 등록 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'answered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter === 'all') return true;
    return inquiry.status === filter;
  });

  return (
    <CRMLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">건의 관리</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            고객 문의를 확인하고 답변하세요
          </p>
        </div>

        {/* 필터 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition ${
              filter === 'all'
                ? 'border border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            전체 ({inquiries.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium transition ${
              filter === 'pending'
                ? 'border border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            답변 대기 ({inquiries.filter(i => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-4 py-2 text-sm font-medium transition ${
              filter === 'answered'
                ? 'border border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            답변 완료 ({inquiries.filter(i => i.status === 'answered').length})
          </button>
        </div>

        {/* 문의 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">문의가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="cursor-pointer p-4 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setSelectedInquiry(selectedInquiry?.id === inquiry.id ? null : inquiry)}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {inquiry.category}
                      </span>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {inquiry.title}
                      </h3>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {getStatusText(inquiry.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{inquiry.user_name}</span>
                    <span>·</span>
                    <span className={inquiry.user_type === 'seller' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}>
                      {inquiry.user_type === 'seller' ? '판매자' : '구매자'}
                    </span>
                    <span>·</span>
                    <span>{formatDate(inquiry.created_at)}</span>
                  </div>
                </div>

                {/* 문의 상세 */}
                {selectedInquiry?.id === inquiry.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">문의 내용</p>
                      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{inquiry.content}</p>
                      </div>
                    </div>

                    {inquiry.admin_reply ? (
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          답변 ({inquiry.admin_name || '관리자'})
                        </p>
                        <div className="rounded border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{inquiry.admin_reply}</p>
                          {inquiry.replied_at && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDate(inquiry.replied_at)}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">답변 작성</p>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="답변 내용을 입력하세요..."
                          rows={5}
                          className="w-full border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedInquiry(null);
                              setReplyText('');
                            }}
                            className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleReply(inquiry.id)}
                            className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          >
                            답변 등록
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
