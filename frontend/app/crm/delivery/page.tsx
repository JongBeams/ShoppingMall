'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

export default function DeliveryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 가짜 배송 데이터
  const [deliveries] = useState([
    {
      id: 'DLV-2025-001250',
      orderId: 'ORD-2025-001248',
      storeName: '정육점',
      customerName: '박민수',
      customerAddress: '서울시 강남구 테헤란로 123',
      customerPhone: '010-1234-5678',
      courier: 'CJ대한통운',
      trackingNumber: '123456789012',
      status: 'in_transit',
      shippedAt: '2025-11-18 14:00',
      estimatedDelivery: '2025-11-19 18:00',
    },
    {
      id: 'DLV-2025-001249',
      orderId: 'ORD-2025-001247',
      storeName: '제주특산물',
      customerName: '최지은',
      customerAddress: '부산시 해운대구 해운대로 456',
      customerPhone: '010-2345-6789',
      courier: '로젠택배',
      trackingNumber: '234567890123',
      status: 'delivered',
      shippedAt: '2025-11-17 10:00',
      estimatedDelivery: '2025-11-18 16:00',
      deliveredAt: '2025-11-18 15:30',
    },
    {
      id: 'DLV-2025-001248',
      orderId: 'ORD-2025-001245',
      storeName: 'OO농장',
      customerName: '김영수',
      customerAddress: '인천시 남동구 논현로 789',
      customerPhone: '010-3456-7890',
      courier: '한진택배',
      trackingNumber: '345678901234',
      status: 'preparing',
      shippedAt: null,
      estimatedDelivery: '2025-11-20 18:00',
    },
    {
      id: 'DLV-2025-001247',
      orderId: 'ORD-2025-001244',
      storeName: '신선마켓',
      customerName: '이미나',
      customerAddress: '대전시 유성구 대학로 321',
      customerPhone: '010-4567-8901',
      courier: '우체국택배',
      trackingNumber: '456789012345',
      status: 'failed',
      shippedAt: '2025-11-16 09:00',
      estimatedDelivery: '2025-11-17 18:00',
      failReason: '수취인 부재',
    },
    {
      id: 'DLV-2025-001246',
      orderId: 'ORD-2025-001243',
      storeName: '정육점',
      customerName: '정훈',
      customerAddress: '광주시 서구 상무대로 654',
      customerPhone: '010-5678-9012',
      courier: 'CJ대한통운',
      trackingNumber: '567890123456',
      status: 'returned',
      shippedAt: '2025-11-15 11:00',
      estimatedDelivery: '2025-11-16 18:00',
      failReason: '주소 오류',
      returnedAt: '2025-11-17 14:00',
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
      preparing: {
        label: '배송준비',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      in_transit: {
        label: '배송중',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      delivered: {
        label: '배송완료',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
      failed: {
        label: '배송실패',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      },
      returned: {
        label: '반송',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.trackingNumber.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">전체 배송관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">전체 배송 현황 조회 및 관리</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">전체 배송</h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {filteredDeliveries.length}
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="주문번호, 가맹점명, 고객명, 송장번호로 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
            </div>
          </div>

          {/* Filters */}
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
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'preparing'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송준비
            </button>
            <button
              onClick={() => setStatusFilter('in_transit')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'in_transit'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송중
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'delivered'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송완료
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'failed'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송실패
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'returned'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              반송
            </button>
          </div>
        </section>

        {/* Deliveries List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {filteredDeliveries.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                배송 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        주문번호
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        가맹점
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        고객명
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        배송지
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        택배사
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        송장번호
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {delivery.orderId}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {delivery.storeName}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {delivery.customerName}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {delivery.customerAddress}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {delivery.courier}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {delivery.trackingNumber}
                        </td>
                        <td className="px-3 py-3">{getStatusBadge(delivery.status)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                              추적
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </CRMLayout>
  );
}
