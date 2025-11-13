'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem, Product } from '../types';

// 임시 더미 데이터
const dummySaleProducts: CartItem[] = [
  {
    product: {
      id: '1',
      name: '무선 이어폰',
      description: '고음질 블루투스 블루투스 무선 이어폰',
      price: 89000,
      category: '전자제품',
      imageUrl: '/placeholder-product.jpg',
      stock: 50,
      createdAt: '2025-11-10T09:00:00Z',
    },
    quantity: 100,
  },
  {
    product: {
      id: '2',
      name: '백팩',
      description: '심플한 디자인의 데일리 백팩 (노트북 수납 가능)',
      price: 65000,
      category: '패션',
      imageUrl: '/placeholder-product.jpg',
      stock: 20,
      createdAt: '2025-11-11T12:30:00Z',
    },
    quantity: 200,
  },
  {
    product: {
      id: '3',
      name: '프로그래머를 위한 자바스크립트 입문서',
      description: '기초 문법부터 실전 예제까지 다루는 자바스크립트 입문 도서',
      price: 32000,
      category: '도서',
      imageUrl: '/placeholder-product.jpg',
      stock: 30,
      createdAt: '2025-11-12T15:00:00Z',
    },
    quantity: 300,
  },
];

export default function ProductManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CartItem[]>(dummySaleProducts);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.user_type !== 'seller') {
        alert('판매자만 접근할 수 있습니다.');
        router.push('/');
        return;
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleEdit = (productId: string) => {
    // TODO: 상품 수정 모달 또는 페이지로 이동
    console.log('Edit product:', productId);
    alert(`상품 수정 기능 (ID: ${productId})`);
  };

  const handleDelete = (productId: string) => {
    if (confirm('정말 이 상품을 삭제하시겠습니까?')) {
      // TODO: API 호출로 상품 삭제
      setProducts(products.filter(p => p.product.id !== productId));
      console.log('Delete product:', productId);
    }
  };

  const handleAddProduct = () => {
    // TODO: 상품 등록 모달 또는 페이지로 이동
    console.log('Add new product');
    alert('상품 등록 기능은 개발 중입니다');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">상품 관리</h1>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            상품 등록
          </button>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">상품 정보</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">카테고리</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">가격</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">재고</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">등록 수량</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">등록된 상품이 없습니다</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item.product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                            <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.product.category}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                        ₩{item.product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                        {item.product.stock}개
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                        {item.quantity}개
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item.product.id)}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(item.product.id)}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">등록 상품</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₩{products.reduce((sum, p) => sum + p.product.price, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 상품 가치</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.reduce((sum, p) => sum + p.product.stock, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 재고</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}