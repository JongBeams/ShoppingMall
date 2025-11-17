'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | '주문' | '배송' | '쿠폰'>('all');

  const notifications = [
    {
      id: 1,
      type: '주문',
      title: '주문이 완료되었습니다',
      message: 'AirPods Pro 주문이 완료되었습니다. 주문번호: #2025011701',
      time: '5분 전',
      date: '2025.01.17',
      read: false
    },
    {
      id: 2,
      type: '배송',
      title: '배송이 시작되었습니다',
      message: 'Smart Watch Ultra 배송이 시작되었습니다. 배송조회가 가능합니다.',
      time: '1시간 전',
      date: '2025.01.17',
      read: false
    },
    {
      id: 3,
      type: '쿠폰',
      title: '새로운 쿠폰이 도착했습니다',
      message: '신규 회원 10% 할인 쿠폰이 발급되었습니다. 30일간 사용 가능합니다.',
      time: '2시간 전',
      date: '2025.01.17',
      read: true
    },
    {
      id: 4,
      type: '배송',
      title: '배송이 완료되었습니다',
      message: 'Premium Wallet 배송이 완료되었습니다. 구매확정을 부탁드립니다.',
      time: '1일 전',
      date: '2025.01.16',
      read: true
    },
    {
      id: 5,
      type: '주문',
      title: '주문 취소가 완료되었습니다',
      message: 'Wireless Keyboard 주문이 취소되었습니다. 환불은 3~5일 소요됩니다.',
      time: '2일 전',
      date: '2025.01.15',
      read: true
    },
    {
      id: 6,
      type: '쿠폰',
      title: '쿠폰 사용 기한이 임박합니다',
      message: '겨울 시즌 20% 할인 쿠폰이 3일 후 만료됩니다.',
      time: '3일 전',
      date: '2025.01.14',
      read: true
    },
  ];

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">알림</h1>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'all', label: '전체' },
            { key: '주문', label: '주문' },
            { key: '배송', label: '배송' },
            { key: '쿠폰', label: '쿠폰' },
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
          {filteredNotifications.map((notification) => (
            <Link
              key={notification.id}
              href={`/notifications/${notification.id}`}
              className={`block border border-gray-200 bg-white p-5 transition hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-white ${
                !notification.read ? 'border-l-4 border-l-blue-600 dark:border-l-blue-400' : ''
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    {notification.type}
                  </span>
                  {!notification.read && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                      NEW
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {notification.time}
                </span>
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </Link>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-600 dark:text-gray-400">알림이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
