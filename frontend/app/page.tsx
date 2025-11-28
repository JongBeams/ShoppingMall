'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Product {
  id: string;
  name: string;
  price: number;
  thumbnail_url?: string;
  vendor_name?: string;
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  recipient_name: string;
  created_at: string;
  items?: any[];
}

interface Notice {
  id: string;
  title: string;
  created_at: string;
}

interface FAQ {
  id: string;
  question: string;
}

export default function Home() {
  const [userType, setUserType] = useState<string>('');
  const [bestProducts, setBestProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  // 판매자용 데이터
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [sellerDataLoading, setSellerDataLoading] = useState(true);
  // 공지사항, FAQ 데이터
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [faqsLoading, setFaqsLoading] = useState(true);

  // 할인 중인지 확인하는 함수
  const isOnSale = (product: Product) => {
    if (!product.discount_price || !product.discount_start || !product.discount_end) return false;
    const now = new Date();
    return now >= new Date(product.discount_start) && now <= new Date(product.discount_end);
  };

  // 할인율 계산
  const getDiscountPercent = (product: Product) => {
    if (!isOnSale(product) || !product.discount_price) return 0;
    return Math.round((1 - product.discount_price / product.price) * 100);
  };

  // 로그인 상태 확인
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserType(userData.user_type || '');
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  // 상품 목록 가져오기 (구매자용)
  useEffect(() => {
    if (userType === 'seller') return; // 판매자면 스킵

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.products || data;
          setBestProducts(allProducts.slice(0, 6));

          // 특가 상품: 할인 중인 상품만 필터링 후 할인율 높은 순으로 정렬
          const now = new Date();
          const onSaleProducts = allProducts
            .filter((p: Product) => {
              if (!p.discount_price || !p.discount_start || !p.discount_end) return false;
              return now >= new Date(p.discount_start) && now <= new Date(p.discount_end);
            })
            .sort((a: Product, b: Product) => {
              const aPercent = a.discount_price ? Math.round((1 - a.discount_price / a.price) * 100) : 0;
              const bPercent = b.discount_price ? Math.round((1 - b.discount_price / b.price) * 100) : 0;
              return bPercent - aPercent;
            })
            .slice(0, 6);
          setDiscountProducts(onSaleProducts);
        }
      } catch (error) {
        console.error('상품 로딩 실패:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [userType]);

  // 판매자용 데이터 가져오기 (내 상품, 내 주문)
  useEffect(() => {
    if (userType !== 'seller') return;

    const fetchSellerData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      setSellerDataLoading(true);
      try {
        // 내 상품 가져오기
        const productsRes = await fetch(`${API_BASE_URL}/products/management`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (productsRes.ok) {
          const data = await productsRes.json();
          setMyProducts((data.products || data).slice(0, 6));
        }

        // 내 주문 가져오기
        const ordersRes = await fetch(`${API_BASE_URL}/vendors/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setMyOrders((data.orders || data).slice(0, 4));
        }
      } catch (error) {
        console.error('판매자 데이터 로딩 실패:', error);
      } finally {
        setSellerDataLoading(false);
      }
    };

    fetchSellerData();
  }, [userType]);

  // 공지사항 가져오기
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notices?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setNotices(data);
        }
      } catch (error) {
        console.error('공지사항 로딩 실패:', error);
      } finally {
        setNoticesLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // FAQ 가져오기
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/faqs?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
        }
      } catch (error) {
        console.error('FAQ 로딩 실패:', error);
      } finally {
        setFaqsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const [dealPage, setDealPage] = useState(0);
  const [bestPage, setBestPage] = useState(0);

  const dealsPerPage = 2;
  const totalDealPages = Math.ceil(discountProducts.length / dealsPerPage) || 1;
  const totalBestPages = Math.ceil(bestProducts.length / dealsPerPage);

  // 판매자용 홈 화면
  if (userType === 'seller') {
    return (
      <div>
        {/* Main Banner - 판매자 대시보드 */}
        <section className="relative -mt-8 h-[350px] overflow-hidden bg-white dark:bg-gray-900">
          <Image
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80"
            alt="Seller Dashboard Banner"
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
              <p className="mb-2 text-xs font-medium tracking-wider">SELLER DASHBOARD</p>
              <h1 className="mb-3 text-4xl font-bold">판매자 센터</h1>
              <p className="mb-5 text-base">오늘도 성공적인 판매를 응원합니다</p>
              <Link
                href="/mypage#products"
                className="inline-block bg-white px-6 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
              >
                상품 등록하기
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
                  name: '상품등록',
                  href: '/mypage#products',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  ),
                  gradient: 'from-blue-400 to-cyan-400'
                },
                {
                  name: '상품관리',
                  href: '/mypage#products',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  ),
                  gradient: 'from-pink-400 to-rose-400'
                },
                {
                  name: '주문관리',
                  href: '/mypage#delivery',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  ),
                  gradient: 'from-purple-400 to-pink-400'
                },
                {
                  name: '배송관리',
                  href: '/mypage#delivery',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  ),
                  gradient: 'from-orange-400 to-amber-400'
                },
                {
                  name: '매출통계',
                  href: '/mypage#sales',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  gradient: 'from-green-400 to-emerald-400'
                },
                {
                  name: '정산관리',
                  href: '/mypage#settlement',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  gradient: 'from-red-400 to-orange-400'
                },
                {
                  name: '고객문의',
                  href: '/mypage#inquiries',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  ),
                  gradient: 'from-indigo-400 to-blue-400'
                },
                {
                  name: '쿠폰관리',
                  href: '/mypage#seller-coupons',
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  ),
                  gradient: 'from-yellow-400 to-orange-400'
                },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
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
          {/* 오늘의 주문 */}
          <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">오늘의 주문</h2>
                <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-bold">{myOrders.length}건</span>
                </div>
              </div>
              <Link href="/mypage#delivery" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
                +
              </Link>
            </div>
            <div className="space-y-3">
              {sellerDataLoading ? (
                <p className="text-center text-xs text-gray-500">로딩 중...</p>
              ) : myOrders.length === 0 ? (
                <p className="text-center text-xs text-gray-500">주문이 없습니다.</p>
              ) : (
                myOrders.slice(0, 2).map((order) => (
                  <Link
                    key={order.id}
                    href="/mypage#delivery"
                    className="group flex gap-3"
                  >
                    <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <div className="absolute left-0 top-0 bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">
                        {order.status === 'pending' ? '대기' : order.status === 'paid' ? '결제' : order.status === 'shipped' ? '배송' : '완료'}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{order.recipient_name}</p>
                      <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                        주문 #{order.id.slice(0, 8)}
                      </h3>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Number(order.total_amount).toLocaleString()}원
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-center gap-1">
              <button
                className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ‹
              </button>
              <button className="h-6 w-6 border border-gray-900 bg-gray-900 text-xs font-bold text-white dark:border-white dark:bg-white dark:text-gray-900">
                1
              </button>
              <button className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
                2
              </button>
              <button className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
                3
              </button>
              <button
                className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ›
              </button>
            </div>
          </div>

          {/* 인기 상품 */}
          <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">인기 상품</h2>
              <Link href="/mypage#products" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
                +
              </Link>
            </div>
            <div className="space-y-3">
              {sellerDataLoading ? (
                <p className="text-center text-xs text-gray-500">로딩 중...</p>
              ) : myProducts.length === 0 ? (
                <p className="text-center text-xs text-gray-500">상품이 없습니다.</p>
              ) : (
                myProducts.slice(0, 2).map((product, idx) => (
                  <Link
                    key={product.id}
                    href="/mypage#products"
                    className="group flex gap-3"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      {product.thumbnail_url ? (
                        <Image
                          src={product.thumbnail_url}
                          alt={product.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{product.vendor_name || ''}</p>
                      <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Number(product.price).toLocaleString()}원
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-center gap-1">
              <button
                className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ‹
              </button>
              <button className="h-6 w-6 border border-gray-900 bg-gray-900 text-xs font-bold text-white dark:border-white dark:bg-white dark:text-gray-900">
                1
              </button>
              <button className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
                2
              </button>
              <button className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
                3
              </button>
              <button
                className="h-6 w-6 border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ›
              </button>
            </div>
          </div>

          {/* 공지사항 */}
          <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">공지사항</h2>
              <Link href="/notice" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
                +
              </Link>
            </div>
            <div className="space-y-2.5">
              {noticesLoading ? (
                <p className="text-center text-xs text-gray-500">로딩 중...</p>
              ) : notices.length === 0 ? (
                <p className="text-center text-xs text-gray-500">공지사항이 없습니다.</p>
              ) : (
                notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`/notice/${notice.id}`}
                    className="flex items-start justify-between border-b border-gray-100 pb-2.5 last:border-b-0 dark:border-gray-800"
                  >
                    <span className="line-clamp-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      {notice.title}
                    </span>
                    <span className="ml-2 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                      {new Date(notice.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')}
                    </span>
                  </Link>
                ))
              )}
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
              {faqsLoading ? (
                <p className="text-center text-xs text-gray-500">로딩 중...</p>
              ) : faqs.length === 0 ? (
                <p className="text-center text-xs text-gray-500">FAQ가 없습니다.</p>
              ) : (
                faqs.map((faq) => (
                  <Link
                    key={faq.id}
                    href="/faq"
                    className="flex items-start gap-2 border-b border-gray-100 pb-2.5 last:border-b-0 dark:border-gray-800"
                  >
                    <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                      Q.
                    </span>
                    <span className="line-clamp-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      {faq.question}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="border-y border-gray-200 bg-gray-50 py-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { icon: '📦', title: '배송대행', desc: '전국 당일배송' },
              { icon: '💳', title: '안전결제', desc: '구매안전서비스' },
              { icon: '📊', title: '실시간 통계', desc: '매출 분석' },
              { icon: '🎯', title: '마케팅 지원', desc: '광고 무료 지원' }
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
            자주 사용하는 기능
          </h2>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {['상품등록', '재고관리', '주문조회', '배송관리', '정산내역', '통계분석', '고객문의', '리뷰관리'].map((func) => (
              <Link
                key={func}
                href={
                  func === '상품등록' ? '/mypage#products' :
                  func === '재고관리' ? '/mypage#products' :
                  func === '주문조회' ? '/mypage#delivery' :
                  func === '배송관리' ? '/mypage#delivery' :
                  func === '정산내역' ? '/mypage#settlement' :
                  func === '통계분석' ? '/mypage#sales' :
                  func === '고객문의' ? '/mypage#inquiries' :
                  '/mypage#reviews'
                }
                className="flex aspect-square items-center justify-center border border-gray-200 bg-white text-center text-xs font-medium text-gray-700 transition hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-white"
              >
                {func}
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 구매자용 홈 화면 (기본)
  return (
    <div>
      {/* Main Banner - 작게 */}
      <section className="relative -mt-8 h-[350px] overflow-hidden bg-white dark:bg-gray-900">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="Main Banner"
          fill
          className="object-cover"
          priority={userType !== 'seller'}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.5 4h-8.409c-1.23 0-3.5 1.031-3.5 2.5v1a1.5 1.5 0 0 0 1 1.415V14H6.5A4.505 4.505 0 0 0 2 18.5 2.5 2.5 0 0 0 4.5 21h9a2.5 2.5 0 0 0 2.449-2h4.521a.5.5 0 0 0 .5-.5V8.925A1.5 1.5 0 0 0 22 7.5v-1C22 4.974 19.7 4 18.5 4zM8.091 8a.5.5 0 0 1-.5-.5v-1c0-.627 1.358-1.346 2.243-1.474A1.977 1.977 0 0 0 9 6.5v1a1.5 1.5 0 0 0 1 1.415V14H8.591V8.5a.5.5 0 0 0-.5-.5zM13.5 20h-9A1.5 1.5 0 0 1 3 18.5a3.5 3.5 0 0 1 2.7-3.4 4.9 4.9 0 0 0-1.2 2.311.5.5 0 0 0 .4.581.463.463 0 0 0 .09.008.5.5 0 0 0 .491-.411A4.737 4.737 0 0 1 7.258 15h1.489a4.977 4.977 0 0 0-1.288 2.411.5.5 0 0 0 .4.581.463.463 0 0 0 .09.008.5.5 0 0 0 .491-.411A4.737 4.737 0 0 1 10.216 15H11.5c.066 0 .127.016.192.019a4.933 4.933 0 0 0-1.275 2.392.5.5 0 0 0 .4.581.473.473 0 0 0 .093.008.5.5 0 0 0 .491-.411 4.431 4.431 0 0 1 1.4-2.274.421.421 0 0 0 .035-.048A3.5 3.5 0 0 1 15 18.5a1.5 1.5 0 0 1-1.5 1.5zM21 7.5a.508.508 0 0 1-.53.5.5.5 0 0 0-.5.5V18h-4.021a4.49 4.49 0 0 0-4.449-4H11V8.5a.5.5 0 0 0-.5-.5.5.5 0 0 1-.5-.5v-1c0-.69 1.652-1.5 2.5-1.5h6c.987 0 2.5.8 2.5 1.5z" />
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
            {productsLoading ? (
              <p className="text-center text-xs text-gray-500">로딩 중...</p>
            ) : discountProducts.length === 0 ? (
              <p className="text-center text-xs text-gray-500">특가 상품이 없습니다.</p>
            ) : (
              discountProducts.slice(dealPage * dealsPerPage, (dealPage + 1) * dealsPerPage).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex gap-3"
                >
                  <div className="relative h-24 w-24 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                    {product.thumbnail_url ? (
                      <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute left-0 top-0 bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {getDiscountPercent(product)}%
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{product.vendor_name || ''}</p>
                    <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Math.floor(product.discount_price || 0).toLocaleString()}원
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {Math.floor(product.price).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
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
            {productsLoading ? (
              <p className="text-center text-xs text-gray-500">로딩 중...</p>
            ) : bestProducts.length === 0 ? (
              <p className="text-center text-xs text-gray-500">상품이 없습니다.</p>
            ) : (
              bestProducts.slice(bestPage * dealsPerPage, (bestPage + 1) * dealsPerPage).map((product, idx) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex gap-3"
                >
                  <div className="relative h-24 w-24 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                    {product.thumbnail_url ? (
                      <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                      {bestPage * dealsPerPage + idx + 1}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{product.vendor_name || ''}</p>
                    <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(product.price).toLocaleString()}원
                    </span>
                  </div>
                </Link>
              ))
            )}
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
            {noticesLoading ? (
              <p className="text-center text-xs text-gray-500">로딩 중...</p>
            ) : notices.length === 0 ? (
              <p className="text-center text-xs text-gray-500">공지사항이 없습니다.</p>
            ) : (
              notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notice/${notice.id}`}
                  className="flex items-start justify-between border-b border-gray-100 pb-2.5 last:border-b-0 dark:border-gray-800"
                >
                  <span className="line-clamp-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    {notice.title}
                  </span>
                  <span className="ml-2 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {new Date(notice.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')}
                  </span>
                </Link>
              ))
            )}
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
            {faqsLoading ? (
              <p className="text-center text-xs text-gray-500">로딩 중...</p>
            ) : faqs.length === 0 ? (
              <p className="text-center text-xs text-gray-500">FAQ가 없습니다.</p>
            ) : (
              faqs.map((faq) => (
                <Link
                  key={faq.id}
                  href="/faq"
                  className="flex items-start gap-2 border-b border-gray-100 pb-2.5 last:border-b-0 dark:border-gray-800"
                >
                  <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    Q.
                  </span>
                  <span className="line-clamp-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    {faq.question}
                  </span>
                </Link>
              ))
            )}
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
