'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentAPI } from '@/app/lib/api';
import { cartAPI } from '@/app/lib/api';

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
        // 1단계: 주문 생성 (order_number 생성)
        setMessage('주문 생성 중...');

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
          toss_order_id: orderId,  // 토스가 전달한 nanoid 저장
          points_used: checkoutData.pointsUsed || 0,  // 사용한 포인트
        };

        const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.detail || '주문 생성에 실패했습니다.');
        }

        const orderResult = await orderResponse.json();
        console.log('주문 생성 완료:', orderResult);

        // 2단계: 토스페이먼츠 결제 승인 + DB 업데이트
        // 중요: 생성된 order_number를 사용 (토스가 전달한 orderId가 아님)
        setMessage('결제 승인 처리 중...');

        const paymentResult = await paymentAPI.confirmTossPayment(
          paymentKey,
          orderId,  // 토스가 전달한 원본 orderId 사용 (nanoid)
          parseInt(amount),
          token
        );

        console.log('==================== Payment 객체 정보 ====================');
        console.log('📦 결제 승인 완료:', paymentResult);
        console.log(' 주문 ID:', paymentResult.order_id);
        console.log(' 주문 번호:', paymentResult.order_number);
        console.log(' 결제 키:', paymentResult.payment_key);
        console.log(' 결제 상태:', paymentResult.payment_status);
        console.log(' 결제 금액:', paymentResult.total_amount);
        console.log(' 승인 시각:', paymentResult.approved_at);
        console.log('==========================================================');

        // 3단계: 장바구니 비우기
        setMessage('주문 완료 처리 중...');
        try {
          await cartAPI.clear(token);
          // 장바구니 업데이트 이벤트 발생
          if (window.opener) {
            window.opener.dispatchEvent(new Event('cartUpdated'));
          }
        } catch (err) {
          console.error('장바구니 비우기 실패:', err);
          // 장바구니 비우기 실패는 무시 (결제는 이미 완료됨)
        }

        // sessionStorage 정리
        sessionStorage.removeItem('checkoutData');

        setStatus('success');
        setMessage('결제가 완료되었습니다!');

        // 2초 후 주문 상세 페이지로 이동
        setTimeout(() => {
          if (window.opener) {
            // 부모 창을 주문 상세 페이지로 이동
            window.opener.location.href = `/mypage/orders/${paymentResult.order_id}`;
            window.close();
          } else {
            // opener가 없으면 현재 창에서 이동
            router.push(`/mypage/orders/${paymentResult.order_id}`);
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
