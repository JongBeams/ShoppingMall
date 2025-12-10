'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface OrdersProps {
  user: any;
}

export default function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [writtenReviewProductIds, setWrittenReviewProductIds] = useState<Set<string>>(new Set());
  const [reportedProductIds, setReportedProductIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 10;

  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportProductId, setReportProductId] = useState<string>('');
  const [reportProductName, setReportProductName] = useState<string>('');
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  useEffect(() => {
    fetchWrittenReviews();
    fetchReportedProducts();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    try {
      // 판매자는 /vendors/orders, 구매자는 /orders
      const endpoint = user?.user_type === 'seller' ? '/vendors/orders' : '/orders';
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(`${API_BASE_URL}${endpoint}?limit=${itemsPerPage}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        // 반환된 주문 수가 itemsPerPage보다 적으면 마지막 페이지
        setHasMore(data.orders && data.orders.length >= itemsPerPage);
      }
    } catch (error) {
      console.error('주문 내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWrittenReviews = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const productIds = new Set<string>(
          (data.reviews || []).map((r: any) => r.product_id)
        );
        setWrittenReviewProductIds(productIds);
      }
    } catch (error) {
      console.error('리뷰 목록 조회 실패:', error);
    }
  };

  const fetchReportedProducts = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/products/my-reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('신고 목록 조회:', data); // 디버깅용
        const productIds = new Set<string>(
          (data.reports || []).map((r: any) => r.product_id)
        );
        console.log('신고한 상품 IDs:', productIds); // 디버깅용
        setReportedProductIds(productIds);
      } else {
        console.error('신고 목록 조회 실패 응답:', response.status);
      }
    } catch (error) {
      console.error('신고 목록 조회 실패:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: '결제 대기', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      paid: { label: '주문완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      preparing: { label: '주문완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      shipping: { label: '배송중', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      delivered: { label: '배송완료', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      confirmed: { label: '구매확정', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      cancelled: { label: '주문취소', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const handleCancelOrder = async (orderId: string) => {
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
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.detail || '주문 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 취소 실패:', error);
      alert('주문 취소 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (!confirm('구매를 확정하시겠습니까? 확정 시 포인트가 적립됩니다.')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.points_earned > 0) {
          alert(`구매가 확정되었습니다! ${data.points_earned}P가 적립되었습니다.`);
        } else {
          alert('구매가 확정되었습니다!');
        }
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.detail || '구매확정에 실패했습니다.');
      }
    } catch (error) {
      console.error('구매확정 실패:', error);
      alert('구매확정 중 오류가 발생했습니다.');
    }
  };

  const handleReportProduct = (productId: string, productName: string) => {
    setReportProductId(productId);
    setReportProductName(productName);
    setReportReason('');
    setReportDescription('');
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }
    if (!reportDescription.trim()) {
      alert('신고 내용을 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${reportProductId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (response.ok) {
        alert('상품 신고가 접수되었습니다. 검토 후 조치하겠습니다.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
        // 신고 목록 갱신
        setReportedProductIds(prev => new Set([...prev, reportProductId]));
      } else {
        const error = await response.json();
        alert(error.detail || '신고 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('신고 접수 실패:', error);
      alert('신고 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">주문 내역을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
        {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
      </h2>

      {orders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            {user?.user_type === 'seller' ? '주문 요청이 없습니다.' : '주문 내역이 없습니다.'}
          </p>
          {user?.user_type !== 'seller' && (
            <Link
              href="/products"
              className="border border-gray-900 bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              쇼핑하러 가기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              {/* 상태 배지 - 왼쪽 상단 */}
              <div className="mb-3">
                <span className={`inline-block rounded px-3 py-1 text-xs font-bold ${getStatusBadge(order.status).color}`}>
                  {getStatusBadge(order.status).label}
                </span>
              </div>

              {/* 주문 정보 */}
              <div className="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span>주문일: {new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                  {order.order_number && (
                    <>
                      <span className="mx-2">|</span>
                      <span className="font-mono">{order.order_number}</span>
                    </>
                  )}
                  {order.status === 'cancelled' && order.cancelled_at && (
                    <>
                      <span className="mx-2">|</span>
                      <span className="text-red-500">취소일: {new Date(order.cancelled_at).toLocaleDateString('ko-KR')}</span>
                    </>
                  )}
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {(order.total || order.total_amount || 0).toLocaleString()}원
                </span>
              </div>

              {/* 판매자용: 수령인 정보 */}
              {user?.user_type === 'seller' && order.recipient_name && (
                <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  수령인: {order.recipient_name} | {order.recipient_phone}
                  <br />
                  주소: {order.address} {order.address_detail}
                </div>
              )}

              {/* 상품 목록 */}
              <div className="space-y-3">
                {order.items && order.items.map((item: any, idx: number) => (
                  <div key={`${order.id}-${item.product_id}-${idx}`} className="flex gap-3">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      {(item.thumbnail_url || item.product_thumbnail) ? (
                        <Image
                          src={item.thumbnail_url || item.product_thumbnail}
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
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-sm font-medium text-gray-900 hover:underline dark:text-white"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.floor(item.price || 0).toLocaleString()}원 × {item.quantity}개
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.floor(item.subtotal || (item.price * item.quantity) || 0).toLocaleString()}원
                      </p>
                      {(order.status === 'delivered' || order.status === 'confirmed') && user?.user_type !== 'seller' && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {writtenReviewProductIds.has(item.product_id) ? (
                            <span className="inline-block border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              리뷰작성완료
                            </span>
                          ) : (
                            <Link
                              href={`/reviews/write?orderId=${order.id}&productId=${item.product_id}`}
                              className="inline-block border border-blue-500 px-3 py-1 text-xs font-medium text-blue-500 transition hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              리뷰작성
                            </Link>
                          )}
                          {reportedProductIds.has(item.product_id) ? (
                            <span className="inline-block border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              신고완료
                            </span>
                          ) : (
                            <button
                              onClick={() => handleReportProduct(item.product_id, item.product_name)}
                              className="inline-block border border-red-500 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              상품신고
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 배송 정보 */}
              {order.shipping_address && (
                <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    배송지: {order.shipping_address.recipient_name} | {order.shipping_address.recipient_phone}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ({order.shipping_address.postal_code}) {order.shipping_address.address}
                    {order.shipping_address.address_detail && ` ${order.shipping_address.address_detail}`}
                  </p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/mypage/orders/${order.id}`}
                  className="border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  주문상세
                </Link>
                {(order.status === 'shipping' || order.status === 'delivered') && (
                  <button
                    onClick={() => alert('배송 조회 기능은 준비중입니다.')}
                    className="border border-blue-500 bg-blue-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
                  >
                    배송조회
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'paid') && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="border border-red-500 px-4 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    주문취소
                  </button>
                )}
                {order.status === 'delivered' && user?.user_type !== 'seller' && (
                  <>
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      className="border border-purple-500 bg-purple-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-600"
                    >
                      구매확정
                    </button>
                    <button
                      onClick={() => alert('교환/반품 신청 기능은 준비중입니다.')}
                      className="border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      교환/반품
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {orders.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            {currentPage} 페이지
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!hasMore}
            className="border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            다음
          </button>
        </div>
      )}

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">상품 신고</h3>

            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                신고 상품: <span className="font-medium">{reportProductName}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                신고 사유 <span className="text-red-500">*</span>
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">선택해주세요</option>
                <option value="fake">위조/모조품</option>
                <option value="illegal">불법 상품</option>
                <option value="inappropriate">부적절한 콘텐츠</option>
                <option value="fraud">사기/허위 정보</option>
                <option value="defective">불량/하자 상품</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                신고 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="신고 사유를 구체적으로 작성해주세요."
                rows={5}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
                className="flex-1 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="flex-1 border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmittingReport ? '신고 접수 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
