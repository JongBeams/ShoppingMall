'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    const vendorData = localStorage.getItem('vendor');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      if (vendorData) {
        setVendor(JSON.parse(vendorData));
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">마이페이지</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">회원 정보 및 활동 내역을 확인하세요</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              {/* Profile */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                {user.user_type === 'seller' && (
                  <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    판매자
                  </span>
                )}
                {user.user_type === 'buyer' && (
                  <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    일반 회원
                  </span>
                )}
              </div>

              {/* Menu */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  내 정보
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
                </button>
                {user?.user_type === 'seller' && (
                  <button
                    onClick={() => setActiveTab('sales')}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                      activeTab === 'sales'
                        ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                    </svg>
                    판매 내역
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    activeTab === 'wishlist'
                      ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  찜한 상품
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                {/* Profile Info */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">회원 정보</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">이름</span>
                      <span className="text-sm text-gray-900 dark:text-white">{user.full_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">이메일</span>
                      <span className="text-sm text-gray-900 dark:text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">전화번호</span>
                      <span className="text-sm text-gray-900 dark:text-white">{user.phone || '미등록'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">회원 유형</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user.user_type === 'seller' ? '판매자' : '일반 회원'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor Info (if seller) */}
                {vendor && (
                  <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">판매자 정보</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">스토어 이름</span>
                        <span className="text-sm text-gray-900 dark:text-white">{vendor.store_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">사업자명</span>
                        <span className="text-sm text-gray-900 dark:text-white">{vendor.business_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">사업자등록번호</span>
                        <span className="text-sm text-gray-900 dark:text-white">{vendor.business_number}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">사업장 주소</span>
                        <span className="text-sm text-gray-900 dark:text-white">{vendor.business_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">승인 상태</span>
                        <span className={`text-sm font-medium ${vendor.is_verified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {vendor.is_verified ? '승인 완료' : '승인 대기'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">주문</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                        <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">찜한 상품</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">포인트</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
                  {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
                </h3>

                {user?.user_type === 'seller' ? (
                  /* 판매자용 - 주문 요청 목록 */
                  <div className="space-y-4">
                    {/* 주문 요청 1 */}
                    <div className="border border-gray-200 p-4 dark:border-gray-700">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001234</span>
                          <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">2025.01.13</span>
                        </div>
                        <span className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                          승인 대기
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                          <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">수량: 3개</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">구매자: 김**</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">₩45,000</p>
                          <button className="mt-2 border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                            승인
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 주문 요청 2 */}
                    <div className="border border-gray-200 p-4 dark:border-gray-700">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001198</span>
                          <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">2025.01.12</span>
                        </div>
                        <span className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                          승인 대기
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                          <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">GAP 인증 유기농 상추 500g</h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">수량: 5개</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">구매자: 이**</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">₩62,500</p>
                          <button className="mt-2 border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                            승인
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 주문 요청 3 - 이미 승인됨 */}
                    <div className="border border-gray-200 p-4 dark:border-gray-700">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">주문번호: ORD-2025-001165</span>
                          <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">2025.01.11</span>
                        </div>
                        <span className="border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          승인 완료
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                          <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">무농약 친환경 딸기 2kg</h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">수량: 2개</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">구매자: 박**</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">₩89,600</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 일반 사용자용 - 주문 내역 없음 */
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">주문 내역이 없습니다</p>
                  </div>
                )}
              </div>
            )}

            {/* Sales Tab (Seller Only) */}
            {activeTab === 'sales' && user?.user_type === 'seller' && (
              <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">판매 내역</h3>
                  <div className="flex gap-2">
                    <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      필터
                    </button>
                    <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      다운로드
                    </button>
                  </div>
                </div>

                {/* Sales Summary */}
                <div className="mb-6 grid gap-4 sm:grid-cols-4">
                  <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">총 판매액</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₩2,450,000</p>
                  </div>
                  <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">판매 건수</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">37건</p>
                  </div>
                  <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">평균 판매가</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₩66,216</p>
                  </div>
                  <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">반품/교환</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">2건</p>
                  </div>
                </div>

                {/* Sales Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">상품명</th>
                        <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">주문번호</th>
                        <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">구매자</th>
                        <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">판매일</th>
                        <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">수량</th>
                        <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">판매액</th>
                        <th className="pb-3 text-center text-sm font-semibold text-gray-900 dark:text-white">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                              <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: TOM-001</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001234</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">김**</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.12</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">3</td>
                        <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩45,000</td>
                        <td className="py-4 text-center">
                          <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            배송완료
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                              <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">GAP 인증 유기농 상추 500g</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: LET-002</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001198</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">이**</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.11</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">5</td>
                        <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩62,500</td>
                        <td className="py-4 text-center">
                          <span className="inline-block border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            배송중
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                              <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">무농약 친환경 딸기 2kg</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: STR-003</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001165</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">박**</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.10</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2</td>
                        <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩89,600</td>
                        <td className="py-4 text-center">
                          <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            배송완료
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                              <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">국내산 유기농 쌀 10kg</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: RIC-004</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001132</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">최**</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.09</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">1</td>
                        <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩58,000</td>
                        <td className="py-4 text-center">
                          <span className="inline-block border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            배송준비
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                              <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">제철 유기농 배추 1통</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: CAB-005</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001089</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">정**</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.08</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">4</td>
                        <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩52,000</td>
                        <td className="py-4 text-center">
                          <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            배송완료
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    총 <span className="font-medium text-gray-900 dark:text-white">37</span>건 중 1-5 표시
                  </p>
                  <div className="flex gap-2">
                    <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" disabled>
                      이전
                    </button>
                    <button className="border border-gray-300 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900">
                      1
                    </button>
                    <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      2
                    </button>
                    <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      3
                    </button>
                    <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      다음
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">찜한 상품</h3>
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">찜한 상품이 없습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}