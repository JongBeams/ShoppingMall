'use client';

import { useState } from 'react';

export default function Coupons() {
  const [activeFilter, setActiveFilter] = useState<'available' | 'used' | 'expired'>('available');

  const coupons = [
    {
      id: 1,
      name: '신규 회원 10% 할인',
      discount: '10%',
      minAmount: 50000,
      maxDiscount: 30000,
      expiryDate: '2025.02.16',
      status: 'available',
      code: 'NEW10'
    },
    {
      id: 2,
      name: '겨울 시즌 20% 할인',
      discount: '20%',
      minAmount: 100000,
      maxDiscount: 50000,
      expiryDate: '2025.01.31',
      status: 'available',
      code: 'WINTER20'
    },
    {
      id: 3,
      name: 'VIP 회원 30% 할인',
      discount: '30%',
      minAmount: 200000,
      maxDiscount: 100000,
      expiryDate: '2025.03.31',
      status: 'available',
      code: 'VIP30'
    },
    {
      id: 4,
      name: '첫 구매 5천원 할인',
      discount: '5,000원',
      minAmount: 30000,
      maxDiscount: 5000,
      expiryDate: '2025.01.15',
      status: 'used',
      code: 'FIRST5K'
    },
    {
      id: 5,
      name: '크리스마스 15% 할인',
      discount: '15%',
      minAmount: 80000,
      maxDiscount: 40000,
      expiryDate: '2024.12.25',
      status: 'expired',
      code: 'XMAS15'
    },
  ];

  const filteredCoupons = coupons.filter(c => c.status === activeFilter);

  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">쿠폰함</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          보유 중인 쿠폰을 확인하고 사용하세요
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('available')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'available'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            사용 가능 ({coupons.filter(c => c.status === 'available').length})
          </button>
          <button
            onClick={() => setActiveFilter('used')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'used'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            사용 완료 ({coupons.filter(c => c.status === 'used').length})
          </button>
          <button
            onClick={() => setActiveFilter('expired')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'expired'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            기간 만료 ({coupons.filter(c => c.status === 'expired').length})
          </button>
        </div>
      </div>

      {/* Coupon List */}
      <div>
        {filteredCoupons.length > 0 ? (
          <div className="space-y-3">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`relative overflow-hidden border p-3 ${
                  coupon.status === 'available'
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                {/* Coupon Badge */}
                <div className="absolute right-0 top-0">
                  {coupon.status === 'available' && (
                    <div className="bg-blue-600 px-2 py-1 text-xs font-medium text-white dark:bg-blue-500">
                      사용가능
                    </div>
                  )}
                  {coupon.status === 'used' && (
                    <div className="bg-gray-600 px-2 py-1 text-xs font-medium text-white">
                      사용완료
                    </div>
                  )}
                  {coupon.status === 'expired' && (
                    <div className="bg-red-600 px-2 py-1 text-xs font-medium text-white">
                      기간만료
                    </div>
                  )}
                </div>

                <div className="pr-16">
                  <h3 className="mb-1 text-xs font-bold text-gray-900 dark:text-white">
                    {coupon.name}
                  </h3>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {coupon.discount}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">할인</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>• 최소 주문금액: {coupon.minAmount.toLocaleString()}원</p>
                    <p>• 최대 할인금액: {coupon.maxDiscount.toLocaleString()}원</p>
                    <p>• 유효기간: {coupon.expiryDate}까지</p>
                    <p className="mt-2 font-mono text-gray-900 dark:text-white">
                      쿠폰코드: <span className="font-bold">{coupon.code}</span>
                    </p>
                  </div>
                </div>

                {coupon.status === 'available' && (
                  <button className="mt-3 w-full border border-gray-900 bg-gray-900 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                    쇼핑하러 가기
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3v.75m-9-6v.75m0 3v.75m-3 0h15a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v6.75a2.25 2.25 0 002.25 2.25zm13.5-9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v6.75a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25V6z" />
            </svg>
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              {activeFilter === 'available' && '사용 가능한 쿠폰이 없습니다'}
              {activeFilter === 'used' && '사용한 쿠폰이 없습니다'}
              {activeFilter === 'expired' && '만료된 쿠폰이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
