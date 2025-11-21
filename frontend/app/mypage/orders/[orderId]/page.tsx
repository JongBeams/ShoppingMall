'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('주문 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      console.error('주문 상세 조회 실패:', err);
      setError(err.message || '주문 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: '결제 대기', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      paid: { label: '결제 완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      preparing: { label: '배송 준비', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      shipping: { label: '배송 중', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
      delivered: { label: '배송 완료', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
  };

  const handleCancelOrder = async () => {
    if (!confirm('주문을 취소하시겠습니까?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('주문이 취소되었습니다.');
        fetchOrderDetails();
      } else {
        const error = await response.json();
        alert(error.detail || '주문 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 취소 실패:', error);
      alert('주문 취소 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">주문 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error || '주문을 찾을 수 없습니다.'}</p>
        <Link
          href="/mypage?tab=orders"
          className="mt-4 border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          주문 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">주문상세</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {new Date(order.created_at).toLocaleDateString('ko-KR')} 주문
          </p>
        </div>
        <Link
          href="/mypage?tab=orders"
          className="border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← 목록으로
        </Link>
      </div>

      {/* 주문 정보 카드 */}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {/* 주문 번호 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">주문번호</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">{order.order_number}</div>
        </div>

        {/* 주문 상태 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">주문상태</div>
          <span className={`inline-block px-2 py-1 text-xs font-medium ${getStatusBadge(order.status).color}`}>
            {getStatusBadge(order.status).label}
          </span>
        </div>

        {/* 결제 금액 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">총 결제금액</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-500">
            {order.total.toLocaleString()} 원
          </div>
        </div>
      </div>

      {/* 주문 상품 */}
      <div className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">주문 상품</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {order.items && order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-b-0 dark:border-gray-800">
                <Link
                  href={`/products/${item.product_id}`}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {item.product_thumbnail ? (
                    <Image
                      src={item.product_thumbnail}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-sm font-semibold text-gray-900 hover:underline dark:text-white"
                    >
                      {item.product_name}
                    </Link>
                    {item.selected_options && item.selected_options.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {item.selected_options.map((option: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                            • {option.option_name}: {option.value_name}
                            {option.price > 0 && ` (+${option.price.toLocaleString()}원)`}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {item.price.toLocaleString()}원 × {item.quantity}개
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.subtotal.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 결제 정보 */}
      <div className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">결제 정보</h2>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">결제수단</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {order.payment_method === 'card' ? '신용/체크카드' :
                 order.payment_method === 'bank' ? '무통장입금' :
                 order.payment_method === 'kakao' ? '카카오페이' :
                 order.payment_method === 'toss' ? '토스페이' : order.payment_method}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">상품금액</span>
              <span className="text-gray-900 dark:text-white">{order.subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">배송비</span>
              <span className="text-gray-900 dark:text-white">
                {order.shipping_fee === 0 ? '무료' : `${order.shipping_fee.toLocaleString()}원`}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">총 결제금액</span>
                <span className="text-base font-bold text-red-600 dark:text-red-500">
                  {order.total.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배송지 정보 */}
      {order.shipping_address && (
        <div className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">배송지 정보</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              <div className="flex gap-3 text-sm">
                <span className="w-20 font-medium text-gray-600 dark:text-gray-400">받는사람</span>
                <span className="text-gray-900 dark:text-white">{order.shipping_address.recipient_name}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="w-20 font-medium text-gray-600 dark:text-gray-400">연락처</span>
                <span className="text-gray-900 dark:text-white">{order.shipping_address.recipient_phone}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="w-20 font-medium text-gray-600 dark:text-gray-400">배송주소</span>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">
                    ({order.shipping_address.postal_code}) {order.shipping_address.address}
                  </p>
                  {order.shipping_address.address_detail && (
                    <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.address_detail}</p>
                  )}
                </div>
              </div>
              {order.notes && (
                <div className="flex gap-3 text-sm">
                  <span className="w-20 font-medium text-gray-600 dark:text-gray-400">배송메모</span>
                  <span className="text-gray-900 dark:text-white">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 결제영수증 정보 */}
      <div className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">결제영수증 정보</h2>
        </div>
        <div className="p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">국민카드 / 일시불</span>
              <span className="text-gray-900 dark:text-white">{order.total.toLocaleString()} 원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">배송비</span>
              <span className="text-gray-900 dark:text-white">
                {order.shipping_fee === 0 ? '0 원' : `${order.shipping_fee.toLocaleString()} 원`}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
              <div className="flex justify-between font-bold">
                <span className="text-gray-900 dark:text-white">총 결제금액</span>
                <span className="text-gray-900 dark:text-white">{order.total.toLocaleString()} 원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        {order.status === 'pending' || order.status === 'paid' ? (
          <>
            <button
              onClick={handleCancelOrder}
              className="flex-1 border border-red-600 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
            >
              주문 취소
            </button>
            <Link
              href="/mypage?tab=orders"
              className="flex-1 border border-gray-300 bg-white py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              목록 보기
            </Link>
          </>
        ) : (
          <Link
            href="/mypage?tab=orders"
            className="w-full border border-gray-900 bg-gray-900 py-3 text-center text-sm font-bold text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            주문 목록으로
          </Link>
        )}
      </div>
    </div>
  );
}
