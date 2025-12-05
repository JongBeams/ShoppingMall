'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notificationAPI } from '../../lib/api';
import type { Notification } from '../../types';

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 알림 상세 조회 및 읽음 처리
  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }

        // 알림 상세 조회
        const data: Notification = await notificationAPI.getNotificationById(id, token);
        setNotification(data);

        // 읽지 않은 알림이면 읽음 처리
        if (!data.is_read) {
          try {
            await notificationAPI.markAsRead(id, token);
          } catch (err) {
            console.error('읽음 처리 실패:', err);
            // 읽음 처리 실패해도 알림은 표시
          }
        }
      } catch (err: any) {
        console.error('알림 조회 실패:', err);
        setError(err.message || '알림을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [id]);

  // 타입별 한글 이름
  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      order: '주문',
      shipment: '배송',
      coupon: '쿠폰',
      event: '이벤트',
    };
    return typeMap[type] || type;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 에러
  if (error || !notification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            {error || '알림을 찾을 수 없습니다'}
          </h1>
          {error?.includes('로그인') ? (
            <Link
              href="/login"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              로그인하러 가기
            </Link>
          ) : (
            <Link
              href="/notifications"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              알림 목록으로 돌아가기
            </Link>
          )}
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
                {getTypeLabel(notification.type)}
              </span>
              {!notification.is_read && (
                <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                  NEW
                </span>
              )}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {notification.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(notification.created_at)}
            </p>
          </div>

          {/* Content */}
          <div className="py-8">
            <div className="mb-6 whitespace-pre-line text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {notification.body}
            </div>

            {/* Action Button - resource_id가 있으면 주문/쿠폰 상세로 이동 */}
            {notification.resource_id && (
              <Link
                href={
                  notification.type === 'order' || notification.type === 'shipment'
                    ? `/mypage#orders`
                    : notification.type === 'coupon'
                    ? `/mypage#profile`
                    : '/mypage'
                }
                className="inline-block border border-gray-900 bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {notification.type === 'order' || notification.type === 'shipment'
                  ? '주문 상세 보기'
                  : notification.type === 'coupon'
                  ? '쿠폰함 보기'
                  : '자세히 보기'}
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
