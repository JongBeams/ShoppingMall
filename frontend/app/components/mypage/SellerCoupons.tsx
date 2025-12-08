'use client';

import { useState, useEffect } from 'react';
import { couponAPI } from '@/app/lib/api';
import { Coupon, CouponCreateRequest, CouponListResponse } from '@/app/types';

interface CouponWithStats extends Coupon {
  stats?: {
    total: number;
    unused: number;
    used: number;
  };
}

export default function SellerCoupons() {
  const [coupons, setCoupons] = useState<CouponWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // 쿠폰 발행 폼 데이터
  const [formData, setFormData] = useState<CouponCreateRequest>({
    name: '',
    code: '',
    discount_type: 'percent',
    discount_value: 0,
    max_discount_amount: undefined,
    min_order_amount: undefined,
    validity_days: 30,
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const [submitting, setSubmitting] = useState(false);
  const [autoIssueToAll, setAutoIssueToAll] = useState(false);

  useEffect(() => {
    // 판매자 정보 가져오기
    fetchVendorInfo();
  }, []);

  const fetchVendorInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 판매자 정보 조회 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('API 에러 응답:', response.status, errorData);

        // 404는 판매자가 아닌 경우
        if (response.status === 404) {
          throw new Error('판매자로 등록되지 않았습니다. 사업자 회원가입이 필요합니다.');
        }

        throw new Error(errorData.detail || '판매자 정보를 가져올 수 없습니다.');
      }

      const vendorData = await response.json();
      console.log('판매자 정보:', vendorData);

      const vendorId = vendorData.id;

      setVendorId(vendorId);
      // localStorage에 저장 (다음에 사용하기 위해)
      localStorage.setItem('vendor_id', vendorId);

      // 쿠폰 목록 조회
      fetchVendorCoupons(vendorId);
    } catch (err: any) {
      console.error('판매자 정보 조회 실패:', err);
      setError(err.message || '판매자 정보를 찾을 수 없습니다.');
      setLoading(false);
    }
  };

  const fetchVendorCoupons = async (vendorId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const response: CouponListResponse = await couponAPI.getCoupons(token, {
        vendor_id: vendorId,
        limit: 100,
        offset: 0,
      });

      // 각 쿠폰의 통계 정보 가져오기
      const couponsWithStats = await Promise.all(
        (response.coupons || []).map(async (coupon) => {
          try {
            const stats = await couponAPI.getCouponStats(coupon.id, token);
            return { ...coupon, stats };
          } catch (error) {
            console.error(`쿠폰 ${coupon.id} 통계 조회 실패:`, error);
            return coupon;
          }
        })
      );

      setCoupons(couponsWithStats);
    } catch (err: any) {
      console.error('쿠폰 목록 조회 실패:', err);
      setError(err.message || '쿠폰을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorId) {
      alert('판매자 정보를 찾을 수 없습니다.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      // 판매자 ID 추가
      const submitData: any = {
        ...formData,
        vendor_id: vendorId,
      };

      // 빈 값 제거
      if (!submitData.code) delete submitData.code;
      if (!submitData.max_discount_amount) delete submitData.max_discount_amount;
      if (!submitData.min_order_amount) delete submitData.min_order_amount;

      await couponAPI.createCoupon(submitData, token, autoIssueToAll);

      if (autoIssueToAll) {
        alert('쿠폰이 성공적으로 발행되었고, 모든 구매자에게 배급되었습니다.');
      } else {
        alert('쿠폰이 성공적으로 발행되었습니다.');
      }

      // 폼 초기화
      setFormData({
        name: '',
        code: '',
        discount_type: 'percent',
        discount_value: 0,
        max_discount_amount: undefined,
        min_order_amount: undefined,
        validity_days: 30,
        start_at: new Date().toISOString().slice(0, 16),
        end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });

      setShowForm(false);
      setAutoIssueToAll(false);

      // 목록 새로고침
      fetchVendorCoupons(vendorId);
    } catch (err: any) {
      console.error('쿠폰 발행 실패:', err);
      setError(err.message || '쿠폰 발행에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const isActiveStatus = (coupon: Coupon) => {
    const now = new Date();
    const start = new Date(coupon.start_at);
    const end = new Date(coupon.end_at);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500 dark:text-gray-400">쿠폰 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">쿠폰 발행 관리</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {showForm ? '폼 닫기' : '+ 쿠폰 발행'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 쿠폰 발행 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 border border-gray-200 p-4 dark:border-gray-700">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">새 쿠폰 발행</h5>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* 쿠폰 이름 */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                쿠폰 이름 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 신규 회원 10% 할인"
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 쿠폰 코드 */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                쿠폰 코드 (선택)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="예: WELCOME10"
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                비워두면 시스템에서 자동 생성됩니다
              </p>
            </div>

            {/* 할인 유형 */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                할인 유형 *
              </label>
              <select
                required
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({ ...formData, discount_type: e.target.value as 'percent' | 'fixed' })
                }
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="percent">정률 할인 (%)</option>
                <option value="fixed">정액 할인 (원)</option>
              </select>
            </div>

            {/* 할인 금액/율 */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                할인 {formData.discount_type === 'percent' ? '율 (%)' : '금액 (원)'} *
              </label>
              <input
                type="number"
                required
                min="0"
                max={formData.discount_type === 'percent' ? 100 : undefined}
                step={formData.discount_type === 'percent' ? '1' : '100'}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                placeholder={formData.discount_type === 'percent' ? '10' : '5000'}
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 최대 할인 금액 */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                최대 할인 금액 (원, 선택)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.max_discount_amount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_discount_amount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="30000"
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 최소 주문 금액 */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                최소 주문 금액 (원, 선택)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.min_order_amount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_order_amount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="30000"
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 유효 기간 (일) */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                쿠폰 만료 기간 (일) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
                placeholder="30"
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                발급 시점부터 만료되는 일수
              </p>
            </div>

            {/* 유효 시작 시각 */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                유효 시작 시각 *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 유효 종료 시각 */}
            <div>
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                유효 종료 시각 *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* 모든 구매자에게 배급 옵션 */}
          <div className="flex items-center gap-2 rounded bg-blue-50 p-3 dark:bg-blue-950/20">
            <input
              type="checkbox"
              id="autoIssueToAll"
              checked={autoIssueToAll}
              onChange={(e) => setAutoIssueToAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoIssueToAll" className="text-sm text-gray-700 dark:text-gray-300">
              모든 구매자에게 자동으로 배급 (user_coupons 테이블에 일괄 발급)
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-gray-900 bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {submitting ? '발행 중...' : '쿠폰 발행'}
          </button>
        </form>
      )}

      {/* 발행된 쿠폰 목록 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          발행한 쿠폰 ({coupons.length}개)
        </h4>

        {coupons.length > 0 ? (
          coupons.map((coupon) => {
            const isActive = isActiveStatus(coupon);

            return (
              <div
                key={coupon.id}
                className={`border p-4 ${
                  isActive
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">{coupon.name}</h5>
                      {isActive ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          활성
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          비활성
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        • 할인: {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()}원`}
                        {coupon.max_discount_amount && ` (최대 ${coupon.max_discount_amount.toLocaleString()}원)`}
                      </p>
                      {coupon.min_order_amount && (
                        <p>• 최소 주문: {coupon.min_order_amount.toLocaleString()}원</p>
                      )}
                      <p>• 유효기간: {coupon.validity_days}일</p>
                      <p>• 발행 기간: {formatDate(coupon.start_at)} ~ {formatDate(coupon.end_at)}</p>
                      {coupon.code && (
                        <p className="font-mono text-gray-900 dark:text-white">
                          • 쿠폰 코드: <span className="font-bold">{coupon.code}</span>
                        </p>
                      )}
                      {coupon.stats && (
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                          • 사용 현황: {coupon.stats.unused}/{coupon.stats.total}
                        </p>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      생성일: {formatDate(coupon.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3v.75m-9-6v.75m0 3v.75m-3 0h15a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v6.75a2.25 2.25 0 002.25 2.25zm13.5-9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v6.75a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25V6z"
              />
            </svg>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              발행한 쿠폰이 없습니다
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              첫 쿠폰 발행하기 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
