'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CRMLayout from '../../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  user_type: 'buyer' | 'seller';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  vendor_status?: string | null;
  address?: string | null;
  business_number?: string | null;
  store_name?: string | null;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    if (params.id) {
      fetchUser(params.id as string, adminToken);
    }
  }, [params.id, router]);

  const fetchUser = async (id: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('회원 조회 실패');

      const data = await response.json();
      setUser(data);
      setEditEmail(data.email);
      setEditPhone(data.phone || '');
    } catch (error) {
      console.error('회원 조회 실패:', error);
      alert('회원을 찾을 수 없습니다.');
      router.push('/crm/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const action = user.is_active ? '비활성화' : '활성화';
    if (!confirm(`정말 ${action}하시겠습니까?`)) return;

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (!response.ok) throw new Error(`${action} 실패`);

      alert(`${action}되었습니다.`);
      setUser({ ...user, is_active: !user.is_active });
    } catch (error) {
      console.error(`${action} 실패:`, error);
      alert(`${action}에 실패했습니다.`);
    }
  };

  const handleStartEdit = () => {
    if (user) {
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
    }
    setIsEditing(false);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setEditPhone(formatted);
  };

  const handleSaveEdit = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editEmail,
          phone: editPhone || null
        }),
      });

      if (!response.ok) throw new Error('수정 실패');

      alert('수정되었습니다.');
      setUser({ ...user, email: editEmail, phone: editPhone || null });
      setIsEditing(false);
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
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

  const getUserTypeBadge = (userType: string) => {
    if (userType === 'seller') {
      return (
        <span className="inline-block bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          판매자
        </span>
      );
    }
    return (
      <span className="inline-block bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
        구매자
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-block bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          활성
        </span>
      );
    }
    return (
      <span className="inline-block bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        비활성
      </span>
    );
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

  if (!user) {
    return null;
  }

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/crm/users"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            목록으로
          </Link>
        </div>

        {/* User Content */}
        <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {/* Title */}
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  {user.full_name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
                  {getUserTypeBadge(user.user_type)}
                  {getStatusBadge(user.is_active)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">기본 정보</h3>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 transition"
                >
                  수정
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">이메일</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                )}
              </div>
              <div className="border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">전화번호</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    className="mt-1 w-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{user.phone || '-'}</p>
                )}
              </div>
              <div className="border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">회원 유형</p>
                <p className="mt-1">{getUserTypeBadge(user.user_type)}</p>
              </div>
              <div className="border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">계정 상태</p>
                <p className="mt-1">{getStatusBadge(user.is_active)}</p>
              </div>
              <div className="border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">가입일</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
              </div>
              {user.updated_at && (
                <div className="border border-gray-200 p-4 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">최근 수정일</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatDate(user.updated_at)}</p>
                </div>
              )}
            </div>

            {/* Edit buttons */}
            {isEditing && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 transition disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}

            {/* Seller Info */}
            {user.user_type === 'seller' && (
              <>
                <h3 className="mb-4 mt-6 text-sm font-bold text-gray-900 dark:text-white">판매자 정보</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">스토어명</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{user.store_name || '-'}</p>
                  </div>
                  <div className="border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">사업자등록번호</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{user.business_number || '-'}</p>
                  </div>
                  <div className="border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">판매자 상태</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{user.vendor_status || '-'}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
            <Link
              href="/crm/users"
              className="border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              목록
            </Link>
            <button
              onClick={handleToggleStatus}
              className={`px-6 py-2 text-sm font-medium text-white ${
                user.is_active
                  ? 'border border-red-600 bg-red-600 hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600'
                  : 'border border-green-600 bg-green-600 hover:bg-green-700 dark:border-green-500 dark:bg-green-500 dark:hover:bg-green-600'
              }`}
            >
              {user.is_active ? '비활성화' : '활성화'}
            </button>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
