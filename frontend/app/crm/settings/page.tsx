'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 시스템 설정 상태
  const [settings, setSettings] = useState({
    // 기본 설정
    adminEmail: '',
    adminPhone: '',
    businessNumber: '',
    businessName: '',
    ceoName: '',
    businessAddress: '',

    // 주문 설정
    orderCancelTime: 24,
    orderConfirmTime: 7,
    deliveryCompletionTime: 3,

    // 결제 설정
    paymentMethods: {
      card: true,
      transfer: true,
      virtualAccount: true,
      phone: false,
    },

    // 배송 설정
    deliveryFee: 3000,
    freeDeliveryThreshold: 30000,

    // 포인트 설정
    pointEnabled: true,
    pointRate: 1.0,
    signupPoint: 5000,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('설정을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSettings({
        adminEmail: data.admin_email,
        adminPhone: data.admin_phone,
        businessNumber: data.business_number,
        businessName: data.business_name,
        ceoName: data.ceo_name,
        businessAddress: data.business_address,
        orderCancelTime: data.order_cancel_time,
        orderConfirmTime: data.order_confirm_time,
        deliveryCompletionTime: data.delivery_completion_time,
        paymentMethods: {
          card: data.payment_card,
          transfer: data.payment_transfer,
          virtualAccount: data.payment_virtual_account,
          phone: data.payment_phone,
        },
        deliveryFee: data.delivery_fee,
        freeDeliveryThreshold: data.free_delivery_threshold,
        pointEnabled: data.point_enabled,
        pointRate: data.point_rate,
        signupPoint: data.signup_point,
      });
    } catch (error) {
      console.error('설정 불러오기 오류:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          admin_email: settings.adminEmail,
          admin_phone: settings.adminPhone,
          business_number: settings.businessNumber,
          business_name: settings.businessName,
          ceo_name: settings.ceoName,
          business_address: settings.businessAddress,
          order_cancel_time: settings.orderCancelTime,
          order_confirm_time: settings.orderConfirmTime,
          delivery_completion_time: settings.deliveryCompletionTime,
          payment_card: settings.paymentMethods.card,
          payment_transfer: settings.paymentMethods.transfer,
          payment_virtual_account: settings.paymentMethods.virtualAccount,
          payment_phone: settings.paymentMethods.phone,
          delivery_fee: settings.deliveryFee,
          free_delivery_threshold: settings.freeDeliveryThreshold,
          point_enabled: settings.pointEnabled,
          point_rate: settings.pointRate,
          signup_point: settings.signupPoint,
        }),
      });

      if (!response.ok) {
        throw new Error('설정 저장에 실패했습니다.');
      }

      const data = await response.json();
      alert(data.message || '설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="min-h-screen">
        {/* Header */}
        <section className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">시스템설정</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            쇼핑몰 운영에 필요한 기본 설정을 관리합니다
          </p>
        </section>

        {/* Settings Sections */}
        <div className="p-4">
          {/* 기본 설정 */}
          <section className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">기본 설정</h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">사업자 및 관리자 정보 설정</p>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  관리자 이메일
                </label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  관리자 전화번호
                </label>
                <input
                  type="text"
                  value={settings.adminPhone}
                  onChange={(e) => setSettings({ ...settings, adminPhone: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  value={settings.businessNumber}
                  onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  상호명
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  대표자명
                </label>
                <input
                  type="text"
                  value={settings.ceoName}
                  onChange={(e) => setSettings({ ...settings, ceoName: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  사업장 주소
                </label>
                <input
                  type="text"
                  value={settings.businessAddress}
                  onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* 주문 설정 */}
          <section className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">주문 설정</h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">주문 처리 기간 및 정책 설정</p>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  주문 취소 가능 기간 (시간)
                </label>
                <input
                  type="number"
                  value={settings.orderCancelTime}
                  onChange={(e) =>
                    setSettings({ ...settings, orderCancelTime: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  주문 후 해당 시간 내 고객이 직접 취소할 수 있습니다
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  구매 확정 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.orderConfirmTime}
                  onChange={(e) =>
                    setSettings({ ...settings, orderConfirmTime: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  배송 완료 후 자동으로 구매가 확정되는 기간
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  배송 완료 처리 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.deliveryCompletionTime}
                  onChange={(e) =>
                    setSettings({ ...settings, deliveryCompletionTime: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  배송 시작 후 자동으로 배송 완료 처리되는 기간
                </p>
              </div>
            </div>
          </section>

          {/* 결제 설정 */}
          <section className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">결제 설정</h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">사용 가능한 결제 수단 설정</p>
            </div>
            <div className="space-y-3 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.card}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, card: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">신용카드/체크카드</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.transfer}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, transfer: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">실시간 계좌이체</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.virtualAccount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        virtualAccount: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">가상계좌</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, phone: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">휴대폰 결제</span>
              </label>
            </div>
          </section>

          {/* 배송 설정 */}
          <section className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">배송 설정</h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">배송비 및 배송 정책 설정</p>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  기본 배송비 (원)
                </label>
                <input
                  type="number"
                  value={settings.deliveryFee}
                  onChange={(e) =>
                    setSettings({ ...settings, deliveryFee: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  무료 배송 기준 금액 (원)
                </label>
                <input
                  type="number"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, freeDeliveryThreshold: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  주문 금액이 이 금액 이상일 경우 배송비 무료
                </p>
              </div>
            </div>
          </section>

          {/* 포인트 설정 */}
          <section className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">포인트 설정</h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">적립금 정책 설정</p>
            </div>
            <div className="space-y-4 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.pointEnabled}
                  onChange={(e) => setSettings({ ...settings, pointEnabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">포인트 적립 사용</span>
              </label>
              {settings.pointEnabled && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      적립율 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.pointRate}
                      onChange={(e) =>
                        setSettings({ ...settings, pointRate: parseFloat(e.target.value) })
                      }
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      구매 금액의 해당 %만큼 포인트 적립
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      회원가입 축하 포인트 (원)
                    </label>
                    <input
                      type="number"
                      value={settings.signupPoint}
                      onChange={(e) =>
                        setSettings({ ...settings, signupPoint: parseInt(e.target.value) })
                      }
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      신규 회원가입 시 지급되는 포인트
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {isSaving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
