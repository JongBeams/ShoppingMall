'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import Pagination from '../components/common/Pagination';
import { Product } from '../types';
import { productAPI } from '../lib/api';

type SortOption = 'ranking' | 'price_low' | 'price_high' | 'sales' | 'latest';

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeShipping, setFreeShipping] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // 상품 목록 조회
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productAPI.getAll();
        setProducts(response.products || []);
      } catch (err: any) {
        console.error('Failed to load products:', err);
        setError(err.message || '상품 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 카테고리 목록 조회
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productAPI.getCategories();
        setCategories(response.categories || []);
      } catch (err: any) {
        console.error('Failed to load categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // 필터링 및 정렬
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = selectedCategory === 'all'
      ? products
      : products.filter((product) => {
          return product.category_slug === selectedCategory || product.category_name === selectedCategory;
        });

    // 배송비 무료 필터
    if (freeShipping) {
      // TODO: 상품에 배송비 정보가 있다면 필터링
      // filtered = filtered.filter(p => p.free_shipping);
    }

    // 별점 필터
    if (selectedRating) {
      // TODO: 상품에 별점 정보가 있다면 필터링
      // filtered = filtered.filter(p => p.rating >= selectedRating);
    }

    // 가격 필터
    if (priceRange !== 'all') {
      const ranges: Record<string, [number, number]> = {
        'under_10000': [0, 10000],
        '10000_60000': [10000, 60000],
        '60000_200000': [60000, 200000],
        '200000_400000': [200000, 400000],
        'over_400000': [400000, Infinity],
      };
      const [min, max] = ranges[priceRange] || [0, Infinity];
      filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    // 직접 입력 가격 필터
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'sales':
          // TODO: 판매량 정보가 있다면 정렬
          return 0;
        case 'ranking':
          // TODO: 랭킹 정보가 있다면 정렬
          return 0;
        case 'latest':
        default:
          // created_at 기준 최신순 (없으면 id 기준)
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
      }
    });

    return sorted;
  }, [products, selectedCategory, freeShipping, sortBy, selectedRating, priceRange, minPrice, maxPrice]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 필터 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, freeShipping, selectedRating, priceRange, minPrice, maxPrice]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
        전체 상품
      </h1>

      <div className="flex gap-4">
        {/* 왼쪽 카테고리 사이드바 */}
        <aside className="w-48 flex-shrink-0 space-y-4">
          {/* 필터 섹션 */}
          <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">필터</h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  무료배송
                </span>
              </label>
            </div>
          </div>

          {/* 카테고리 섹션 */}
          <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">카테고리</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                  selectedCategory === 'all'
                    ? 'border border-gray-900 bg-gray-900 font-bold text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border border-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                전체
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                    selectedCategory === category.slug
                      ? 'border border-gray-900 bg-gray-900 font-bold text-white dark:border-white dark:bg-white dark:text-gray-900'
                      : 'border border-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 별점 섹션 */}
          <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
              <button
                onClick={() => setSelectedRating(null)}
                className="hover:underline"
              >
                별점전체
              </button>
            </h3>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(rating)}
                  className={`flex w-full items-center gap-1 px-2 py-1 text-xs transition-colors ${
                    selectedRating === rating
                      ? 'font-bold text-blue-600 dark:text-blue-500'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  {[...Array(rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                  {[...Array(5 - rating)].map((_, i) => (
                    <span key={i} className="text-gray-300 dark:text-gray-600">★</span>
                  ))}
                  <span className="ml-1">{rating}점 이상</span>
                </button>
              ))}
            </div>
          </div>

          {/* 가격 섹션 */}
          <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
              <button
                onClick={() => setPriceRange('all')}
                className="hover:underline"
              >
                가격 전체
              </button>
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setPriceRange('under_10000')}
                className={`block w-full px-2 py-1 text-left text-xs transition-colors ${
                  priceRange === 'under_10000'
                    ? 'font-bold text-blue-600 dark:text-blue-500'
                    : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                8천원 이하
              </button>
              <button
                onClick={() => setPriceRange('10000_60000')}
                className={`block w-full px-2 py-1 text-left text-xs transition-colors ${
                  priceRange === '10000_60000'
                    ? 'font-bold text-blue-600 dark:text-blue-500'
                    : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                8천원~1만 6천원
              </button>
              <button
                onClick={() => setPriceRange('60000_200000')}
                className={`block w-full px-2 py-1 text-left text-xs transition-colors ${
                  priceRange === '60000_200000'
                    ? 'font-bold text-blue-600 dark:text-blue-500'
                    : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                1만 6천원~2만 4천원
              </button>
              <button
                onClick={() => setPriceRange('200000_400000')}
                className={`block w-full px-2 py-1 text-left text-xs transition-colors ${
                  priceRange === '200000_400000'
                    ? 'font-bold text-blue-600 dark:text-blue-500'
                    : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                2만 4천원~3만 2천원
              </button>
              <button
                onClick={() => setPriceRange('over_400000')}
                className={`block w-full px-2 py-1 text-left text-xs transition-colors ${
                  priceRange === 'over_400000'
                    ? 'font-bold text-blue-600 dark:text-blue-500'
                    : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                3만 2천원 이상
              </button>

              {/* 직접 입력 */}
              <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="~"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">원</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="~"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">원</span>
                </div>
                <button
                  onClick={() => {
                    setPriceRange('all');
                  }}
                  className="w-full border border-blue-600 bg-blue-600 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  검색
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* 오른쪽 상품 목록 */}
        <div className="flex-1">
          {/* 상단 필터 바 - 네이버 스타일 */}
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-white pb-3 dark:border-gray-700 dark:bg-gray-900">
            {/* 왼쪽: 정렬 버튼들 */}
            <div className="flex items-center gap-4">
              {/* 정렬 버튼들 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortBy('ranking')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs transition-colors ${
                    sortBy === 'ranking'
                      ? 'font-bold text-blue-600 dark:text-blue-500'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {sortBy === 'ranking' && <span>✓</span>}
                  인기순
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => setSortBy('price_low')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs transition-colors ${
                    sortBy === 'price_low'
                      ? 'font-bold text-blue-600 dark:text-blue-500'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {sortBy === 'price_low' && <span>✓</span>}
                  낮은가격순
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => setSortBy('price_high')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs transition-colors ${
                    sortBy === 'price_high'
                      ? 'font-bold text-blue-600 dark:text-blue-500'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {sortBy === 'price_high' && <span>✓</span>}
                  판매량순
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs transition-colors ${
                    sortBy === 'latest'
                      ? 'font-bold text-blue-600 dark:text-blue-500'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {sortBy === 'latest' && <span>✓</span>}
                  최신순
                </button>
              </div>
            </div>

            {/* 오른쪽: 상품 개수 표시 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredAndSortedProducts.length}개씩 보기
              </span>
              <button className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 border border-red-600 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              상품을 불러오는 중입니다...
            </div>
          ) : (
            <>
              <ProductGrid products={paginatedProducts} />

              {/* 페이지네이션 */}
              {totalPages > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
