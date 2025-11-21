'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RecentProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  viewedAt: string;
  category: string;
}

export default function RecentProducts() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentProducts');
      if (stored) {
        setRecentProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('최근 본 상품 불러오기 실패:', e);
    }
  }, []);

  const handleRemove = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const filtered = recentProducts.filter(p => p.id !== productId);
    setRecentProducts(filtered);
    localStorage.setItem('recentProducts', JSON.stringify(filtered));
  };

  return (
    <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-gray-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">최근 본 상품</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          최근에 본 상품 목록입니다 (최대 20개)
        </p>
      </div>

      <div className="p-4">
        {recentProducts.length > 0 ? (
          <div className="space-y-3">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex gap-3 border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      {product.brand || '브랜드 없음'} · {product.category}
                    </p>
                    <h3 className="mb-1 text-xs font-medium text-gray-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {product.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {Number(product.price).toLocaleString()}원
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {product.viewedAt}
                  </p>
                </div>
                <button
                  onClick={(e) => handleRemove(product.id, e)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center self-start border border-gray-300 text-gray-600 transition hover:border-red-500 hover:text-red-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-400 dark:hover:text-red-400"
                  title="삭제"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              최근 본 상품이 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
