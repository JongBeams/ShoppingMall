'use client';

import { useState, useEffect } from 'react';
import { productManagementAPI } from '../../lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Product {
  id: string;
  name: string;
  price: number;
  thumbnail_url?: string;
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
}

export default function EventManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [discountPrice, setDiscountPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'default' | 'discounted'>('default');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await productManagementAPI.getMyProducts(token);
      setProducts(response.products || []);
    } catch (error) {
      console.error('상품 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 특가 적용된 상품과 기본 상품 분류
  const defaultProducts = products.filter(p => !p.discount_price);
  const discountedProducts = products.filter(p => p.discount_price);

  // 현재 탭에 맞는 상품 목록
  const displayProducts = activeTab === 'default' ? defaultProducts : discountedProducts;

  const handleSelectAll = () => {
    if (selectedProducts.size === displayProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(displayProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleApplyDiscount = async () => {
    if (selectedProducts.size === 0) {
      alert('상품을 선택해주세요.');
      return;
    }

    if (!discountPercent && !discountPrice) {
      alert('할인율 또는 할인가를 입력해주세요.');
      return;
    }

    if (!discountStart || !discountEnd) {
      alert('할인 기간을 설정해주세요.');
      return;
    }

    if (new Date(discountStart) > new Date(discountEnd)) {
      alert('종료일이 시작일보다 빨라요.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/products/discount`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: Array.from(selectedProducts),
          discount_percent: discountPercent ? parseFloat(discountPercent) : null,
          discount_price: discountPrice ? parseFloat(discountPrice) : null,
          discount_start: discountStart,
          discount_end: discountEnd,
        }),
      });

      if (!response.ok) throw new Error('할인 설정 실패');

      alert('특가가 적용되었습니다!');
      setSelectedProducts(new Set());
      setDiscountPercent('');
      setDiscountPrice('');
      setDiscountStart('');
      setDiscountEnd('');
      fetchProducts();
      setActiveTab('discounted'); // 특가 적용 후 특가 탭으로 이동
    } catch (error) {
      console.error('할인 설정 실패:', error);
      alert('할인 설정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDiscount = async (productId: string) => {
    if (!confirm('이 상품의 특가를 해제하시겠습니까?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/products/${productId}/discount`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('특가 해제 실패');

      alert('특가가 해제되었습니다.');
      fetchProducts();
    } catch (error) {
      console.error('특가 해제 실패:', error);
      alert('특가 해제에 실패했습니다.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const isOnSale = (product: Product) => {
    if (!product.discount_price || !product.discount_start || !product.discount_end) return false;
    const now = new Date();
    return now >= new Date(product.discount_start) && now <= new Date(product.discount_end);
  };

  // 탭 변경 시 선택 초기화
  const handleTabChange = (tab: 'default' | 'discounted') => {
    setActiveTab(tab);
    setSelectedProducts(new Set());
  };

  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">이벤트/특가 관리</h3>

      {/* 탭 */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleTabChange('default')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'default'
              ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          기본 ({defaultProducts.length})
        </button>
        <button
          onClick={() => handleTabChange('discounted')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'discounted'
              ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          특가적용완료 ({discountedProducts.length})
        </button>
      </div>

      {/* 할인 설정 패널 - 기본 탭에서만 표시 */}
      {activeTab === 'default' && (
        <div className="mb-6 border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">특가 설정</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">할인율 (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value);
                  setDiscountPrice('');
                }}
                min="1"
                max="99"
                placeholder="예: 20"
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">시작일</label>
              <input
                type="date"
                value={discountStart}
                onChange={(e) => setDiscountStart(e.target.value)}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">종료일</label>
              <input
                type="date"
                value={discountEnd}
                onChange={(e) => setDiscountEnd(e.target.value)}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyDiscount}
                disabled={isSubmitting || selectedProducts.size === 0}
                className="w-full border border-gray-900 bg-gray-900 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {isSubmitting ? '적용 중...' : `선택 상품에 적용 (${selectedProducts.size}개)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? '로딩 중...' : `총 ${displayProducts.length}개의 상품`}
        </p>
        {activeTab === 'default' && displayProducts.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={selectedProducts.size === displayProducts.length && displayProducts.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 border-gray-300"
            />
            전체 선택
          </label>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          상품 목록을 불러오는 중...
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {activeTab === 'default' ? '특가 적용 가능한 상품이 없습니다.' : '특가 적용된 상품이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-2">
          {displayProducts.map((product) => {
            const onSale = isOnSale(product);
            return (
              <div
                key={product.id}
                className={`flex items-center gap-4 border p-3 ${
                  selectedProducts.has(product.id)
                    ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-900'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {activeTab === 'default' && (
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="h-4 w-4 border-gray-300"
                  />
                )}
                <div className="h-14 w-14 flex-shrink-0 border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</h5>
                  <div className="mt-1 flex items-center gap-2">
                    {activeTab === 'discounted' && product.discount_price ? (
                      <>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {Math.floor(product.discount_price).toLocaleString()}원
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {Math.floor(product.price).toLocaleString()}원
                        </span>
                        <span className="bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                        </span>
                        {onSale && (
                          <span className="bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            진행중
                          </span>
                        )}
                        {!onSale && new Date() < new Date(product.discount_start!) && (
                          <span className="bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            예정
                          </span>
                        )}
                        {!onSale && new Date() > new Date(product.discount_end!) && (
                          <span className="bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-900/30 dark:text-gray-400">
                            종료
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {Math.floor(product.price).toLocaleString()}원
                      </span>
                    )}
                  </div>
                  {activeTab === 'discounted' && product.discount_start && product.discount_end && (
                    <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                      특가 기간: {formatDate(product.discount_start)} ~ {formatDate(product.discount_end)}
                    </p>
                  )}
                </div>
                {activeTab === 'discounted' && product.discount_price && (
                  <button
                    onClick={() => handleRemoveDiscount(product.id)}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    특가 해제
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
