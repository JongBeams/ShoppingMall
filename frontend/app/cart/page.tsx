'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartItem as CartItemType } from '../types';

// 임시 더미 데이터
const initialCartItems: CartItemType[] = [
  {
    product: {
      id: '1',
      name: 'AirPods Pro',
      description: '고음질 블루투스 무선 이어폰',
      price: 359000,
      category: '전자제품',
      imageUrl: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&q=80',
      stock: 50,
    },
    quantity: 2,
  },
  {
    product: {
      id: '2',
      name: 'Leather Crossbag',
      description: '심플한 디자인의 데일리 백팩',
      price: 189000,
      category: '패션',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
      stock: 20,
    },
    quantity: 1,
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemType[]>(initialCartItems);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((items) =>
      items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemove = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.product.id !== productId));
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
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
      <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
        장바구니
      </h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 장바구니 아이템 목록 */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.product.id}
              className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex gap-4">
                {/* 상품 이미지 */}
                <div className="relative h-24 w-24 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                {/* 상품 정보 */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.product.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.product.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* 수량 조절 */}
                    <div className="flex items-center border border-gray-300 dark:border-gray-600">
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        -
                      </button>
                      <span className="border-x border-gray-300 px-3 py-1 text-sm text-gray-900 dark:border-gray-600 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        +
                      </button>
                    </div>

                    {/* 가격 */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {(item.product.price * item.quantity).toLocaleString()}원
                      </p>
                      <button
                        onClick={() => handleRemove(item.product.id)}
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
            <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">
              주문 요약
            </h2>
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
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
            <button
              onClick={() => alert('주문 기능은 개발 중입니다')}
              className="mt-4 w-full border border-gray-900 bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              주문하기
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
