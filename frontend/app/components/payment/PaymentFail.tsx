'use client';

import { useEffect } from 'react';

interface PaymentFailProps {
  resultStorageKey: string;
  errorCode: string | null;
  errorMessage: string | null;
}

export default function PaymentFail({ resultStorageKey, errorCode, errorMessage }: PaymentFailProps) {
  useEffect(() => {
    // 실패 상태 저장
    sessionStorage.setItem(resultStorageKey, JSON.stringify({
      success: false,
      error: errorMessage || '결제가 취소되었습니다.'
    }));
    sessionStorage.removeItem('checkoutData');

    // 5초 후 창 닫기
    setTimeout(() => {
      window.close();
    }, 5000);
  }, [errorMessage, resultStorageKey]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">결제 실패</h1>
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
          {errorMessage || '결제가 취소되었습니다.'}
        </p>
        {errorCode && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            오류 코드: {errorCode}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          잠시 후 창이 자동으로 닫힙니다...
        </p>
      </div>
    </div>
  );
}
