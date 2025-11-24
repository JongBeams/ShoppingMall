'use client';

import { useState } from 'react';

interface PaymentWidgetProps {
  amount: number;
  orderData: any;
  onSuccess: (paymentResult: any) => void;
  onCancel: () => void;
}

export default function PaymentWidget({ amount, orderData, onSuccess, onCancel }: PaymentWidgetProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | 'kakao' | 'toss'>(orderData.payment_method || 'card');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');

  const paymentMethods = [
    { id: 'card', name: '신용/체크카드', icon: '💳' },
    { id: 'bank', name: '계좌이체', icon: '🏦' },
    { id: 'kakao', name: '카카오페이', icon: '💬' },
    { id: 'toss', name: '토스페이', icon: '💙' },
  ];

  // 결제 처리 시뮬레이션
  const handlePayment = async () => {
    setProcessing(true);
    setStep('processing');

    // 2초 후 결제 완료 시뮬레이션
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess({
          payment_method: selectedMethod,
          payment_id: `PAY_${Date.now()}`,
          paid_at: new Date().toISOString(),
        });
      }, 1500);
    }, 2000);
  };

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center dark:bg-gray-800">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">결제 처리 중...</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center dark:bg-gray-800">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">결제 완료!</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            주문이 정상적으로 처리되었습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800">
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">결제하기</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="border-b border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">총 결제금액</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {amount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 결제 수단 선택 */}
        <div className="p-6">
          <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">결제 수단 선택</h3>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id as any)}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition ${
                  selectedMethod === method.id
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className={`text-sm font-medium ${
                  selectedMethod === method.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {method.name}
                </span>
              </button>
            ))}
          </div>

          {/* 결제 정보 입력 영역 */}
          <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {selectedMethod === 'card' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">카드 정보</h4>
                <input
                  type="text"
                  placeholder="카드 번호 (0000-0000-0000-0000)"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="유효기간 (MM/YY)"
                    className="border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'bank' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">계좌이체</h4>
                <select className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option>은행 선택</option>
                  <option>국민은행</option>
                  <option>신한은행</option>
                  <option>우리은행</option>
                  <option>하나은행</option>
                </select>
                <input
                  type="text"
                  placeholder="계좌번호"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {selectedMethod === 'kakao' && (
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <span className="text-3xl">💬</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  카카오페이 앱으로 결제를 진행합니다.
                </p>
              </div>
            )}

            {selectedMethod === 'toss' && (
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-3xl">💙</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  토스 앱으로 결제를 진행합니다.
                </p>
              </div>
            )}
          </div>

          {/* 주문 정보 요약 */}
          <div className="mt-6 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">주문 정보</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>받는 사람</span>
                <span className="text-gray-900 dark:text-white">{orderData.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span>연락처</span>
                <span className="text-gray-900 dark:text-white">{orderData.recipient_phone}</span>
              </div>
              <div className="flex justify-between">
                <span>배송지</span>
                <span className="text-right text-gray-900 dark:text-white">
                  {orderData.address} {orderData.address_detail}
                </span>
              </div>
            </div>
          </div>

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="mt-6 w-full bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? '처리 중...' : `${amount.toLocaleString()}원 결제하기`}
          </button>

          {/* 안내 문구 */}
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            결제 진행 시 개인정보 제공 및 결제 대행 서비스 이용약관에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
