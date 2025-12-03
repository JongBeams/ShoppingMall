'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { wishlistAPI, cartAPI } from '@/app/lib/api';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_thumbnail: string | null;
  category: string | null;
  description: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export default function Wishlist() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 찜 목록 불러오기
  const fetchWishlist = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await wishlistAPI.getWishlist(token);
      setWishlistItems(items);
      setError(null);
    } catch (err: any) {
      console.error('찜 목록 조회 실패:', err);
      setError(err.message || '찜 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // 찜 해제
  const handleRemoveFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!confirm('찜 목록에서 삭제하시겠습니까?')) {
      return;
    }

    try {
      await wishlistAPI.removeFromWishlist(productId, token);
      // 목록에서 제거
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      alert('찜 목록에서 삭제되었습니다.');
    } catch (err: any) {
      console.error('찜 삭제 실패:', err);
      alert(err.message || '찜 삭제에 실패했습니다.');
    }
  };

  // 장바구니 담기
  const handleAddToCart = async (productId: string, productName: string) => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await cartAPI.add(productId, 1, token);
      alert(`${productName}이(가) 장바구니에 담겼습니다.`);
    } catch (err: any) {
      console.error('장바구니 담기 실패:', err);
      alert(err.message || '장바구니 담기에 실패했습니다.');
    }
  };

  // 상품 상세 페이지로 이동
  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center p-8">
          <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="p-8 text-center">
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={fetchWishlist}
            className="mt-3 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">찜한 상품</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          총 {wishlistItems.length}개의 상품
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-xs text-gray-500 dark:text-gray-400">찜한 상품이 없습니다</p>
          <p className="mt-1 text-xs text-gray-400">마음에 드는 상품을 찜해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wishlistItems.map((item) => (
            <div key={item.id} className="flex gap-3 border border-gray-200 p-3 transition hover:shadow-sm dark:border-gray-700">
              {/* Product Image */}
              <div
                className="relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"
                onClick={() => handleProductClick(item.product_id)}
              >
                {item.product_thumbnail ? (
                  <Image
                    src={item.product_thumbnail}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="mb-1 flex items-start justify-between">
                    <h4
                      className="cursor-pointer text-xs font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      onClick={() => handleProductClick(item.product_id)}
                    >
                      {item.product_name}
                    </h4>
                    <button
                      className="ml-2 text-red-500 transition hover:text-gray-400"
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                      title="찜 해제"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </button>
                  </div>
                  {item.description && (
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  {item.category && (
                    <span className="inline-block bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {item.category}
                    </span>
                  )}
                  {!item.is_active && (
                    <span className="ml-2 inline-block bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900 dark:text-red-300">
                      판매중단
                    </span>
                  )}
                  {item.stock_quantity === 0 && (
                    <span className="ml-2 inline-block bg-orange-100 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                      품절
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    ₩{item.product_price.toLocaleString()}
                  </p>
                  <button
                    className="border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    onClick={() => handleAddToCart(item.product_id, item.product_name)}
                    disabled={!item.is_active || item.stock_quantity === 0}
                  >
                    장바구니 담기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
