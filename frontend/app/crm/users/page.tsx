'use client';

import { useEffect, useState } from 'react';
import CRMLayout from '../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  user_type: 'buyer' | 'seller';
  is_active: boolean;
  created_at: string;
  vendor_status?: string | null;
}

interface UsersListResponse {
  users: User[];
  total: number;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      fetchUsers(adminToken);
    }
  }, []);

  // 필터링 로직
  useEffect(() => {
    let result = [...users];

    // 검색어 필터
    if (searchQuery) {
      result = result.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery))
      );
    }

    // 회원 유형 필터
    if (userTypeFilter !== 'all') {
      result = result.filter(user => user.user_type === userTypeFilter);
    }

    // 활성화 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter(user =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(result);
  }, [users, searchQuery, userTypeFilter, statusFilter]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('사용자 목록을 불러오는데 실패했습니다.');
      }

      const data: UsersListResponse = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (err: any) {
      setError(err.message || '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
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

  return (
    <CRMLayout>
      <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">회원 관리</h1>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">구매자 및 판매자 회원 관리</p>
      </section>

      {/* Controls Section */}
      <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              전체 회원
            </h2>
            <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
              {filteredUsers.length}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 md:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 이메일, 전화번호로 검색"
              className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setUserTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                userTypeFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setUserTypeFilter('buyer')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                userTypeFilter === 'buyer'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              구매자
            </button>
            <button
              onClick={() => setUserTypeFilter('seller')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                userTypeFilter === 'seller'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              판매자
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              전체 상태
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              활성
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'inactive'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              비활성
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">전체 회원</p>
          <p className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white">{users.length}</p>
        </div>
        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">구매자</p>
          <p className="mt-1.5 text-xl font-bold text-blue-600 dark:text-blue-400">
            {users.filter(u => u.user_type === 'buyer').length}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">판매자</p>
          <p className="mt-1.5 text-xl font-bold text-purple-600 dark:text-purple-400">
            {users.filter(u => u.user_type === 'seller').length}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">활성 회원</p>
          <p className="mt-1.5 text-xl font-bold text-green-600 dark:text-green-400">
            {users.filter(u => u.is_active).length}
          </p>
        </div>
      </section>

      {/* Users Table */}
      <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  회원 정보
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  이메일
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  전화번호
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  회원 유형
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  상태
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  가입일
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    {error ? error : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900 dark:text-white">
                            {user.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="text-xs text-gray-900 dark:text-white">{user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="text-xs text-gray-900 dark:text-white">
                        {user.phone || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getUserTypeBadge(user.user_type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </CRMLayout>
  );
}
