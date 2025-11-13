'use client';

import Image from 'next/image';
import { CartItem as CartItemType } from '@/app/types';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const { product, quantity } = item;

  return (
    <div className="flex gap-4 border-b border-gray-200 py-4 dark:border-gray-700">
      {/* 상품 이미지 */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>

      {/* 상품 정보 */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
        </div>

        {/* 수량 조절 및 삭제 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuantityChange(product.id, Math.max(1, quantity - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              -
            </button>
            <span className="w-8 text-center text-gray-900 dark:text-white">{quantity}</span>
            <button
              onClick={() => onQuantityChange(product.id, quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold text-gray-900 dark:text-white">
              {(product.price * quantity).toLocaleString()}원
            </span>
            <button
              onClick={() => onRemove(product.id)}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
