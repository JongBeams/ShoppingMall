'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cartAPI } from '../lib/api';
import { CartItem } from '../types';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 장바구니 조회
  const fetchCart = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await cartAPI.get(token);
      setCartItems(response.items || []);
    } catch (err: any) {
      console.error('장바구니 조회 실패:', err);
      setError(err.message || '장바구니를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 수량 변경
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await cartAPI.updateQuantity(itemId, newQuantity, token);
      // 수량 변경 후 장바구니 다시 조회
      fetchCart();
      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      alert(err.message || '수량 변경 중 오류가 발생했습니다.');
    }
  };

  // 아이템 삭제
  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('장바구니에서 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await cartAPI.remove(itemId, token);
      fetchCart();
      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  // 장바구니 전체 비우기
  const handleClearCart = async () => {
    if (!confirm('장바구니를 전체 비우시겠습니까?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await cartAPI.clear(token);
      fetchCart();
      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      alert(err.message || '장바구니 비우기 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 전체 금액 계산
  const totalPrice = cartItems.reduce((sum, item) => sum + item.total_price, 0);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">장바구니를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
          장바구니가 비어있습니다
        </h1>
        <Link
          href="/products"
          className="border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          쇼핑 계속하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">장바구니</h1>
        <button
          onClick={handleClearCart}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          전체 비우기
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 장바구니 아이템 목록 */}
        <div className="space-y-3 lg:col-span-2">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex gap-4">
                {/* 상품 이미지 */}
                <Link
                  href={`/products/${item.product_id}`}
                  className="relative h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {item.product_thumbnail ? (
                    <Image
                      src={item.product_thumbnail}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* 상품 정보 */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-sm font-bold text-gray-900 hover:underline dark:text-white"
                    >
                      {item.product_name}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.product_price.toLocaleString()}원
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* 수량 조절 */}
                    <div className="flex items-center border border-gray-300 dark:border-gray-600">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        -
                      </button>
                      <span className="border-x border-gray-300 px-3 py-1 text-sm text-gray-900 dark:border-gray-600 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        +
                      </button>
                    </div>

                    {/* 가격 */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.total_price.toLocaleString()}원
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="mt-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 주문 요약 */}
        <div>
          <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">주문 요약</h2>
            <div className="space-y-2 border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>상품 금액</span>
                <span>{totalPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>배송비</span>
                <span>무료</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-base font-bold text-gray-900 dark:text-white">
              <span>총 금액</span>
              <span className="text-red-600 dark:text-red-500">{totalPrice.toLocaleString()}원</span>
            </div>
            <Link
              href="/order"
              className="mt-4 block w-full border border-gray-900 bg-gray-900 py-2.5 text-center text-sm font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              주문하기
            </Link>
            <Link
              href="/products"
              className="mt-2 block w-full border border-gray-300 bg-white py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
