import Image from 'next/image';
import Link from 'next/link';
import { memo, useMemo } from 'react';
import { Product } from '@/app/types';

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
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

  // 할인 정보 계산 (useMemo로 최적화)
  const { onSale, displayPrice, discountPercent } = useMemo(() => {
    const isOnSale = () => {
      if (!product.discount_price || !product.discount_start || !product.discount_end) return false;
      const now = new Date();
      return now >= new Date(product.discount_start) && now <= new Date(product.discount_end);
    };

    const onSale = isOnSale();
    const displayPrice = onSale && product.discount_price ? product.discount_price : product.price;
    const discountPercent = onSale && product.discount_price
      ? Math.round((1 - product.discount_price / product.price) * 100)
      : 0;

    return { onSale, displayPrice, discountPercent };
  }, [product.discount_price, product.discount_start, product.discount_end, product.price]);

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="flex h-full flex-col border border-gray-200 bg-white transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-white">
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
        <div className="flex flex-1 flex-col p-2">
          {/* 카테고리 / 스토어명 */}
          <div className="mb-1 flex items-center gap-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400">{categoryLabel}</span>
            {product.vendor_name && (
              <>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{product.vendor_name}</span>
              </>
            )}
          </div>

          {/* 상품명 */}
          <h3 className="mb-1 h-8 overflow-hidden text-xs font-medium leading-4 text-gray-900 dark:text-white">
            <span className="line-clamp-2">{product.name}</span>
          </h3>

          {/* 가격 */}
          <div className="flex flex-wrap items-baseline gap-1">
            {onSale ? (
              <>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {Math.floor(displayPrice).toLocaleString()}원
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {Math.floor(product.price).toLocaleString()}원
                </span>
                <span className="bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {discountPercent}%
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {Math.floor(product.price).toLocaleString()}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">원</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// React.memo로 불필요한 리렌더링 방지
// product.id가 같으면 리렌더링하지 않음
export default memo(ProductCard, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.price === nextProps.product.price &&
         prevProps.product.stock === nextProps.product.stock &&
         prevProps.product.discount_price === nextProps.product.discount_price;
});
