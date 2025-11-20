import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/app/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc =
    product.thumbnail_url ||
    product.imageUrl ||
    '/placeholder-product.jpg';
  const stock =
    typeof product.stock === 'number'
      ? product.stock
      : product.stock_quantity ?? 0;
  const categoryLabel =
    product.category ||
    product.category_name ||
    product.category_slug ||
    '기타';

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="border border-gray-200 bg-white transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-white">
        {/* 상품 이미지 */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          {stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-xs font-bold text-white">품절</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="p-2">
          <h3 className="mb-1 line-clamp-2 text-xs font-medium text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {product.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">원</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
