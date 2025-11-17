'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 실제로는 API에서 가져와야 할 데이터
  const notifications: Record<string, any> = {
    '1': {
      id: 1,
      type: '주문',
      title: '주문이 완료되었습니다',
      message: 'AirPods Pro 주문이 완료되었습니다.',
      detailMessage: `주문해 주셔서 감사합니다.

주문번호: #2025011701
상품명: AirPods Pro
수량: 1개
금액: 359,000원
결제방법: 신용카드

배송지:
서울시 강남구 테헤란로 123
이은지 (010-1234-5678)

배송은 2-3일 이내에 시작될 예정입니다.
배송 시작 시 알림을 보내드리겠습니다.`,
      time: '5분 전',
      date: '2025.01.17 14:30',
      read: false,
      actionLink: '/mypage#orders',
      actionText: '주문 상세 보기'
    },
    '2': {
      id: 2,
      type: '배송',
      title: '배송이 시작되었습니다',
      message: 'Smart Watch Ultra 배송이 시작되었습니다.',
      detailMessage: `상품이 배송을 시작했습니다.

주문번호: #2025011602
상품명: Smart Watch Ultra
택배사: CJ대한통운
운송장번호: 123456789012

배송 예정일: 2025.01.19 (금)

배송조회를 통해 실시간으로 배송 현황을 확인하실 수 있습니다.`,
      time: '1시간 전',
      date: '2025.01.17 13:00',
      read: false,
      actionLink: '/mypage#orders',
      actionText: '배송 조회하기'
    },
    '3': {
      id: 3,
      type: '쿠폰',
      title: '새로운 쿠폰이 도착했습니다',
      message: '신규 회원 10% 할인 쿠폰이 발급되었습니다.',
      detailMessage: `회원가입을 환영합니다!

쿠폰명: 신규 회원 10% 할인
할인율: 10%
최소 주문금액: 50,000원
최대 할인금액: 30,000원
유효기간: 2025.02.16까지 (30일)

모든 카테고리의 상품에 사용 가능합니다.
단, 일부 브랜드 제품은 제외될 수 있습니다.`,
      time: '2시간 전',
      date: '2025.01.17 12:00',
      read: true,
      actionLink: '/mypage#profile',
      actionText: '쿠폰함 보기'
    },
  };

  const notification = notifications[id];

  if (!notification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            알림을 찾을 수 없습니다
          </h1>
          <Link
            href="/notifications"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            알림 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          뒤로 가기
        </button>

        {/* Notification Detail */}
        <div>
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                {notification.type}
              </span>
              {!notification.read && (
                <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                  NEW
                </span>
              )}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {notification.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {notification.date}
            </p>
          </div>

          {/* Content */}
          <div className="py-8">
            <div className="mb-6 whitespace-pre-line text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {notification.detailMessage}
            </div>

            {/* Action Button */}
            {notification.actionLink && (
              <Link
                href={notification.actionLink}
                className="inline-block border border-gray-900 bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {notification.actionText}
              </Link>
            )}
          </div>
        </div>

        {/* Related Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href="/notifications"
            className="flex-1 border border-gray-300 bg-white py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            알림 목록
          </Link>
          <button
            onClick={() => router.push('/')}
            className="flex-1 border border-gray-300 bg-white py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
