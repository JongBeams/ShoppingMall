'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentFail from '@/app/components/payment/PaymentFail';

function SubscriptionFailContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <PaymentFail
      resultStorageKey="subscriptionPaymentResult"
      errorCode={errorCode}
      errorMessage={errorMessage}
    />
  );
}

export default function SubscriptionFailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <SubscriptionFailContent />
    </Suspense>
  );
}
