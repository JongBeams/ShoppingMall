'use client';

import { useEffect, useState } from 'react';
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk';
import styles from './style.module.css';

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

interface PaymentCheckoutProps {
  successUrl: string;
  failUrl: string;
}

export default function PaymentCheckout({ successUrl, failUrl }: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initPayment();
  }, []);

  const initPayment = async () => {
    try {
      // sessionStorage에서 결제 데이터 가져오기
      const checkoutDataStr = sessionStorage.getItem('checkoutData');
      if (!checkoutDataStr) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      const checkoutData = JSON.parse(checkoutDataStr);

      // orderId 생성 (구독인 경우 SUB_, 주문인 경우 ORD_)
      const orderIdPrefix = checkoutData.paymentType === 'subscription' ? 'SUB_' : 'ORD_';
      const orderId = `${orderIdPrefix}${Date.now()}`;

      // Toss Payments Widget SDK 로드
      const paymentWidget = await loadPaymentWidget(
        CLIENT_KEY,
        checkoutData.email || 'ANONYMOUS'
      );

      // 결제 위젯 렌더링
      paymentWidget.renderPaymentMethods(
        '#payment-method',
        { value: checkoutData.amount }
      );

      // 약관 동의 렌더링
      paymentWidget.renderAgreement('#agreement', {
        variantKey: 'AGREEMENT',
      });

      // 결제 버튼 클릭 시 결제 요청
      const paymentButton = document.createElement('button');
      paymentButton.textContent = '결제하기';
      paymentButton.className = styles.button;
      paymentButton.style.marginTop = '30px';
      paymentButton.onclick = async () => {
        try {
          await paymentWidget.requestPayment({
            orderId: orderId,
            orderName: checkoutData.orderName,
            successUrl: `${window.location.origin}${successUrl}`,
            failUrl: `${window.location.origin}${failUrl}`,
            customerEmail: checkoutData.email,
            customerName: checkoutData.planName || checkoutData.recipient_name || '고객',
          });
        } catch (err: any) {
          console.error('결제 요청 실패:', err);
          alert(err.message || '결제 요청에 실패했습니다.');
        }
      };

      const container = document.getElementById('payment-method');
      if (container && container.parentElement) {
        container.parentElement.appendChild(paymentButton);
      }

    } catch (err: any) {
      console.error('결제 초기화 실패:', err);
      setError(err.message || '결제 초기화에 실패했습니다.');

      // 3초 후 창 닫기
      setTimeout(() => {
        window.close();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">결제 실패</h1>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            잠시 후 창이 자동으로 닫힙니다...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">결제 페이지를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className={styles.wrapper}>
        <div className={styles.box_section}>
          {/* 상단 헤더 */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>결제하기</h1>
          </div>

          <div id="payment-method" style={{ width: "100%" }} />
          <div id="agreement" style={{ width: "100%" }} />
        </div>
      </div>
    </main>
  );
}
