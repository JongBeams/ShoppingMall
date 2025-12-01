'use client';

import Image from 'next/image';

export default function AboutPage() {
  return (
    <div>
      {/* Hero Banner */}
      <section className="relative -mt-8 h-[350px] overflow-hidden bg-white dark:bg-gray-900">
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
          alt="About Us Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-purple-700/70"></div>

        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wider uppercase">About Us</p>
            <h1 className="mb-5 text-4xl font-bold">회사 소개</h1>
            <p className="text-base">최고의 쇼핑 경험을 제공하는 온라인 플랫폼</p>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-400">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">빠른 배송</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            당일 출고 및 익일 배송으로<br />빠르게 받아보세요
          </p>
        </div>

        <div className="border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">안전한 결제</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            다양한 결제 수단과<br />보안 시스템을 제공합니다
          </p>
        </div>

        <div className="border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-400">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">고객 만족</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            365일 고객센터 운영으로<br />언제든 도와드립니다
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-blue-400">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">우리의 비전</h2>
          </div>
          <p className="leading-relaxed text-gray-600 dark:text-gray-400">
            고객 만족을 최우선으로 생각하며, 품질 좋은 상품을 합리적인 가격에 제공하고자 합니다.
            빠른 배송과 안전한 결제 시스템을 통해 신뢰할 수 있는 쇼핑 환경을 만들어갑니다.
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>고품질 상품 엄선</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>합리적인 가격 정책</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>신뢰할 수 있는 서비스</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-rose-400">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">회사 정보</h2>
          </div>
          <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
            ShopLogo는 고객에게 최고의 쇼핑 경험을 제공하는 것을 목표로 하는 온라인 쇼핑몰입니다.
            심플하고 세련된 디자인과 사용하기 편리한 인터페이스로 누구나 쉽게 원하는 상품을 찾을 수 있습니다.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">이메일</p>
                <p className="text-gray-600 dark:text-gray-400">contact@shoplogo.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">전화</p>
                <p className="text-gray-600 dark:text-gray-400">1234-5678</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">주소</p>
                <p className="text-gray-600 dark:text-gray-400">서울특별시 강남구</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 상품</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">5,678</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 8% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-purple-100 dark:bg-purple-900">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 회원</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">1,234</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 12% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-blue-100 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">판매자</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">156</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 5% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-green-100 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">리뷰</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">8,432</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 20% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
