'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function AdminMyPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    totalUsers: 1234,
    pendingVendors: 23,
    totalProducts: 5678,
    todayOrders: 145,
  });

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_user');

    if (!adminToken || !adminData) {
      router.push('/crm/login');
      return;
    }

    try {
      const admin = JSON.parse(adminData);
      setAdminUser(admin);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to parse admin data:', e);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      router.push('/crm/login');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">관리자 마이페이지</h1>

        {/* Admin Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 회원</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-gray-100 dark:bg-gray-700">
                <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">승인 대기</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingVendors}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-gray-100 dark:bg-gray-700">
                <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 상품</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProducts.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-gray-100 dark:bg-gray-700">
                <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">오늘 주문</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.todayOrders}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-gray-100 dark:bg-gray-700">
                <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              {/* Admin Info */}
              <div className="relative border-b border-gray-100 p-6 dark:border-gray-800">
                <span className="absolute right-4 top-4 text-xs text-gray-400 dark:text-gray-500">
                  관리자
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 dark:bg-white">
                    <svg className="h-6 w-6 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{adminUser?.full_name || '관리자'}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{adminUser?.email || 'admin@example.com'}</p>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
                    activeTab === 'profile'
                      ? 'bg-gray-50 font-medium text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  내 정보
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
                    activeTab === 'activity'
                      ? 'bg-gray-50 font-medium text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  관리 활동
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
                    activeTab === 'settings'
                      ? 'bg-gray-50 font-medium text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  설정
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
                    activeTab === 'security'
                      ? 'bg-gray-50 font-medium text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  보안
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">관리자 정보</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">시스템 관리자 계정 정보</p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                        이름
                      </label>
                      <input
                        type="text"
                        value={adminUser?.full_name || ''}
                        disabled
                        className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={adminUser?.email || ''}
                        disabled
                        className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        value={adminUser?.phone || '-'}
                        disabled
                        className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                        역할
                      </label>
                      <input
                        type="text"
                        value="시스템 관리자"
                        disabled
                        className="w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">계정 상태</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          활성
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">최근 관리 활동</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">최근 수행한 관리 작업 내역</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      {
                        action: '판매자 승인',
                        detail: 'OO농장 판매자 계정 승인 완료',
                        time: '2시간 전',
                      },
                      {
                        action: '상품 승인',
                        detail: '유기농 쌀 10kg 상품 등록 승인',
                        time: '5시간 전',
                      },
                      {
                        action: '신고 처리',
                        detail: '위조품 신고 건 처리 완료',
                        time: '1일 전',
                      },
                      {
                        action: '회원 관리',
                        detail: '휴면 계정 3건 정리',
                        time: '2일 전',
                      },
                      {
                        action: '공지사항 등록',
                        detail: '시스템 점검 안내 공지 등록',
                        time: '3일 전',
                      },
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-b-0 dark:border-gray-700">
                        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{activity.detail}</p>
                          <span className="mt-1 inline-block text-xs text-gray-400">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">설정</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">이메일 알림</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">중요한 알림을 이메일로 받습니다</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gray-900 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">시스템 알림</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">시스템 업데이트 및 공지사항</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gray-900 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-white"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">보안</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">비밀번호 변경</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                            현재 비밀번호
                          </label>
                          <input
                            type="password"
                            className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                            새 비밀번호
                          </label>
                          <input
                            type="password"
                            className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                            새 비밀번호 확인
                          </label>
                          <input
                            type="password"
                            className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <button className="border border-gray-900 bg-gray-900 px-6 py-2 text-sm font-bold text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                          비밀번호 변경
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
