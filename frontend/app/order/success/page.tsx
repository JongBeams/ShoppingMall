'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 처리 중...');

  useEffect(() => {
    const processPayment = async () => {
      // TossPayments에서 제공하는 쿼리 파라미터
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setMessage('결제 정보를 확인할 수 없습니다.');
        return;
      }

      // sessionStorage에서 주문 데이터 가져오기
      const checkoutDataStr = sessionStorage.getItem('checkoutData');
      if (!checkoutDataStr) {
        setStatus('error');
        setMessage('주문 정보를 찾을 수 없습니다.');
        return;
      }

      const checkoutData = JSON.parse(checkoutDataStr);
      const token = localStorage.getItem('access_token');

      if (!token) {
        setStatus('error');
        setMessage('로그인이 필요합니다.');
        return;
      }

      try {
        setMessage('주문 생성 중...');

        // 백엔드에 주문 생성 요청
        const orderData = {
          items: checkoutData.items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product_price,
            selected_options: item.selected_options || [],
          })),
          total_amount: checkoutData.amount,
          recipient_name: checkoutData.recipient_name,
          recipient_phone: checkoutData.recipient_phone,
          postal_code: checkoutData.postal_code,
          address: checkoutData.address,
          address_detail: checkoutData.address_detail,
          delivery_message: checkoutData.delivery_message,
          payment_method: checkoutData.payment_method,
          payment_key: paymentKey,
          toss_order_id: orderId,
        };

        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '주문에 실패했습니다.');
        }

        const result = await response.json();

        // 장바구니 비우기
        try {
          await fetch(`${API_BASE_URL}/cart/clear`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // 장바구니 업데이트 이벤트 발생
          if (window.opener) {
            window.opener.dispatchEvent(new Event('cartUpdated'));
          }
        } catch (err) {
          console.error('장바구니 비우기 실패:', err);
        }

        // sessionStorage 정리
        sessionStorage.removeItem('checkoutData');

        setStatus('success');
        setMessage('주문이 완료되었습니다!');

        // 2초 후 주문 상세 페이지로 이동
        setTimeout(() => {
          if (window.opener) {
            // 부모 창을 주문 상세 페이지로 이동
            window.opener.location.href = `/mypage/orders/${result.order_id}`;
            window.close();
          } else {
            // opener가 없으면 현재 창에서 이동
            router.push(`/mypage/orders/${result.order_id}`);
          }
        }, 2000);

      } catch (err: any) {
        console.error('주문 실패:', err);
        setStatus('error');
        setMessage(err.message || '주문 중 오류가 발생했습니다.');

        // 에러 발생 시 부모 창에 실패 메시지 전달
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'PAYMENT_FAILURE',
              data: {
                success: false,
                message: err.message || '주문 중 오류가 발생했습니다.',
              },
            },
            window.location.origin
          );
        }
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        {status === 'loading' && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{message}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              잠시만 기다려주세요.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{message}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              주문 내역 페이지로 이동합니다.
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              이 창은 자동으로 닫힙니다...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">오류 발생</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <button
              onClick={() => window.close()}
              className="mt-6 w-full rounded-lg bg-gray-600 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              창 닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
