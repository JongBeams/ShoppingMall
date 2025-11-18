'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

export default function SalesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // 가짜 데이터
  const salesData = {
    todaySales: 1234567,
    monthSales: 45678901,
    yearSales: 567890123,
    todayOrders: 145,
    monthOrders: 4532,
    averageOrderValue: 85430,
    topProducts: [
      { name: '프리미엄 유기농 쌀 10kg', sales: 12345678, count: 234 },
      { name: '신선한 사과 5kg', sales: 8765432, count: 567 },
      { name: '국내산 돼지고기 1kg', sales: 6543210, count: 321 },
      { name: '제주 한라봉 3kg', sales: 5432109, count: 198 },
      { name: '유기농 계란 30구', sales: 4321098, count: 456 },
    ],
    monthlySales: [
      { month: '1월', sales: 35000000 },
      { month: '2월', sales: 38000000 },
      { month: '3월', sales: 42000000 },
      { month: '4월', sales: 39000000 },
      { month: '5월', sales: 45000000 },
      { month: '6월', sales: 48000000 },
      { month: '7월', sales: 52000000 },
      { month: '8월', sales: 49000000 },
      { month: '9월', sales: 46000000 },
      { month: '10월', sales: 51000000 },
      { month: '11월', sales: 45678901 },
      { month: '12월', sales: 0 },
    ],
  };

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
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
            <p className="text-sm text-gray-600 dark:text-gray-400">오늘 매출</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(salesData.todaySales)}
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 12.5% 전일 대비</p>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">이번 달 매출</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(salesData.monthSales)}
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 8.3% 전월 대비</p>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">올해 총 매출</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(salesData.yearSales)}
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 15.7% 전년 대비</p>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">오늘 주문</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {salesData.todayOrders.toLocaleString()}건
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 5.2% 전일 대비</p>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">이번 달 주문</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {salesData.monthOrders.toLocaleString()}건
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 9.1% 전월 대비</p>
          </div>

          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">평균 주문 금액</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(salesData.averageOrderValue)}
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 3.4% 전월 대비</p>
          </div>
        </section>

        {/* Monthly Sales Chart (간단한 바 차트) */}
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
