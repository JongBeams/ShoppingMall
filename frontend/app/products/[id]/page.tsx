'use client';

import { use } from 'react';
import Image from 'next/image';
import Button from '@/app/components/common/Button';

// 임시 더미 데이터
const dummyProduct = {
  id: '1',
  name: '무선 이어폰',
  description: '고음질 블루투스 무선 이어폰입니다. 노이즈 캔슬링 기능과 긴 배터리 수명을 자랑합니다.',
  price: 89000,
  category: '전자제품',
  imageUrl: '/placeholder-product.jpg',
  stock: 50,
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2">
        {/* 상품 이미지 */}
        <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          <Image
            src={dummyProduct.imageUrl}
            alt={dummyProduct.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* 상품 정보 */}
        <div className="flex flex-col">
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            {dummyProduct.category}
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            {dummyProduct.name}
          </h1>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
            {dummyProduct.description}
          </p>

          <div className="mb-6 border-t border-b border-gray-200 py-6 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {dummyProduct.price.toLocaleString()}원
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              재고: {dummyProduct.stock}개
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => alert('장바구니 기능은 개발 중입니다')}
              className="flex-1"
            >
              장바구니 담기
            </Button>
            <Button
              onClick={() => alert('구매 기능은 개발 중입니다')}
              variant="outline"
              className="flex-1"
            >
              바로 구매
            </Button>
          </div>

          <div className="mt-8 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              배송 안내
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 무료 배송</li>
              <li>• 주문 후 24시간 이내 배송</li>
              <li>• 30일 무료 반품/교환</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
