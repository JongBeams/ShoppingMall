'use client';

import { useState, useEffect } from 'react';
import { subscriptionApi } from '@/app/lib/api';
import { SubscriptionPlan, BuyerFeatures, SellerFeatures } from '@/app/types';

interface SubscriptionProps {
  user?: any;
}

export default function Subscription({ user }: SubscriptionProps) {
  const [currentPoints, setCurrentPoints] = useState(12500);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // 판매자인지 구매자인지 판별
  const isSeller = user?.user_type === 'seller';

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchCurrentSubscription();
  }, [isSeller]);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      // 판매자면 is_buyer=false, 구매자면 is_buyer=true
      const response = await subscriptionApi.getPlans(!isSeller);
      setSubscriptionPlans(response.plans || []);
    } catch (err) {
      console.error('구독 플랜 조회 실패:', err);
      setError('구독 플랜을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('로그인된 사용자가 아닙니다.');
        return;
      }

      const response = await subscriptionApi.getCurrentSubscription(token);
      console.log('현재 구독 정보:', response);

      if (response.has_subscription) {
        console.log('활성 구독:', response.subscription);
        console.log('구독 플랜:', response.subscription.subscription_plans);
        console.log('구독 시작일:', response.subscription.started_at);
        console.log('구독 종료일:', response.subscription.ended_at);
        console.log('구독 기능:', response.subscription.features);

        // 현재 구독 정보 저장
        setCurrentSubscription(response.subscription);

        // 현재 구독 중인 플랜을 자동으로 선택
        if (response.subscription.subscription_plan_id) {
          setSelectedPlan(response.subscription.subscription_plan_id);
        }
      } else {
        console.log('활성 구독이 없습니다.');
        setCurrentSubscription(null);
      }
    } catch (err) {
      console.error('현재 구독 정보 조회 실패:', err);
      setCurrentSubscription(null);
    }
  };

  // 구독하기 버튼 클릭 시 결제 처리
  const handleSubscribe = () => {
    if (!selectedPlan) {
      alert('구독 플랜을 선택해주세요.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
      return;
    }

    // 선택한 플랜 찾기
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (!plan) {
      alert('선택한 플랜을 찾을 수 없습니다.');
      return;
    }

    setSubmitting(true);

    // sessionStorage에 구독 결제 데이터 저장
    const checkoutData = {
      amount: plan.price,
      orderName: `${plan.name} 구독`,
      email: user?.email || '',
      paymentType: 'subscription',
      planId: plan.id,
      planName: plan.name,
      duration_days: plan.duration_days,
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // 결제 팝업 열기
    const popup = window.open(
      '/subscription/checkout',
      'subscription-payment',
      'width=800,height=700,left=100,top=100'
    );

    if (!popup) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      setSubmitting(false);
      return;
    }

    // 팝업이 닫혔을 때 처리
    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        setSubmitting(false);

        // 결제 완료 여부 확인
        const paymentResult = sessionStorage.getItem('subscriptionPaymentResult');
        if (paymentResult) {
          const result = JSON.parse(paymentResult);
          sessionStorage.removeItem('subscriptionPaymentResult');

          if (result.success) {
            alert('구독이 완료되었습니다!');
            // 구독 정보 새로고침
            fetchSubscriptionPlans();
            fetchCurrentSubscription();
          }
        }
      }
    }, 500);
  };

  // Type guard to check if features are buyer features
  const isBuyerFeatures = (features: BuyerFeatures | SellerFeatures): features is BuyerFeatures => {
    return 'points' in features;
  };

  // features를 UI에 맞게 변환
  const getFeaturesList = (plan: SubscriptionPlan): string[] => {
    const features: string[] = [];

    if (isBuyerFeatures(plan.features)) {
      // Buyer features
      if (plan.features.points) {
        features.push(`매월 ${plan.features.points.amount.toLocaleString()} 포인트 지급`);
      }

      if (plan.features.shipping === 'free') {
        features.push('무료 배송 혜택');
      }

      if (plan.features.coupon_tier === 'basic') {
        features.push('기본 할인 쿠폰');
      } else if (plan.features.coupon_tier === 'premium') {
        features.push('프리미엄 할인 쿠폰');
      } else if (plan.features.coupon_tier === 'vip') {
        features.push('VIP 전용 쿠폰');
      }

      if (plan.features.early_access) {
        features.push('신상품 우선 구매');
      }

      if (plan.features.cs_level === 'priority') {
        features.push('전담 CS 지원');
      }

      if (plan.features.event_invites) {
        features.push('특별 이벤트 초대');
      }
    } else {
      // Seller features
      if (plan.features.product_limit) {
        const limit = plan.features.product_limit === 'unlimited' ? '무제한' : `최대 ${plan.features.product_limit}개`;
        features.push(`상품 등록 ${limit}`);
      }

      if (plan.features.coupon_issue) {
        features.push('쿠폰 발행 가능');
      }

      if (plan.features.promo_slots) {
        const slots = plan.features.promo_slots === 'unlimited' ? '무제한' : `${plan.features.promo_slots}개`;
        features.push(`프로모션 슬롯 ${slots}`);
      }

      if (plan.features.ads_included) {
        const ads = plan.features.ads_included === 'unlimited' ? '무제한' : `${plan.features.ads_included}회`;
        features.push(`광고 포함 ${ads}`);
      }

      if (plan.features.api_access) {
        features.push('API 접근 권한');
      }

      if (plan.features.cs_level === 'priority') {
        features.push('우선 CS 지원');
      } else if (plan.features.cs_level === 'dedicated') {
        features.push('전담 CS 매니저');
      }
    }

    return features;
  };

  const pointHistory = [
    { id: 1, type: '적립', amount: 5000, description: '월간 구독 포인트', date: '2025.01.15' },
    { id: 2, type: '사용', amount: -2500, description: 'AirPods Pro 구매', date: '2025.01.14' },
    { id: 3, type: '적립', amount: 1000, description: '상품 리뷰 작성', date: '2025.01.10' },
    { id: 4, type: '적립', amount: 5000, description: '월간 구독 포인트', date: '2025.01.01' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">구독 플랜을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

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
          {subscriptionPlans.map((plan) => {
            const featuresList = getFeaturesList(plan);
            return (
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
                      {plan.commission_discount > 0 && (
                        <span className="bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                          {plan.commission_discount}% 할인
                        </span>
                      )}
                    </div>
                    {isBuyerFeatures(plan.features) && plan.features.points && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        {plan.features.points.amount.toLocaleString()}P 지급
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {plan.price.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">/월</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {featuresList.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="h-3 w-3 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {selectedPlan && (
          <button
            onClick={handleSubscribe}
            disabled={submitting || (currentSubscription?.subscription_plan_id === selectedPlan)}
            className="mt-3 w-full border border-gray-900 bg-gray-900 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {submitting
              ? '처리 중...'
              : currentSubscription?.subscription_plan_id === selectedPlan
              ? '구독 중'
              : '구독하기'}
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
