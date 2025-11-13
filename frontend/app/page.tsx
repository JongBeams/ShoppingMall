'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const bestProducts = [
    {
      id: '1',
      name: 'AirPods Pro',
      brand: 'Apple',
      price: 359000,
      image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&q=80',
      discount: 10,
      rating: 4.8,
      reviews: 1247
    },
    {
      id: '2',
      name: 'Leather Crossbag',
      brand: 'Minimal',
      price: 189000,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
      discount: null,
      rating: 4.6,
      reviews: 892
    },
    {
      id: '3',
      name: 'Smart Watch Ultra',
      brand: 'Apple',
      price: 1099000,
      image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80',
      discount: 5,
      rating: 4.9,
      reviews: 2341
    },
    {
      id: '4',
      name: 'Premium Wallet',
      brand: 'Bellroy',
      price: 125000,
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
      discount: null,
      rating: 4.7,
      reviews: 567
    },
    {
      id: '5',
      name: 'Wireless Keyboard',
      brand: 'Logitech',
      price: 89000,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      discount: 15,
      rating: 4.5,
      reviews: 432
    },
    {
      id: '6',
      name: 'USB-C Hub',
      brand: 'Anker',
      price: 65000,
      image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&q=80',
      discount: null,
      rating: 4.6,
      reviews: 789
    },
  ];

  const [dealPage, setDealPage] = useState(0);
  const [bestPage, setBestPage] = useState(0);

  const dealsPerPage = 2;
  const totalDealPages = Math.ceil(bestProducts.length / dealsPerPage);
  const totalBestPages = Math.ceil(bestProducts.length / dealsPerPage);

  return (
    <div>
      {/* Main Banner - 작게 */}
      <section className="relative -mt-8 h-[350px] overflow-hidden bg-white dark:bg-gray-900">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="Main Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              className={`h-1.5 transition-all ${i === 1 ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wider">2025 WINTER</p>
            <h1 className="mb-3 text-4xl font-bold">NEW ARRIVAL</h1>
            <p className="mb-5 text-base">최대 50% 할인</p>
            <Link
              href="/products"
              className="inline-block bg-white px-6 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
            >
              쇼핑하기
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Menu - App Icon Style */}
      <section className="mt-10 bg-white py-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-4 gap-6 md:grid-cols-8">
            {[
              {
                name: '전자제품',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                gradient: 'from-blue-400 to-cyan-400'
              },
              {
                name: '패션',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: 'from-pink-400 to-rose-400'
              },
              {
                name: '뷰티',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                gradient: 'from-purple-400 to-pink-400'
              },
              {
                name: '생활',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                gradient: 'from-orange-400 to-amber-400'
              },
              {
                name: '식품',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ),
                gradient: 'from-green-400 to-emerald-400'
              },
              {
                name: '스포츠',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                gradient: 'from-red-400 to-orange-400'
              },
              {
                name: '도서',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                gradient: 'from-indigo-400 to-blue-400'
              },
              {
                name: '완구',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: 'from-yellow-400 to-orange-400'
              },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={`/products?category=${cat.name}`}
                className="group flex flex-col items-center gap-2"
              >
                {/* App Icon */}
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} shadow-lg transition-transform duration-200 active:scale-95`}>
                  {/* Glossy effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent"></div>

                  {/* Icon */}
                  <div className="relative z-10 text-white drop-shadow-md">
                    {cat.icon}
                  </div>
                </div>

                {/* Label */}
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products & Info Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Deal */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">오늘의 특가</h2>
              <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold">12:34:56</span>
              </div>
            </div>
            <Link href="/products" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-3">
            {bestProducts.slice(dealPage * dealsPerPage, (dealPage + 1) * dealsPerPage).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex gap-3"
              >
                <div className="relative h-24 w-24 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="96px"
                  />
                  {product.discount && (
                    <div className="absolute left-0 top-0 bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                      {product.discount}%
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
                  <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    {product.discount ? (
                      <>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {(product.price * (1 - product.discount / 100)).toLocaleString()}원
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {product.price.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {product.price.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Pagination */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => setDealPage((p) => Math.max(0, p - 1))}
              disabled={dealPage === 0}
              className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ‹
            </button>
            {Array.from({ length: totalDealPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setDealPage(idx)}
                className={`h-6 w-6 text-xs ${
                  dealPage === idx
                    ? 'border border-gray-900 bg-gray-900 font-bold text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setDealPage((p) => Math.min(totalDealPages - 1, p + 1))}
              disabled={dealPage === totalDealPages - 1}
              className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ›
            </button>
          </div>
        </div>

        {/* Best Products */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">베스트 상품</h2>
            <Link href="/products" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-3">
            {bestProducts.slice(bestPage * dealsPerPage, (bestPage + 1) * dealsPerPage).map((product, idx) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex gap-3"
              >
                <div className="relative h-24 w-24 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="96px"
                  />
                  <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                    {bestPage * dealsPerPage + idx + 1}
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
                  <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {product.price.toLocaleString()}원
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {/* Pagination */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => setBestPage((p) => Math.max(0, p - 1))}
              disabled={bestPage === 0}
              className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ‹
            </button>
            {Array.from({ length: totalBestPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setBestPage(idx)}
                className={`h-6 w-6 text-xs ${
                  bestPage === idx
                    ? 'border border-gray-900 bg-gray-900 font-bold text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setBestPage((p) => Math.min(totalBestPages - 1, p + 1))}
              disabled={bestPage === totalBestPages - 1}
              className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ›
            </button>
          </div>
        </div>

        {/* Notice */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">공지사항</h2>
            <Link href="/notice" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-2.5">
            {[
              { id: 1, title: '설 연휴 배송 안내', date: '01.20' },
              { id: 2, title: '신규 회원 할인 이벤트', date: '01.18' },
              { id: 3, title: '개인정보처리방침 개정 안내', date: '01.15' },
              { id: 4, title: '시스템 점검 안내', date: '01.10' },
            ].map((notice) => (
              <Link
                key={notice.id}
                href={`/notice/${notice.id}`}
                className="flex items-start justify-between border-b border-gray-100 pb-2.5 last:border-b-0 dark:border-gray-800"
              >
                <span className="line-clamp-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  {notice.title}
                </span>
                <span className="ml-2 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                  {notice.date}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">FAQ</h2>
            <Link href="/faq" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              +
            </Link>
          </div>
          <div className="space-y-2.5">
            {[
              { id: 1, title: '배송은 얼마나 걸리나요?' },
              { id: 2, title: '교환/환불 절차는?' },
              { id: 3, title: '회원가입 혜택은?' },
              { id: 4, title: '결제 수단은?' },
            ].map((faq) => (
              <Link
                key={faq.id}
                href={`/faq/${faq.id}`}
                className="flex items-start gap-2 border-b border-gray-100 pb-2.5 last:border-b-0 dark:border-gray-800"
              >
                <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                  Q.
                </span>
                <span className="line-clamp-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  {faq.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="border-y border-gray-200 bg-gray-50 py-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            { icon: '🚚', title: '무료배송', desc: '5만원 이상' },
            { icon: '✓', title: '정품보장', desc: '100% 공식인증' },
            { icon: '↺', title: '무료반품', desc: '30일 이내' },
            { icon: '⭐', title: '적립금', desc: '최대 5%' }
          ].map((benefit) => (
            <div key={benefit.title} className="flex items-center gap-2.5">
              <div className="text-2xl">{benefit.icon}</div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{benefit.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand List */}
      <section className="mt-5">
        <h2 className="mb-6 text-center text-base font-bold text-gray-900 dark:text-white">
          인기 브랜드
        </h2>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          {['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Dyson', 'Canon'].map((brand) => (
            <Link
              key={brand}
              href={`/products?brand=${brand}`}
              className="flex aspect-square items-center justify-center border border-gray-200 bg-white text-center text-xs font-medium text-gray-700 transition hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-white"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
