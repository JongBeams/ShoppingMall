'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { notificationAPI } from '../lib/api';
import type { Notification, NotificationListResponse } from '../types';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'order' | 'shipment' | 'coupon'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const params: any = {
        limit: 20,
        offset: 0,
      };

      if (filter !== 'all') {
        params.type = filter;
      }

      const response: NotificationListResponse = await notificationAPI.getNotifications(token, params);
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
      setTotal(response.total);
    } catch (err: any) {
      console.error('알림 조회 실패:', err);
      setError(err.message || '알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

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

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">알림</h1>
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">알림</h1>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              {error.includes('로그인') && (
                <Link
                  href="/login"
                  className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
                >
                  로그인하러 가기
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">알림</h1>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              읽지 않은 알림 {unreadCount}개
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'all', label: '전체' },
            { key: 'order', label: '주문' },
            { key: 'shipment', label: '배송' },
            { key: 'coupon', label: '쿠폰' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === tab.key
                  ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={`/notifications/${notification.id}`}
              className={`block border border-gray-200 bg-white p-5 transition hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-white ${
                !notification.is_read ? 'border-l-4 border-l-blue-600 dark:border-l-blue-400' : ''
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    {getTypeLabel(notification.type)}
                  </span>
                  {!notification.is_read && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                      NEW
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatTime(notification.created_at)}
                </span>
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notification.summary}
              </p>
            </Link>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-600 dark:text-gray-400">알림이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
