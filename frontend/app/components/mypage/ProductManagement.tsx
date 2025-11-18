'use client';

import { useState, useEffect } from 'react';
import { useRouter} from 'next/navigation';
import { productManagementAPI } from '../../lib/api';
import { GetVendorProductRequest } from '../../types';

// 카테고리 slug -> 한글 이름 매핑
const categoryMap: Record<string, string> = {
  electronics: '가전/디지털',
  fashion: '패션',
  beauty: '뷰티',
  living: '생활/건강',
  food: '식품',
  sports: '스포츠',
  books: '도서',
  baby: '완구',
};

export default function ProductManagement() {
  const [activeTab, setActiveTab] = useState<'products' | 'options'>('products');
  const [products, setProducts] = useState<GetVendorProductRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await productManagementAPI.getMyProducts(token);
        setProducts(response.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const handleAddProduct = () => {
    router.push('/product-management/-1');
  };

  const handleEdit = (productId: string) => {
    router.push(`/product-management/${productId}`);
  };

  const handleDelete = async (productId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 삭제 확인
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await productManagementAPI.delete(productId, token);
      alert('상품이 삭제되었습니다.');

      // 상품 목록 다시 불러오기
      const response = await productManagementAPI.getMyProducts(token);
      setProducts(response.products);
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      alert(error.message || '상품 삭제 중 오류가 발생했습니다.');
    }
  };



  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">상품 관리</h3>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'products'
              ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          상품 목록
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'options'
              ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          옵션 관리
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? '로딩 중...' : `총 ${products.length}개의 상품`}
            </p>
            <button onClick={handleAddProduct}
            className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              + 상품 등록
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                상품 목록을 불러오는 중...
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                등록된 상품이 없습니다.
              </div>
            ) : (
              products.map((product, index) => (
                <div key={index} className="flex items-center gap-4 border border-gray-200 p-4 dark:border-gray-700">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">{product.name}</h5>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      재고: {product.stock_quantity}개 · 가격: ₩{product.price.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      카테고리: {categoryMap[product.category_slug] || product.category_slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product.id)}
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">수정</button>
                    <button onClick={() => handleDelete(product.id)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Options Tab */}
      {activeTab === 'options' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">옵션 목록</p>
            <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              + 옵션 추가
            </button>
          </div>

          <div className="space-y-2">
            {[
              { name: '용량', values: ['500g', '1kg', '2kg', '5kg'], usedBy: 18 },
              { name: '색상', values: ['빨강', '초록', '노랑'], usedBy: 5 },
              { name: '등급', values: ['특', '상', '중'], usedBy: 12 },
              { name: '포장 방법', values: ['박스', '비닐', '친환경 포장'], usedBy: 8 },
            ].map((option, i) => (
              <div key={i} className="border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">{option.name}</h5>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      옵션값: {option.values.join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      {option.usedBy}개 상품에서 사용 중
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">수정</button>
                    <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
