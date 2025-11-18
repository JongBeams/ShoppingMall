'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function CRMPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    // 관리자 로그인 체크
    const adminToken = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_user');

    if (!adminToken || !adminData) {
      // 관리자 로그인 페이지로 리다이렉트
      router.push('/crm/login');
      return;
    }

    try {
      const admin = JSON.parse(adminData);
      setAdminUser(admin);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to parse admin data:', e);
      router.push('/crm/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/crm/login');
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && !isLoading) {
      fetchUsers();
    }
  }, [activeTab, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800" style={{ minHeight: 'calc(100vh - 73px)' }}>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`block w-full text-left border px-4 py-2 text-sm font-medium ${
                    activeTab === 'dashboard'
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  대시보드
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`block w-full text-left border px-4 py-2 text-sm font-medium ${
                    activeTab === 'users'
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  회원 관리
                </button>
              </li>
              <li>
                <a
                  href="#vendors"
                  className="block border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  판매자 승인
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  className="block border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  상품 관리
                </a>
              </li>
              <li>
                <a
                  href="#orders"
                  className="block border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  주문 관리
                </a>
              </li>
              <li>
                <a
                  href="#settings"
                  className="block border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  설정
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 회원</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">1,234</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">승인 대기 판매자</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">23</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 상품</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">5,678</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 주문</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">890</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">최근 활동</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">새로운 판매자 승인 요청</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">OO농장 - 5분 전</p>
                  </div>
                  <button className="border border-gray-900 bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                    확인
                  </button>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">신규 회원 가입</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">김** - 10분 전</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">새 주문 발생</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">주문번호: ORD-2025-001250 - 15분 전</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">상품 등록 완료</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">프리미엄 유기농 쌀 - 30분 전</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* 회원 관리 탭 */}
          {activeTab === 'users' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">회원 관리</h2>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
                </div>
              ) : (
                <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">이메일</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">이름</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">전화번호</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">유형</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">가입일</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                              등록된 회원이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{user.email}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{user.full_name}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.phone || '-'}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  user.user_type === 'seller'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {user.user_type === 'seller' ? '판매자' : '구매자'}
                                </span>
                                {user.user_type === 'seller' && user.vendor_status && (
                                  <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    user.vendor_status === 'approved'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : user.vendor_status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {user.vendor_status === 'approved' ? '승인됨' : user.vendor_status === 'pending' ? '대기중' : '거부됨'}
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  user.is_active
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                  {user.is_active ? '활성' : '비활성'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {new Date(user.created_at).toLocaleDateString('ko-KR')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}