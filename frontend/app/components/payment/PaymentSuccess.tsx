'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface PaymentSuccessProps {
  paymentType: 'subscription' | 'order';
  confirmEndpoint: string;
  resultStorageKey: string;
  orderId: string | null;
  paymentKey: string | null;
  amount: string | null;
}

export default function PaymentSuccess({
  paymentType,
  confirmEndpoint,
  resultStorageKey,
  orderId,
  paymentKey,
  amount,
}: PaymentSuccessProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState(
    paymentType === 'subscription' ? '구독 처리 중입니다...' : '주문 처리 중입니다...'
  );

  useEffect(() => {
    confirmPayment();
  }, []);

  const confirmPayment = async () => {
    try {
      if (!orderId || !paymentKey || !amount) {
        throw new Error('필수 결제 정보가 누락되었습니다.');
      }

      // sessionStorage에서 결제 정보 가져오기
      const checkoutDataStr = sessionStorage.getItem('checkoutData');
      if (!checkoutDataStr) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      const checkoutData = JSON.parse(checkoutDataStr);

      // 백엔드에 결제 승인 요청
      const token = localStorage.getItem('access_token');

      // 요청 본문 구성 (결제 타입에 따라 다름)
      const requestBody = {
        orderId,
        paymentKey,
        amount: parseInt(amount),
        ...(paymentType === 'subscription' ? { planId: checkoutData.planId } : {}),
      };

      const response = await fetch(`${API_BASE_URL}${confirmEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '처리에 실패했습니다.');
      }

      const result = await response.json();

      // 성공 상태 저장
      sessionStorage.setItem(resultStorageKey, JSON.stringify({ success: true, data: result }));
      sessionStorage.removeItem('checkoutData');

      setStatus('success');
      setMessage(
        paymentType === 'subscription' ? '구독이 완료되었습니다!' : '주문이 완료되었습니다!'
      );

      // 3초 후 창 닫기
      setTimeout(() => {
        window.close();
      }, 3000);

    } catch (err: any) {
      console.error('처리 실패:', err);
      setStatus('error');
      setMessage(err.message || '처리에 실패했습니다.');

      // 실패 상태 저장
      sessionStorage.setItem(resultStorageKey, JSON.stringify({ success: false, error: err.message }));

      // 5초 후 창 닫기
      setTimeout(() => {
        window.close();
      }, 5000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-6xl">✅</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              {paymentType === 'subscription' ? '구독 완료!' : '주문 완료!'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              잠시 후 창이 자동으로 닫힙니다...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-6xl">❌</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              {paymentType === 'subscription' ? '구독 실패' : '주문 실패'}
            </h1>
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              잠시 후 창이 자동으로 닫힙니다...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
