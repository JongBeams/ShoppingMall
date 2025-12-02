'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentSuccess from '@/app/components/payment/PaymentSuccess';

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  return (
    <PaymentSuccess
      paymentType="subscription"
      confirmEndpoint="/subscription/confirm"
      resultStorageKey="subscriptionPaymentResult"
      orderId={orderId}
      paymentKey={paymentKey}
      amount={amount}
    />
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
