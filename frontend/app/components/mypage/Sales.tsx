'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface OrderItem {
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  thumbnail_url?: string;
}

interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  status: string;
  total_amount: number;
  recipient_name: string;
  created_at: string;
  items: OrderItem[];
}

interface MonthlySales {
  month: string;
  amount: number;
  count: number;
}

export default function Sales() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        calculateMonthlySales(data.orders || []);
      }
    } catch (error) {
      console.error('판매 내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlySales = (orders: Order[]) => {
    const monthMap = new Map<string, { amount: number; count: number }>();

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, { amount: 0, count: 0 });
    }

    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthMap.has(key)) {
        const current = monthMap.get(key)!;
        const orderTotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        const orderQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        monthMap.set(key, {
          amount: current.amount + orderTotal,
          count: current.count + orderQuantity,
        });
      }
    });

    const result: MonthlySales[] = [];
    monthMap.forEach((value, key) => {
      const [, month] = key.split('-');
      result.push({
        month: `${parseInt(month)}월`,
        amount: value.amount,
        count: value.count,
      });
    });

    setMonthlySales(result);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '결제대기',
      paid: '결제완료',
      preparing: '배송준비',
      shipping: '배송중',
      delivered: '배송완료',
      cancelled: '취소',
    };
    return statusMap[status] || status;
  };

  // 통계 계산
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalSales = validOrders.reduce((sum, order) => sum + order.items.reduce((s, i) => s + (i.subtotal || 0), 0), 0);
  const totalCount = validOrders.length;
  const avgSales = totalCount > 0 ? Math.floor(totalSales / totalCount) : 0;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const pendingCount = orders.filter(o => o.status === 'paid' || o.status === 'preparing').length;
  const shippingCount = orders.filter(o => o.status === 'shipping').length;

  // 오늘 매출
  const today = new Date().toDateString();
  const todaySales = validOrders
    .filter(o => new Date(o.created_at).toDateString() === today)
    .reduce((sum, order) => sum + order.items.reduce((s, i) => s + (i.subtotal || 0), 0), 0);
  const todayCount = validOrders.filter(o => new Date(o.created_at).toDateString() === today).length;

  // 이번 달 매출
  const thisMonth = new Date();
  const monthSales = validOrders
    .filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    })
    .reduce((sum, order) => sum + order.items.reduce((s, i) => s + (i.subtotal || 0), 0), 0);

  const maxAmount = Math.max(...monthlySales.map(m => m.amount), 1);
  const rawMaxCount = Math.max(...monthlySales.map(m => m.count), 1);
  const countStep = Math.ceil(rawMaxCount / 5);
  const maxCount = countStep * 5; // Y축 최대값을 step의 5배로 설정

  // 인기 상품 계산
  const productSales = new Map<string, { name: string; quantity: number; amount: number; thumbnail?: string }>();
  validOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = productSales.get(item.product_id) || { name: item.product_name, quantity: 0, amount: 0, thumbnail: item.thumbnail_url };
      productSales.set(item.product_id, {
        name: item.product_name,
        quantity: existing.quantity + item.quantity,
        amount: existing.amount + (item.subtotal || 0),
        thumbnail: item.thumbnail_url || existing.thumbnail,
      });
    });
  });
  const topProducts = Array.from(productSales.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">판매 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">판매 대시보드</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">실시간 판매 현황을 한눈에 확인하세요</p>
        </div>
      </div>

      {/* Quick Stats - 모노톤 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">오늘 매출</p>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">₩{todaySales.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{todayCount}건 주문</p>
        </div>

        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">이번 달 매출</p>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">₩{monthSales.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{thisMonth.getMonth() + 1}월 누적</p>
        </div>

        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">처리 대기</p>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}건</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">배송 준비 필요</p>
        </div>

        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">배송 중</p>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{shippingCount}건</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">배송 진행 중</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 매출 차트 */}
        <div className="lg:col-span-2 border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">월별 매출 추이</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">최근 6개월</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 bg-blue-700 rounded"></div>
                <span className="text-gray-500 dark:text-gray-400">매출</span>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="relative h-48 overflow-visible pt-10">
            <div className="h-full overflow-visible">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 28 + 10}
                    x2="500"
                    y2={i * 28 + 10}
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="1"
                  />
                ))}
                {/* Area fill */}
                <path
                  d={`M ${monthlySales.map((data, i) => {
                    const x = (i / (monthlySales.length - 1)) * 460 + 20;
                    const y = 150 - (data.amount / maxAmount) * 130;
                    return `${x},${y}`;
                  }).join(' L ')} L ${460 + 20},150 L 20,150 Z`}
                  className="fill-blue-50 dark:fill-blue-900/30"
                />
                {/* 매출 Line - 짙은 파랑 */}
                <path
                  d={`M ${monthlySales.map((data, i) => {
                    const x = (i / (monthlySales.length - 1)) * 460 + 20;
                    const y = 150 - (data.amount / maxAmount) * 130;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Hover points */}
                {monthlySales.map((data, i) => {
                  const x = (i / (monthlySales.length - 1)) * 460 + 20;
                  const y = 150 - (data.amount / maxAmount) * 130;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="20"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                      {hoveredIndex === i && (
                        <>
                          <circle cx={x} cy={y} r="4" fill="#1d4ed8" />
                          <rect
                            x={x - 45}
                            y={y - 35}
                            width="90"
                            height="24"
                            rx="4"
                            fill="#1f2937"
                          />
                          <text
                            x={x}
                            y={y - 18}
                            textAnchor="middle"
                            fill="white"
                            fontSize="11"
                            fontWeight="500"
                          >
                            ₩{data.amount.toLocaleString()}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* X축 라벨 */}
              <div className="flex justify-between">
                {monthlySales.map((data, i) => (
                  <span key={i} className="text-xs text-gray-500 dark:text-gray-400">{data.month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 인기 상품 */}
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">베스트 상품</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">판매량 TOP 5</p>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                판매 데이터가 없습니다
              </p>
            ) : (
              topProducts.map(([productId, data], idx) => (
                <div key={productId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                    {idx + 1}
                  </span>
                  <div className="relative h-10 w-10 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    {data.thumbnail ? (
                      <Image src={data.thumbnail} alt={data.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{data.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{data.quantity}개</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">₩{data.amount.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">총 판매액</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">₩{totalSales.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">총 판매 건수</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{totalCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">평균 주문 금액</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">₩{avgSales.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">취소/반품</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{cancelledCount}건</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">최근 판매 내역</h3>
          </div>
          <Link href="/mypage#orders" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            전체보기 →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">상품</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">주문번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">구매자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">날짜</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">금액</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    아직 판매 내역이 없습니다
                  </td>
                </tr>
              ) : (
                orders.slice(0, 10).flatMap((order) =>
                  order.items.map((item, idx) => (
                    <tr key={`${order.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                            {item.thumbnail_url ? (
                              <Image src={item.thumbnail_url} alt={item.product_name} fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.product_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity}개</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {order.order_number || order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {order.recipient_name ? `${order.recipient_name.charAt(0)}**` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ₩{(item.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-block border border-gray-300 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-300">
                          {getStatusBadge(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
