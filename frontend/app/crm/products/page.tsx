'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

export default function ProductsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 가짜 상품 데이터
  const [products] = useState([
    {
      id: 'PRD-2025-001250',
      name: '프리미엄 유기농 쌀 10kg',
      storeName: 'OO농장',
      category: '농산물',
      price: 45000,
      stock: 150,
      status: 'active',
      registeredAt: '2025-11-15 14:30',
    },
    {
      id: 'PRD-2025-001249',
      name: '제주 흑돼지 삼겹살 1kg',
      storeName: '정육점',
      category: '축산물',
      price: 28000,
      stock: 85,
      status: 'active',
      registeredAt: '2025-11-14 10:20',
    },
    {
      id: 'PRD-2025-001248',
      name: '친환경 사과 5kg',
      storeName: 'OO농장',
      category: '과일',
      price: 32000,
      stock: 0,
      status: 'out_of_stock',
      registeredAt: '2025-11-13 16:45',
    },
    {
      id: 'PRD-2025-001247',
      name: '제주 한라봉 3kg',
      storeName: '제주특산물',
      category: '과일',
      price: 38000,
      stock: 200,
      status: 'active',
      registeredAt: '2025-11-12 09:15',
    },
    {
      id: 'PRD-2025-001246',
      name: '국내산 한우 등심 500g',
      storeName: '정육점',
      category: '축산물',
      price: 55000,
      stock: 45,
      status: 'active',
      registeredAt: '2025-11-11 11:30',
    },
    {
      id: 'PRD-2025-001245',
      name: '유기농 토마토 2kg',
      storeName: 'OO농장',
      category: '채소',
      price: 18000,
      stock: 120,
      status: 'active',
      registeredAt: '2025-11-10 14:00',
    },
    {
      id: 'PRD-2025-001244',
      name: '신선한 고등어 10마리',
      storeName: '신선마켓',
      category: '수산물',
      price: 25000,
      stock: 30,
      status: 'active',
      registeredAt: '2025-11-09 08:45',
    },
    {
      id: 'PRD-2025-001243',
      name: '무농약 배추 1포기',
      storeName: 'OO농장',
      category: '채소',
      price: 5000,
      stock: 0,
      status: 'inactive',
      registeredAt: '2025-11-08 15:20',
    },
    {
      id: 'PRD-2025-001242',
      name: '제주 갈치 5마리',
      storeName: '신선마켓',
      category: '수산물',
      price: 42000,
      stock: 60,
      status: 'active',
      registeredAt: '2025-11-07 10:10',
    },
    {
      id: 'PRD-2025-001241',
      name: '찰보리쌀 5kg',
      storeName: 'OO농장',
      category: '농산물',
      price: 22000,
      stock: 95,
      status: 'active',
      registeredAt: '2025-11-06 13:50',
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
        label: '판매중',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
      inactive: {
        label: '판매중지',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      out_of_stock: {
        label: '품절',
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">전체 상품관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">전체 가맹점 상품 조회 및 관리</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">전체 상품</h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {filteredProducts.length}
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명, 가맹점명, 카테고리, 상품번호로 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-3 flex flex-wrap gap-2">
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
              판매중
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'inactive'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              판매중지
            </button>
            <button
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'out_of_stock'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              품절
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              전체 카테고리
            </button>
            <button
              onClick={() => setCategoryFilter('농산물')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === '농산물'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              농산물
            </button>
            <button
              onClick={() => setCategoryFilter('축산물')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === '축산물'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              축산물
            </button>
            <button
              onClick={() => setCategoryFilter('수산물')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === '수산물'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              수산물
            </button>
            <button
              onClick={() => setCategoryFilter('과일')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === '과일'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              과일
            </button>
            <button
              onClick={() => setCategoryFilter('채소')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === '채소'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              채소
            </button>
          </div>
        </section>

        {/* Products List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                상품이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상품번호
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상품명
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        가맹점
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        카테고리
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        가격
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        재고
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        등록일시
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {product.id}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {product.storeName}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {product.category}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                          {product.price.toLocaleString()}원
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
                          {product.stock.toLocaleString()}개
                        </td>
                        <td className="px-3 py-3">{getStatusBadge(product.status)}</td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {product.registeredAt}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                              상세
                            </button>
                            <button className="border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                              수정
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
