'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'sent'>('loading');

  useEffect(() => {
    // TossPayments에서 제공하는 실패 정보
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    const failureData = {
      success: false,
      code: code || 'UNKNOWN_ERROR',
      message: message || '결제에 실패했습니다.',
      orderId: orderId || null,
    };

    // 부모 창(opener)으로 실패 정보 전달
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'PAYMENT_FAILURE',
          data: failureData,
        },
        window.location.origin
      );

      setStatus('sent');

      // 3초 후 자동으로 창 닫기
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [searchParams]);

  const message = searchParams.get('message') || '결제에 실패했습니다.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">결제 실패</h1>
        
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>

        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          이 창은 자동으로 닫힙니다...
        </p>

        <button
          onClick={() => window.close()}
          className="mt-6 w-full rounded-lg bg-gray-600 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          창 닫기
        </button>
      </div>
    </div>
  );
}
