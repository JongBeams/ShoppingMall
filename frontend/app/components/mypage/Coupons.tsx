'use client';

import { useState, useEffect } from 'react';
import { couponAPI } from '@/app/lib/api';
import { UserCoupon, Coupon, CouponCreateRequest } from '@/app/types';

type CouponStatus = 'available' | 'used' | 'expired';

export default function Coupons() {
  const [activeFilter, setActiveFilter] = useState<CouponStatus>('available');
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 쿠폰 개수 상태
  const [counts, setCounts] = useState({
    available: 0,
    used: 0,
    expired: 0,
  });

  useEffect(() => {
    // 관리자 권한 확인
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setIsAdmin(true);
    }

    fetchUserCoupons();
  }, []);

  const fetchUserCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');

      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      // 모든 쿠폰 조회 (만료 포함)
      const response = await couponAPI.getMyCoupons(token, {
        include_expired: true,
        limit: 100,
      });

      setUserCoupons(response.user_coupons || []);

      // 쿠폰 개수 계산
      calculateCounts(response.user_coupons || []);
    } catch (err: any) {
      console.error('쿠폰 조회 실패:', err);
      setError(err.message || '쿠폰을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCounts = (coupons: UserCoupon[]) => {
    const now = new Date();
    const available = coupons.filter(
      (c) => !c.is_using && c.expires_at && new Date(c.expires_at) > now
    ).length;
    const used = coupons.filter((c) => c.is_using).length;
    const expired = coupons.filter(
      (c) => !c.is_using && c.expires_at && new Date(c.expires_at) <= now
    ).length;

    setCounts({ available, used, expired });
  };

  const getCouponStatus = (coupon: UserCoupon): CouponStatus => {
    if (coupon.is_using) return 'used';
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) return 'expired';
    return 'available';
  };

  const formatDiscount = (coupon?: Coupon) => {
    if (!coupon) return '-';
    if (coupon.discount_type === 'percent') {
      return `${coupon.discount_value}%`;
    }
    return `${coupon.discount_value.toLocaleString()}원`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const filteredCoupons = userCoupons.filter((c) => getCouponStatus(c) === activeFilter);

  if (loading) {
    return (
      <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500 dark:text-gray-400">쿠폰을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">쿠폰함</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            보유 중인 쿠폰을 확인하고 사용하세요
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + 쿠폰 추가
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('available')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'available'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            사용 가능 ({counts.available})
          </button>
          <button
            onClick={() => setActiveFilter('used')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'used'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            사용 완료 ({counts.used})
          </button>
          <button
            onClick={() => setActiveFilter('expired')}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeFilter === 'expired'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            기간 만료 ({counts.expired})
          </button>
        </div>
      </div>

      {/* Coupon List */}
      <div>
        {filteredCoupons.length > 0 ? (
          <div className="space-y-3">
            {filteredCoupons.map((userCoupon) => {
              const coupon = userCoupon.coupon;
              const status = getCouponStatus(userCoupon);

              return (
                <div
                  key={userCoupon.id}
                  className={`relative overflow-hidden border p-3 ${
                    status === 'available'
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  {/* Coupon Badge */}
                  <div className="absolute right-0 top-0">
                    {status === 'available' && (
                      <div className="bg-blue-600 px-2 py-1 text-xs font-medium text-white dark:bg-blue-500">
                        사용가능
                      </div>
                    )}
                    {status === 'used' && (
                      <div className="bg-gray-600 px-2 py-1 text-xs font-medium text-white">
                        사용완료
                      </div>
                    )}
                    {status === 'expired' && (
                      <div className="bg-red-600 px-2 py-1 text-xs font-medium text-white">
                        기간만료
                      </div>
                    )}
                  </div>

                  <div className="pr-16">
                    <h3 className="mb-1 text-xs font-bold text-gray-900 dark:text-white">
                      {coupon?.name || '쿠폰 이름 없음'}
                    </h3>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatDiscount(coupon)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">할인</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {coupon?.min_order_amount && (
                        <p>• 최소 주문금액: {coupon.min_order_amount.toLocaleString()}원</p>
                      )}
                      {coupon?.max_discount_amount && (
                        <p>• 최대 할인금액: {coupon.max_discount_amount.toLocaleString()}원</p>
                      )}
                      <p>• 유효기간: {formatDate(userCoupon.expires_at)}까지</p>
                      {coupon?.code && (
                        <p className="mt-2 font-mono text-gray-900 dark:text-white">
                          쿠폰코드: <span className="font-bold">{coupon.code}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {status === 'available' && (
                    <button className="mt-3 w-full border border-gray-900 bg-gray-900 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                      쇼핑하러 가기
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              {activeFilter === 'available' && '사용 가능한 쿠폰이 없습니다'}
              {activeFilter === 'used' && '사용한 쿠폰이 없습니다'}
              {activeFilter === 'expired' && '만료된 쿠폰이 없습니다'}
            </p>
          </div>
        )}
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <AddCouponModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchUserCoupons();
          }}
        />
      )}
    </div>
  );
}

// 쿠폰 추가 모달 컴포넌트
function AddCouponModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CouponCreateRequest>({
    name: '',
    code: '',
    discount_type: 'percent',
    discount_value: 0,
    max_discount_amount: undefined,
    min_order_amount: undefined,
    validity_days: 30,
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token');

      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      // 빈 값 제거
      const submitData: any = { ...formData };
      if (!submitData.code) delete submitData.code;
      if (!submitData.max_discount_amount) delete submitData.max_discount_amount;
      if (!submitData.min_order_amount) delete submitData.min_order_amount;

      await couponAPI.createCoupon(submitData, token);
      alert('쿠폰이 성공적으로 생성되었습니다.');
      onSuccess();
    } catch (err: any) {
      console.error('쿠폰 생성 실패:', err);
      setError(err.message || '쿠폰 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto bg-white p-6 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">쿠폰 추가</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 쿠폰 이름 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              쿠폰 이름 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="예: 신규 회원 10% 할인"
            />
          </div>

          {/* 쿠폰 코드 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              쿠폰 코드 (선택)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="예: WELCOME10"
            />
          </div>

          {/* 할인 타입 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              할인 타입 *
            </label>
            <select
              required
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({ ...formData, discount_type: e.target.value as 'percent' | 'fixed' })
              }
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="percent">퍼센트 (%)</option>
              <option value="fixed">정액 (원)</option>
            </select>
          </div>

          {/* 할인 값 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              할인 값 *
            </label>
            <input
              type="number"
              required
              min="0"
              step={formData.discount_type === 'percent' ? '1' : '100'}
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder={formData.discount_type === 'percent' ? '10' : '5000'}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.discount_type === 'percent' ? '0-100 사이의 값' : '원 단위로 입력'}
            </p>
          </div>

          {/* 최대 할인 금액 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              최대 할인 금액 (선택, 원)
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
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="30000"
            />
          </div>

          {/* 최소 주문 금액 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              최소 주문 금액 (선택, 원)
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
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="50000"
            />
          </div>

          {/* 유효 기간 (일) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              쿠폰 만료 기간 (일) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.validity_days}
              onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
              className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="30"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              발급 시점부터 몇 일 후에 만료될지 설정
            </p>
          </div>

          {/* 유효 시작 시각 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {loading ? '생성 중...' : '쿠폰 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
