'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';
import Pagination from '../components/Pagination';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method?: string;
  created_at: string;
  shipping_address?: {
    recipient_name: string;
    recipient_phone: string;
    address: string;
  };
  delivered_at?: string;
}

export default function DeliveryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error('주문 목록 조회 실패');
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 주문 상태를 배송 상태로 매핑
  const mapOrderStatusToDeliveryStatus = (orderStatus: string): string => {
    switch (orderStatus) {
      case 'confirmed':
      case 'processing':
      case 'paid':
        return 'preparing'; // 배송준비
      case 'shipped':
        return 'in_transit'; // 배송중
      case 'delivered':
        return 'delivered'; // 배송완료
      case 'refunded':
      case 'cancelled':
        return 'returned'; // 반송
      default:
        return 'preparing';
    }
  };

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

  const getProductSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return '-';
    if (items.length === 1) return items[0].product_name;
    return `${items[0].product_name} 외 ${items.length - 1}건`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter((order) => {
    const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
    const customerName = order.shipping_address?.recipient_name || order.user_name || '';
    const customerAddress = order.shipping_address?.address || '';

    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProductSummary(order.items).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || deliveryStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 상태별 카운트
  const statusCounts = {
    all: orders.length,
    preparing: orders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'preparing').length,
    in_transit: orders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'in_transit').length,
    delivered: orders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'delivered').length,
    returned: orders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'returned').length,
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">전체 배송관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">전체 배송 현황 조회 및 관리</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">전체 배송</h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {filteredOrders.length}
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
              전체 ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'preparing'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송준비 ({statusCounts.preparing})
            </button>
            <button
              onClick={() => setStatusFilter('in_transit')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'in_transit'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송중 ({statusCounts.in_transit})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'delivered'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송완료 ({statusCounts.delivered})
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'returned'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              반송 ({statusCounts.returned})
            </button>
          </div>
        </section>

        {/* Deliveries List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {filteredOrders.length === 0 ? (
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
                        상품정보
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        고객정보
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        배송지
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        금액
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        주문일시
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => {
                      const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
                      const customerName = order.shipping_address?.recipient_name || order.user_name || '-';
                      const customerPhone = order.shipping_address?.recipient_phone || '-';
                      const address = order.shipping_address?.address || '-';

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                            {order.order_number}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {getProductSummary(order.items)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                              {customerName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {customerPhone}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {address}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">{getStatusBadge(deliveryStatus)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOrders.length}
          />
        </section>
      </div>
    </CRMLayout>
  );
}
