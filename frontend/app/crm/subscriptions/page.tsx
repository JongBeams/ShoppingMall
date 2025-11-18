'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

type TabType = 'buyer' | 'seller';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('buyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 구매자 구독 데이터
  const [buyerSubscriptions] = useState([
    {
      id: 'SUB-B-001250',
      userName: '김철수',
      email: 'kim@example.com',
      planName: '프리미엄 플랜',
      price: 9900,
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2025-11-01',
      autoRenewal: true,
    },
    {
      id: 'SUB-B-001249',
      userName: '이영희',
      email: 'lee@example.com',
      planName: '베이직 플랜',
      price: 4900,
      status: 'active',
      startDate: '2025-09-15',
      endDate: '2025-10-15',
      autoRenewal: true,
    },
    {
      id: 'SUB-B-001248',
      userName: '박민수',
      email: 'park@example.com',
      planName: '프리미엄 플랜',
      price: 9900,
      status: 'expired',
      startDate: '2025-08-01',
      endDate: '2025-09-01',
      autoRenewal: false,
    },
    {
      id: 'SUB-B-001247',
      userName: '최지원',
      email: 'choi@example.com',
      planName: '베이직 플랜',
      price: 4900,
      status: 'cancelled',
      startDate: '2025-07-10',
      endDate: '2025-08-10',
      autoRenewal: false,
    },
    {
      id: 'SUB-B-001246',
      userName: '정수현',
      email: 'jung@example.com',
      planName: '프리미엄 플랜',
      price: 9900,
      status: 'active',
      startDate: '2025-10-05',
      endDate: '2025-11-05',
      autoRenewal: true,
    },
  ]);

  // 판매자 구독 데이터
  const [sellerSubscriptions] = useState([
    {
      id: 'SUB-S-001250',
      storeName: 'OO농장',
      ownerName: '홍길동',
      email: 'hong@example.com',
      planName: '비즈니스 플랜',
      price: 29900,
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2025-11-01',
      autoRenewal: true,
      productCount: 45,
    },
    {
      id: 'SUB-S-001249',
      storeName: '제주특산물',
      ownerName: '김제주',
      email: 'jeju@example.com',
      planName: '엔터프라이즈 플랜',
      price: 49900,
      status: 'active',
      startDate: '2025-09-20',
      endDate: '2025-10-20',
      autoRenewal: true,
      productCount: 120,
    },
    {
      id: 'SUB-S-001248',
      storeName: '정육점',
      ownerName: '박정육',
      email: 'meat@example.com',
      planName: '스타터 플랜',
      price: 14900,
      status: 'active',
      startDate: '2025-10-10',
      endDate: '2025-11-10',
      autoRenewal: true,
      productCount: 25,
    },
    {
      id: 'SUB-S-001247',
      storeName: '신선마켓',
      ownerName: '이신선',
      email: 'fresh@example.com',
      planName: '비즈니스 플랜',
      price: 29900,
      status: 'expired',
      startDate: '2025-08-15',
      endDate: '2025-09-15',
      autoRenewal: false,
      productCount: 38,
    },
    {
      id: 'SUB-S-001246',
      storeName: '유기농마을',
      ownerName: '최유기',
      email: 'organic@example.com',
      planName: '비즈니스 플랜',
      price: 29900,
      status: 'cancelled',
      startDate: '2025-07-01',
      endDate: '2025-08-01',
      autoRenewal: false,
      productCount: 52,
    },
  ]);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: {
        label: '활성',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
      expired: {
        label: '만료',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      cancelled: {
        label: '취소',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredBuyerSubscriptions = buyerSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSellerSubscriptions = sellerSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">구독관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            구매자 및 판매자 구독 플랜 조회 및 관리
          </p>
        </section>

        {/* Tabs */}
        <section className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('buyer');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === 'buyer'
                  ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              구매자 구독
            </button>
            <button
              onClick={() => {
                setActiveTab('seller');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === 'seller'
                  ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              판매자 구독
            </button>
          </div>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {activeTab === 'buyer' ? '구매자 구독 목록' : '판매자 구독 목록'}
              </h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {activeTab === 'buyer'
                  ? filteredBuyerSubscriptions.length
                  : filteredSellerSubscriptions.length}
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'buyer'
                    ? '이름, 이메일, 플랜명, 구독번호로 검색'
                    : '가맹점명, 대표자명, 이메일, 플랜명, 구독번호로 검색'
                }
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              전체
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
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'expired'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              만료
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'cancelled'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              취소
            </button>
          </div>
        </section>

        {/* Subscription List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {activeTab === 'buyer' ? (
              // 구매자 구독 테이블
              filteredBuyerSubscriptions.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  구독 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          구독번호
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          회원명
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          이메일
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          플랜명
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          월 요금
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          상태
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          시작일
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          종료일
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                          자동갱신
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuyerSubscriptions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                            {sub.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                            {sub.userName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.planName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                            {sub.price.toLocaleString()}원
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">{getStatusBadge(sub.status)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.startDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.endDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                            {sub.autoRenewal ? (
                              <span className="text-green-600 dark:text-green-400">ON</span>
                            ) : (
                              <span className="text-gray-400">OFF</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button className="border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                상세
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // 판매자 구독 테이블
              filteredSellerSubscriptions.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  구독 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          구독번호
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          가맹점명
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          대표자명
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          이메일
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          플랜명
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          월 요금
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          등록상품수
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          상태
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          시작일
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          종료일
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                          자동갱신
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSellerSubscriptions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                            {sub.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                            {sub.storeName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.ownerName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.planName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                            {sub.price.toLocaleString()}원
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
                            {sub.productCount}개
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">{getStatusBadge(sub.status)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.startDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {sub.endDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                            {sub.autoRenewal ? (
                              <span className="text-green-600 dark:text-green-400">ON</span>
                            ) : (
                              <span className="text-gray-400">OFF</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button className="border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                상세
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </CRMLayout>
  );
}
