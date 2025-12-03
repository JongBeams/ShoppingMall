'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';
import { adminAPI } from '@/app/lib/api';

interface SalesData {
  todaySales: number;
  todaySalesChange: number;
  monthSales: number;
  monthSalesChange: number;
  yearSales: number;
  yearSalesChange: number;
  todayOrders: number;
  todayOrdersChange: number;
  monthOrders: number;
  monthOrdersChange: number;
  averageOrderValue: number;
  averageOrderValueChange: number;
  monthlySales: Array<{ month: string; sales: number }>;
  topProducts: Array<{ name: string; sales: number; count: number }>;
}

export default function SalesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [salesData, setSalesData] = useState<SalesData | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    fetchSalesData(adminToken);
  }, [router]);

  const fetchSalesData = async (token: string) => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getSalesStatistics(token);
      console.log('Sales data:', data);
      setSalesData({
        todaySales: data.today_sales,
        todaySalesChange: data.today_sales_change,
        monthSales: data.month_sales,
        monthSalesChange: data.month_sales_change,
        yearSales: data.year_sales,
        yearSalesChange: data.year_sales_change,
        todayOrders: data.today_orders,
        todayOrdersChange: data.today_orders_change,
        monthOrders: data.month_orders,
        monthOrdersChange: data.month_orders_change,
        averageOrderValue: data.average_order_value,
        averageOrderValueChange: data.average_order_value_change,
        monthlySales: data.monthly_sales,
        topProducts: data.top_products,
      });
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (isLoading || !salesData) {
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">매출 통계</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">매출 및 주문 통계 분석</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">기간별 매출</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedPeriod('day')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  selectedPeriod === 'day'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                일별
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  selectedPeriod === 'week'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                주별
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  selectedPeriod === 'month'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                월별
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  selectedPeriod === 'year'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                연별
              </button>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">오늘 매출</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(salesData.todaySales)}
                </p>
                <p className={`mt-1 text-xs ${salesData.todaySalesChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {salesData.todaySalesChange >= 0 ? '↑' : '↓'} {Math.abs(salesData.todaySalesChange)}% 전일 대비
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-blue-100 dark:bg-blue-900">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">이번 달 매출</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(salesData.monthSales)}
                </p>
                <p className={`mt-1 text-xs ${salesData.monthSalesChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {salesData.monthSalesChange >= 0 ? '↑' : '↓'} {Math.abs(salesData.monthSalesChange)}% 전월 대비
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-purple-100 dark:bg-purple-900">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">올해 총 매출</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(salesData.yearSales)}
                </p>
                <p className={`mt-1 text-xs ${salesData.yearSalesChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {salesData.yearSalesChange >= 0 ? '↑' : '↓'} {Math.abs(salesData.yearSalesChange)}% 전년 대비
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-amber-100 dark:bg-amber-900">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">오늘 주문</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {salesData.todayOrders.toLocaleString()}건
                </p>
                <p className={`mt-1 text-xs ${salesData.todayOrdersChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {salesData.todayOrdersChange >= 0 ? '↑' : '↓'} {Math.abs(salesData.todayOrdersChange)}% 전일 대비
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-emerald-100 dark:bg-emerald-900">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">이번 달 주문</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {salesData.monthOrders.toLocaleString()}건
                </p>
                <p className={`mt-1 text-xs ${salesData.monthOrdersChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {salesData.monthOrdersChange >= 0 ? '↑' : '↓'} {Math.abs(salesData.monthOrdersChange)}% 전월 대비
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-rose-100 dark:bg-rose-900">
                <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">평균 주문 금액</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(salesData.averageOrderValue)}
                </p>
                <p className={`mt-1 text-xs ${salesData.averageOrderValueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {salesData.averageOrderValueChange >= 0 ? '↑' : '↓'} {Math.abs(salesData.averageOrderValueChange)}% 전월 대비
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Sales Chart */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">월별 매출 추이</h2>
          <div className="space-y-3">
            {salesData.monthlySales.map((data, index) => {
              const maxSales = Math.max(...salesData.monthlySales.map((d) => d.sales));
              const percentage = (data.sales / maxSales) * 100;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-xs text-gray-600 dark:text-gray-400">{data.month}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full bg-gray-900 transition-all dark:bg-white"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-32 text-right text-xs font-medium text-gray-900 dark:text-white">
                    {data.sales > 0 ? formatCurrency(data.sales) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top Products */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">인기 상품 TOP 5</h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">순위</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">상품명</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">판매량</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">매출액</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.topProducts.map((product, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : index === 1
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
                        {product.count.toLocaleString()}개
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </CRMLayout>
  );
}
