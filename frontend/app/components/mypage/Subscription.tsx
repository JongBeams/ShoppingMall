'use client';

import { useState } from 'react';

export default function Subscription() {
  const [currentPoints, setCurrentPoints] = useState(12500);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const subscriptionPlans = [
    {
      id: 'basic',
      name: '베이직',
      price: 9900,
      points: 10000,
      discount: 0,
      features: ['매월 10,000 포인트 지급', '무료 배송 혜택', '기본 할인 쿠폰']
    },
    {
      id: 'premium',
      name: '프리미엄',
      price: 19900,
      points: 25000,
      discount: 20,
      features: ['매월 25,000 포인트 지급', '무료 배송 혜택', '프리미엄 할인 쿠폰', '신상품 우선 구매']
    },
    {
      id: 'vip',
      name: 'VIP',
      price: 39900,
      points: 55000,
      discount: 30,
      features: ['매월 55,000 포인트 지급', '무료 배송 혜택', 'VIP 전용 쿠폰', '신상품 우선 구매', '전담 CS 지원', '특별 이벤트 초대']
    }
  ];

  const pointHistory = [
    { id: 1, type: '적립', amount: 5000, description: '월간 구독 포인트', date: '2025.01.15' },
    { id: 2, type: '사용', amount: -2500, description: 'AirPods Pro 구매', date: '2025.01.14' },
    { id: 3, type: '적립', amount: 1000, description: '상품 리뷰 작성', date: '2025.01.10' },
    { id: 4, type: '적립', amount: 5000, description: '월간 구독 포인트', date: '2025.01.01' },
  ];

  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Current Points */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">보유 포인트</h2>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currentPoints.toLocaleString()}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">P</span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          1 포인트 = 1원으로 사용 가능
        </p>
      </div>

      {/* Subscription Plans */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">구독 플랜</h2>
        <div className="space-y-2">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`cursor-pointer border p-3 transition ${
                selectedPlan === plan.id
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.discount > 0 && (
                      <span className="bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                        {plan.discount}% 할인
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {plan.points.toLocaleString()}P 지급
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {plan.price.toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/월</p>
                </div>
              </div>
              <ul className="space-y-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="h-3 w-3 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {selectedPlan && (
          <button className="mt-3 w-full border border-gray-900 bg-gray-900 py-2 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
            구독하기
          </button>
        )}
      </div>

      {/* Point History */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">포인트 내역</h2>
        <div className="space-y-2">
          {pointHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 dark:border-gray-800"
            >
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">
                  {item.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.date}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-xs font-bold ${
                    item.type === '적립'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {item.amount > 0 ? '+' : ''}
                  {item.amount.toLocaleString()}P
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
