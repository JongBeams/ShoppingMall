'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface WritableReview {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  purchaseDate: string;
  price: number;
}

interface WrittenReview {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  rating: number;
  content: string;
  created_at: string;
}

export default function Reviews() {
  const [activeFilter, setActiveFilter] = useState<'writable' | 'written'>('writable');
  const [writableReviews, setWritableReviews] = useState<WritableReview[]>([]);
  const [writtenReviews, setWrittenReviews] = useState<WrittenReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 작성 가능한 리뷰 (배송완료 주문)
      const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.orders || [];

        // 작성된 리뷰 목록 조회
        const reviewsResponse = await fetch(`${API_BASE_URL}/reviews/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let writtenReviewsList: WrittenReview[] = [];
        let writtenProductIds: Set<string> = new Set();

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          writtenReviewsList = reviewsData.reviews || [];
          // 이미 리뷰 작성한 상품 ID 수집
          writtenReviewsList.forEach((r: WrittenReview) => {
            writtenProductIds.add(r.product_id);
          });
          setWrittenReviews(writtenReviewsList);
        }

        // 배송완료 주문에서 리뷰 미작성 상품만 추출
        const reviewableItems: WritableReview[] = [];
        orders.forEach((order: any) => {
          if (order.status === 'delivered' && order.items) {
            order.items.forEach((item: any) => {
              // 이미 리뷰 작성한 상품 제외
              if (!writtenProductIds.has(item.product_id)) {
                reviewableItems.push({
                  id: `${order.id}-${item.product_id}`,
                  orderId: order.id,
                  productId: item.product_id,
                  productName: item.product_name,
                  productImage: item.product_thumbnail || '/placeholder-product.jpg',
                  purchaseDate: new Date(order.created_at).toLocaleDateString('ko-KR'),
                  price: item.price
                });
              }
            });
          }
        });

        setWritableReviews(reviewableItems);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('리뷰가 삭제되었습니다.');
        fetchData(); // 새로고침
      } else {
        const error = await response.json();
        alert(error.detail || '리뷰 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">리뷰 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">리뷰 관리</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          구매한 상품의 리뷰를 작성하고 관리하세요
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('writable')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'writable'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            작성 가능 ({writableReviews.length})
          </button>
          <button
            onClick={() => setActiveFilter('written')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'written'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            작성 완료 ({writtenReviews.length})
          </button>
        </div>
      </div>

      {/* Review List */}
      <div>
        {activeFilter === 'writable' ? (
          <div className="space-y-3">
            {writableReviews.length > 0 ? (
              writableReviews.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border border-gray-200 p-3 dark:border-gray-700"
                >
                  <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-xs font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        구매일: {item.purchaseDate}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.price.toLocaleString()}원
                      </p>
                    </div>
                    <Link
                      href={`/reviews/write?orderId=${item.orderId}&productId=${item.productId}`}
                      className="mt-2 self-start border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                    >
                      리뷰 작성
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  작성 가능한 리뷰가 없습니다
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  배송 완료된 상품에 대해 리뷰를 작성할 수 있습니다
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {writtenReviews.length > 0 ? (
              writtenReviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 p-3 dark:border-gray-700"
                >
                  {/* Product Info */}
                  <div className="mb-3 flex gap-3">
                    <Link href={`/products/${review.product_id}`} className="flex-shrink-0">
                      <div className="relative h-12 w-12 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <Image
                          src={review.product_image || '/placeholder-product.jpg'}
                          alt={review.product_name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link
                        href={`/products/${review.product_id}`}
                        className="text-xs font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {review.product_name}
                      </Link>
                      <div className="mt-1 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <p className="mb-2 text-xs text-gray-700 dark:text-gray-300">
                    {review.content}
                  </p>

                  {/* Review Actions */}
                  <div className="flex items-center justify-end border-t border-gray-100 pt-2 dark:border-gray-800">
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  작성한 리뷰가 없습니다
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
