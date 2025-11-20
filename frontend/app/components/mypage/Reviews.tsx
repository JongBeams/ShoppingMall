'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Reviews() {
  const [activeFilter, setActiveFilter] = useState<'writable' | 'written'>('writable');

  const writableReviews = [
    {
      id: 1,
      productId: '1',
      productName: 'AirPods Pro',
      productImage: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&q=80',
      purchaseDate: '2025.01.15',
      price: 359000
    },
    {
      id: 2,
      productId: '2',
      productName: 'Smart Watch Ultra',
      productImage: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80',
      purchaseDate: '2025.01.10',
      price: 1099000
    },
  ];

  const writtenReviews = [
    {
      id: 1,
      productId: '3',
      productName: 'Leather Crossbag',
      productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
      rating: 5,
      content: '정말 만족스러운 제품입니다. 가죽 재질이 좋고 디자인도 심플해서 어디든 잘 어울려요!',
      photos: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=80',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&q=80',
      ],
      date: '2025.01.05',
      likes: 12
    },
    {
      id: 2,
      productId: '4',
      productName: 'Premium Wallet',
      productImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
      rating: 4,
      content: '가성비가 좋아요. 다만 조금 더 슬림했으면 좋았을 것 같아요.',
      photos: [],
      date: '2024.12.28',
      likes: 5
    },
  ];

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
                    </div>
                    <button
                      onClick={() => window.location.href = `/reviews/write?productId=${item.productId}`}
                      className="mt-2 self-start border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      리뷰 작성
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
                  작성 가능한 리뷰가 없습니다
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
                    <Link href={`/products/${review.productId}`} className="flex-shrink-0">
                      <div className="relative h-12 w-12 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <Image
                          src={review.productImage}
                          alt={review.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link
                        href={`/products/${review.productId}`}
                        className="text-xs font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {review.productName}
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
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <p className="mb-2 text-xs text-gray-700 dark:text-gray-300">
                    {review.content}
                  </p>

                  {/* Review Photos */}
                  {review.photos.length > 0 && (
                    <div className="mb-2 flex gap-2">
                      {review.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative h-16 w-16 overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                          <Image
                            src={photo}
                            alt={`리뷰 사진 ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ))}
                      {review.photos.length > 0 && (
                        <div className="flex items-center">
                          <span className="bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            포토리뷰
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-.971a3.75 3.75 0 00-1.156-.18H6.75v-8.25h.133c.356 0 .697.088 1.002.247z" />
                      </svg>
                      {review.likes}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        수정
                      </button>
                      <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                        삭제
                      </button>
                    </div>
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
