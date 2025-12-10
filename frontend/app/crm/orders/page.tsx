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
}

export default function OrdersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('상태가 변경되었습니다.');
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.detail || '상태 변경 실패');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      paid: { label: '주문완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      shipping: { label: '배송중', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      delivered: { label: '배송완료', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      cancelled: { label: '주문취소', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-block whitespace-nowrap px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
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

  const getProductSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return '-';
    if (items.length === 1) return items[0].product_name;
    return `${items[0].product_name} 외 ${items.length - 1}건`;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user_name && order.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.user_email && order.user_email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // 상태별 카운트
  const statusCounts = {
    all: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">주문 관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">전체 주문 내역 관리</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">전체 주문</h2>
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
                placeholder="주문번호, 고객명, 이메일로 검색"
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
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'paid'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              주문완료 ({statusCounts.paid})
            </button>
            <button
              onClick={() => setStatusFilter('shipping')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'shipping'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              배송중 ({statusCounts.shipping})
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
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'cancelled'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              주문취소 ({statusCounts.cancelled})
            </button>
          </div>
        </section>

        {/* Orders List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                주문 내역이 없습니다.
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
                        고객정보
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상품
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
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태변경
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {order.order_number}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs font-medium text-gray-900 dark:text-white">
                            {order.shipping_address?.recipient_name || order.user_name || '-'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.user_email || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {getProductSummary(order.items)}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-3 py-3">{getStatusBadge(order.status)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="paid">주문완료</option>
                              <option value="shipping">배송중</option>
                              <option value="delivered">배송완료</option>
                              <option value="cancelled">주문취소</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
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
