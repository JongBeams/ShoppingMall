'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_thumbnail?: string;
  price: number;
  quantity: number;
}

export default function ReviewWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const productId = searchParams.get('productId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/login');
      return;
    }

    if (!orderId || !productId) {
      alert('잘못된 접근입니다.');
      router.push('/mypage?tab=orders');
      return;
    }

    fetchOrderItem(token);
  }, [orderId, productId]);

  const fetchOrderItem = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const order = await response.json();
        const item = order.items?.find((i: OrderItem) => i.product_id === productId);
        if (item) {
          setOrderItem(item);
        } else {
          alert('상품 정보를 찾을 수 없습니다.');
          router.push('/mypage?tab=orders');
        }
      } else {
        alert('주문 정보를 불러올 수 없습니다.');
        router.push('/mypage?tab=orders');
      }
    } catch (error) {
      console.error('주문 정보 조회 실패:', error);
      alert('주문 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/mypage?tab=orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      alert('리뷰 내용을 10자 이상 작성해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          product_id: productId,
          rating,
          content,
        }),
      });

      if (response.ok) {
        alert('리뷰가 등록되었습니다.');
        router.push('/mypage?tab=reviews');
      } else {
        const error = await response.json();
        alert(error.detail || '리뷰 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 등록 실패:', error);
      alert('리뷰 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">리뷰 작성</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          구매하신 상품에 대한 솔직한 리뷰를 남겨주세요
        </p>
      </div>

      {/* 상품 정보 */}
      {orderItem && (
        <div className="mb-6 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
              {orderItem.product_thumbnail ? (
                <Image
                  src={orderItem.product_thumbnail}
                  alt={orderItem.product_name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <Link
                href={`/products/${orderItem.product_id}`}
                className="text-sm font-medium text-gray-900 hover:underline dark:text-white"
              >
                {orderItem.product_name}
              </Link>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {orderItem.price.toLocaleString()}원 x {orderItem.quantity}개
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 작성 폼 */}
      <form onSubmit={handleSubmit} className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {/* 별점 */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
            별점
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1"
              >
                <svg
                  className={`h-8 w-8 transition ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {rating}점
            </span>
          </div>
        </div>

        {/* 리뷰 내용 */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
            리뷰 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (최소 10자 이상)"
            rows={6}
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {content.length}자 / 최소 10자
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || content.trim().length < 10}
            className="flex-1 border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '리뷰 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
