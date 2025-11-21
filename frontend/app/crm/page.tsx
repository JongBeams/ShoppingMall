'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface NewUser {
  id: string;
  full_name: string;
  user_type: string;
  created_at: string;
}

interface PendingInquiry {
  id: string;
  user_name: string;
  title: string;
  category: string;
  created_at: string;
}

export default function CRMPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [newUsers, setNewUsers] = useState<NewUser[]>([]);
  const [pendingInquiries, setPendingInquiries] = useState<PendingInquiry[]>([]);

  useEffect(() => {
    // 관리자 로그인 체크
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
      router.push('/crm/login');
    }
  }, [router]);

  // 신규회원 조회
  useEffect(() => {
    const fetchNewUsers = async () => {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) return;

      try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // 최근 3명만 가져오기
          setNewUsers(data.users.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch new users:', error);
      }
    };

    fetchNewUsers();
  }, []);

  // 문의 대기 조회
  useEffect(() => {
    const fetchPendingInquiries = async () => {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) return;

      try {
        const response = await fetch(`${API_BASE_URL}/inquiries`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // pending 상태만 필터링하고 최근 2개만
          const pending = data.inquiries.filter((inq: any) => inq.status === 'pending').slice(0, 2);
          setPendingInquiries(pending);
        }
      } catch (error) {
        console.error('Failed to fetch pending inquiries:', error);
      }
    };

    fetchPendingInquiries();
  }, []);

  // 시간 계산 함수
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);

    // 날짜만 비교 (시간 무시)
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const diffMs = nowDate.getTime() - createdDate.getTime();

    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // 하루 미만인 경우 시간/분으로 표시
    if (diffDays === 0) {
      const timeDiffMs = now.getTime() - created.getTime();
      const diffMinutes = Math.floor(timeDiffMs / 60000);
      const diffHours = Math.floor(timeDiffMs / 3600000);

      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      return `${diffHours}시간 전`;
    }

    if (diffDays < 30) return `${diffDays}일 전`;
    if (diffMonths < 12) return `${diffMonths}개월 전`;
    return `${diffYears}년 전`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Banner */}
      <section className="relative -mt-8 h-[350px] overflow-hidden bg-white dark:bg-gray-900">
        <Image
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80"
          alt="CRM Dashboard Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-cyan-700/70"></div>

        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wider uppercase">Admin Dashboard</p>
            <p className="mb-5 text-base">쇼핑몰 통합 관리 시스템</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>회원 1,234명</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>상품 5,678개</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Menu - App Icon Style */}
      <section className="mt-3 bg-white py-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-9">
            {[
              {
                name: '회원관리',
                href: '/crm/users',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                gradient: 'from-blue-400 to-cyan-400'
              },
              {
                name: '판매자승인',
                href: '/crm/vendors',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: 'from-green-400 to-emerald-400'
              },
              {
                name: '상품관리',
                href: '/crm/products',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
                gradient: 'from-purple-400 to-pink-400'
              },
              {
                name: '주문관리',
                href: '/crm/orders',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                ),
                gradient: 'from-orange-400 to-amber-400'
              },
              {
                name: '매출통계',
                href: '/crm/sales',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                gradient: 'from-pink-400 to-rose-400'
              },
              {
                name: '공지관리',
                href: '/crm/notices',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                ),
                gradient: 'from-indigo-400 to-blue-400'
              },
              {
                name: 'FAQ관리',
                href: '/crm/faq',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: 'from-yellow-400 to-orange-400'
              },
              {
                name: '실시간상담',
                href: '/crm/live-chat',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                gradient: 'from-teal-400 to-cyan-400'
              },
              {
                name: '설정',
                href: '/crm/settings',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                gradient: 'from-red-400 to-pink-400'
              },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex flex-col items-center gap-2"
              >
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg transition-transform duration-200 active:scale-95`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent"></div>
                  <div className="relative z-10 text-white drop-shadow-md">
                    {item.icon}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats & Info Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 판매자 승인 대기 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">판매자 승인 대기</h2>
            <Link href="/crm/vendors?status=pending" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { id: 1, name: 'OO농장', category: '식품', time: '5분 전', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' },
              { id: 2, name: '스마트스토어', category: '전자제품', time: '30분 전', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200&q=80' },
            ].map((vendor) => (
              <Link
                key={vendor.id}
                href={`/crm/vendors/${vendor.id}`}
                className="group flex gap-3"
              >
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={vendor.image}
                    alt={vendor.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="80px"
                  />
                  <div className="absolute left-0 top-0 bg-yellow-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    대기
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                    {vendor.name}
                  </h3>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{vendor.category}</p>
                  <span className="text-xs text-gray-400">{vendor.time}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 건의하기 대기 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">건의하기 대기</h2>
            <Link href="/crm/inquiries?status=pending" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-3">
            {pendingInquiries.length > 0 ? (
              pendingInquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/crm/inquiries?id=${inquiry.id}`}
                  className="group flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">[{inquiry.category}]</span>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {inquiry.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{inquiry.user_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="mb-1 block text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      대기중
                    </span>
                    <span className="text-xs text-gray-400">{getTimeAgo(inquiry.created_at)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                대기 중인 문의가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 신규 회원 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">신규 회원</h2>
            <Link href="/crm/users?sort=new" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-3">
            {newUsers.length > 0 ? (
              newUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/crm/users/${user.id}`}
                  className="group flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {user.full_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </h3>
                      <span className={`text-xs ${user.user_type === 'seller' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {user.user_type === 'seller' ? '판매자' : '구매자'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{getTimeAgo(user.created_at)}</span>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                신규 회원이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 신고된 상품 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">신고된 상품</h2>
            <Link href="/crm/reports?type=product" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { id: 1, product: '가짜 명품 가방', reason: '위조품 의심', time: '10분 전', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&q=80', reportCount: 5 },
              { id: 2, product: '불법 복제 상품', reason: '저작권 침해', time: '1시간 전', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80', reportCount: 3 },
            ].map((report) => (
              <Link
                key={report.id}
                href={`/crm/reports/products/${report.id}`}
                className="group flex gap-3"
              >
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={report.image}
                    alt={report.product}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="80px"
                  />
                  <div className="absolute left-0 top-0 bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    {report.reportCount}건
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                    {report.product}
                  </h3>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{report.reason}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      신고 {report.reportCount}건
                    </span>
                    <span className="text-xs text-gray-400">· {report.time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 회원</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">1,234</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 12% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-blue-100 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">승인 대기</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">23</p>
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">처리 필요</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 상품</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">5,678</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 8% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-purple-100 dark:bg-purple-900">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">오늘 주문</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">145</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 15% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-green-100 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mt-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">최근 활동</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">새로운 판매자 승인 요청</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">OO농장 - 5분 전</p>
                </div>
              </div>
              <button className="border border-gray-900 bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                확인
              </button>
            </div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">신규 회원 가입</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">김철수 - 10분 전</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">새 주문 발생</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">주문번호: ORD-2025-001250 - 15분 전</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">상품 등록 완료</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">프리미엄 유기농 쌀 - 30분 전</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
