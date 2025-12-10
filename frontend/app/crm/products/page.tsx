'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';
import { productAPI } from '@/app/lib/api';
import Pagination from '../components/Pagination';

interface Product {
  id: string;
  name: string;
  vendor_id?: string;
  vendor_name?: string;
  category?: string;
  category_slug?: string;
  price: number;
  stock_quantity: number;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  image_url?: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productAPI.getAll();
      console.log('Products data:', data.products); // 디버깅용
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getProductStatus = (product: Product) => {
    if (product.stock_quantity === 0) return 'out_of_stock';
    if (product.is_active === false) return 'inactive';
    return 'active';
  };

  const categoryMap: Record<string, string> = {
    'electronics': '가전/디지털',
    'fashion': '패션',
    'beauty': '뷰티',
    'living': '생활/건강',
    'food': '식품',
    'sports': '스포츠',
    'books': '도서',
    'baby': '완구',
  };

  const getCategoryName = (categorySlug?: string) => {
    return categorySlug ? categoryMap[categorySlug] || categorySlug : '미분류';
  };

  // 실제 등록된 상품들의 카테고리 목록 추출
  const availableCategories = Array.from(
    new Set(
      products
        .map((p) => p.category_slug)
        .filter((slug): slug is string => !!slug)
    )
  ).map((slug) => ({
    slug,
    name: getCategoryName(slug),
  }));

  const filteredProducts = products.filter((product) => {
    const vendorName = product.vendor_name || '';
    const category = product.category || product.category_slug || '';
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(searchQuery.toLowerCase());

    const productStatus = getProductStatus(product);
    const matchesStatus = statusFilter === 'all' || productStatus === statusFilter;

    const categoryName = getCategoryName(product.category_slug);
    const matchesCategory = categoryFilter === 'all' ||
                           categoryName === categoryFilter ||
                           product.category === categoryFilter ||
                           product.category_slug === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
            {availableCategories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setCategoryFilter(category.name)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  categoryFilter === category.name
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
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
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상품번호
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상품명
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        가맹점
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        카테고리
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        가격
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        재고
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        등록일시
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => {
                      const productStatus = getProductStatus(product);
                      const formattedDate = product.created_at
                        ? new Date(product.created_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-';

                      return (
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
                            {product.vendor_name || '-'}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {getCategoryName(product.category_slug)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                            {product.price.toLocaleString()}원
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
                            {product.stock_quantity.toLocaleString()}개
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">{getStatusBadge(productStatus)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {formattedDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
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
            totalItems={filteredProducts.length}
          />
        </section>
      </div>
    </CRMLayout>
  );
}
