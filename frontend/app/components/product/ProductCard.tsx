import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/app/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {/* 상품 이미지 */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <span className="text-lg font-bold text-white">품절</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="p-4">
          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            {product.category}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2 dark:text-white">
            {product.name}
          </h3>
          <p className="mb-3 text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {product.price.toLocaleString()}원
            </span>
            {product.stock > 0 && product.stock < 10 && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                재고 {product.stock}개
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
