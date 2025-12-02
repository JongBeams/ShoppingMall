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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  // 장바구니 로드 후 전체 선택
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    }
  }, [cartItems]);

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    }
  };

  // 개별 선택/해제
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // 선택된 상품으로 주문하기
  const handleOrder = () => {
    if (selectedItems.size === 0) {
      alert('주문할 상품을 선택해주세요.');
      return;
    }
    // 선택된 아이템 ID를 세션에 저장
    sessionStorage.setItem('selectedCartItems', JSON.stringify([...selectedItems]));
    router.push('/order');
  };

  // 전체 금액 계산 (선택된 상품만)
  const selectedCartItems = cartItems.filter((item) => selectedItems.has(item.id));
  const totalPrice = selectedCartItems.reduce((sum, item) => sum + item.total_price, 0);
  // 할인 전 원래 가격 합계
  const totalOriginalPrice = selectedCartItems.reduce((sum, item) => {
    const originalPrice = (item as any).is_on_sale ? (item as any).product_original_price : item.product_price;
    return sum + (originalPrice * item.quantity);
  }, 0);
  const totalDiscount = totalOriginalPrice - totalPrice;
  // 배송비 계산: 5만원 이상 무료, 미만시 3,000원
  const deliveryFee = totalPrice >= 50000 ? 0 : 3000;
  // 최종 결제 금액
  const finalAmount = totalPrice + deliveryFee;

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
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">장바구니</h1>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={selectedItems.size === cartItems.length && cartItems.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
            전체선택 ({selectedItems.size}/{cartItems.length})
          </label>
        </div>
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
              className={`border bg-white p-4 dark:bg-gray-900 ${
                selectedItems.has(item.id)
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex gap-4">
                {/* 체크박스 */}
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="h-5 w-5 cursor-pointer accent-blue-600 dark:accent-blue-500"
                  />
                </div>
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
                      {(item as any).is_on_sale ? (
                        <>
                          <span className="text-blue-600 dark:text-blue-400">{Math.floor(item.product_price).toLocaleString()}원</span>
                          <span className="ml-1 text-gray-400 line-through">{Math.floor((item as any).product_original_price).toLocaleString()}원</span>
                          <span className="ml-1 bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            {Math.round((1 - item.product_price / (item as any).product_original_price) * 100)}%
                          </span>
                        </>
                      ) : (
                        <>{Math.floor(item.product_price).toLocaleString()}원</>
                      )}
                    </p>

                    {/* 선택된 옵션 표시 */}
                    {item.selected_options && item.selected_options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.selected_options.map((option, idx) => (
                          <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                            • {option.option_name}: {option.value_name}
                            {option.price > 0 && ` (+${option.price.toLocaleString()}원)`}
                          </p>
                        ))}
                      </div>
                    )}
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
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Math.floor(item.total_price).toLocaleString()}원
                      </p>
                      {(item as any).is_on_sale && (
                        <p className="text-xs text-gray-400 line-through">
                          {Math.floor((item as any).product_original_price * item.quantity).toLocaleString()}원
                        </p>
                      )}
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
                <span>{totalDiscount > 0 ? (
                  <span className="text-gray-400 line-through">{Math.floor(totalOriginalPrice).toLocaleString()}원</span>
                ) : (
                  <>{Math.floor(totalPrice).toLocaleString()}원</>
                )}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>할인 금액</span>
                  <span>-{Math.floor(totalDiscount).toLocaleString()}원</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>배송비</span>
                <span>{deliveryFee === 0 ? '무료' : `${deliveryFee.toLocaleString()}원`}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-base font-bold text-gray-900 dark:text-white">
              <span>총 금액</span>
              <span className="text-blue-600 dark:text-blue-400">{Math.floor(finalAmount).toLocaleString()}원</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={selectedItems.size === 0}
              className="mt-4 block w-full border border-blue-600 bg-blue-600 py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {selectedItems.size > 0 ? `선택상품 주문하기 (${selectedItems.size})` : '상품을 선택해주세요'}
            </button>
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
