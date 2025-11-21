'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ProfileProps {
  user: any;
  vendor: any;
}

interface PaymentMethod {
  id: string;
  card_company: string;
  card_number: string;
  card_holder: string;
  expiry_date: string;
  is_default: boolean;
}

interface RefundAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

interface DeliveryAddress {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  postal_code: string;
  address: string;
  detail_address: string;
  is_default: boolean;
}

export default function Profile({ user, vendor }: ProfileProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [refundAccounts, setRefundAccounts] = useState<RefundAccount[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);

  // 모달 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 폼 데이터
  const [paymentForm, setPaymentForm] = useState({ card_company: '', card_number: '', card_holder: '', expiry_date: '', is_default: false });
  const [refundForm, setRefundForm] = useState({ bank_name: '', account_number: '', account_holder: '', is_default: false });
  const [addressForm, setAddressForm] = useState({ name: '', recipient: '', phone: '', postal_code: '', address: '', detail_address: '', is_default: false });

  useEffect(() => {
    if (user?.user_type !== 'seller') {
      fetchPaymentMethods();
      fetchRefundAccounts();
      fetchAddresses();
    }
  }, [user]);

  const getToken = () => localStorage.getItem('access_token');

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/methods`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.error('결제수단 조회 실패:', error);
    }
  };

  const fetchRefundAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/refund-accounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRefundAccounts(data.refund_accounts || []);
      }
    } catch (error) {
      console.error('환불계좌 조회 실패:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/addresses`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('배송지 조회 실패:', error);
    }
  };

  // 결제수단 추가
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleAddPaymentMethod 호출됨', paymentForm);
    console.log('API URL:', `${API_BASE_URL}/payment/methods`);
    console.log('Token:', getToken());
    try {
      const response = await fetch(`${API_BASE_URL}/payment/methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(paymentForm),
      });
      console.log('응답 상태:', response.status);
      if (response.ok) {
        console.log('성공!');
        setShowPaymentModal(false);
        setPaymentForm({ card_company: '', card_number: '', card_holder: '', expiry_date: '', is_default: false });
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        console.log('실패:', error);
        alert(error.detail || '결제수단 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('에러:', error);
      alert('결제수단 추가 중 오류가 발생했습니다.');
    }
  };

  // 결제수단 삭제
  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('결제수단을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/payment/methods/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) fetchPaymentMethods();
    } catch (error) {
      alert('결제수단 삭제 중 오류가 발생했습니다.');
    }
  };

  // 환불계좌 추가
  const handleAddRefundAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/payment/refund-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(refundForm),
      });
      if (response.ok) {
        setShowRefundModal(false);
        setRefundForm({ bank_name: '', account_number: '', account_holder: '', is_default: false });
        fetchRefundAccounts();
      } else {
        const error = await response.json();
        alert(error.detail || '환불계좌 추가에 실패했습니다.');
      }
    } catch (error) {
      alert('환불계좌 추가 중 오류가 발생했습니다.');
    }
  };

  // 환불계좌 삭제
  const handleDeleteRefundAccount = async (id: string) => {
    if (!confirm('환불계좌를 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/payment/refund-accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) fetchRefundAccounts();
    } catch (error) {
      alert('환불계좌 삭제 중 오류가 발생했습니다.');
    }
  };

  // 배송지 추가
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/payment/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(addressForm),
      });
      if (response.ok) {
        setShowAddressModal(false);
        setAddressForm({ name: '', recipient: '', phone: '', postal_code: '', address: '', detail_address: '', is_default: false });
        fetchAddresses();
      } else {
        const error = await response.json();
        alert(error.detail || '배송지 추가에 실패했습니다.');
      }
    } catch (error) {
      alert('배송지 추가 중 오류가 발생했습니다.');
    }
  };

  // 배송지 삭제
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('배송지를 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/payment/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) fetchAddresses();
    } catch (error) {
      alert('배송지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 기본 배송지 설정
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/addresses/${id}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) fetchAddresses();
    } catch (error) {
      alert('기본 배송지 설정 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      {/* Profile Info */}
      <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">회원 정보</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">이름</span>
            <span className="text-xs text-gray-900 dark:text-white">{user.full_name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">이메일</span>
            <span className="text-xs text-gray-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">전화번호</span>
            <span className="text-xs text-gray-900 dark:text-white">{user.phone || '미등록'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">회원 유형</span>
            <span className="text-xs text-gray-900 dark:text-white">
              {user.user_type === 'seller' ? '판매자' : '일반 회원'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">추천 ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                {user.referral_code || `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`}
              </span>
              <button
                onClick={() => {
                  const code = user.referral_code || `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                  navigator.clipboard.writeText(code);
                  alert('추천 ID가 복사되었습니다!');
                }}
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                복사
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Info (if seller) */}
      {vendor && (
        <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">판매자 정보</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">스토어 이름</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.store_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">사업자명</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.business_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">사업자등록번호</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.business_number}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">사업장 주소</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.business_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">승인 상태</span>
              <span className={`text-xs font-medium ${vendor.is_verified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {vendor.is_verified ? '승인 완료' : '승인 대기'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment & Delivery Management */}
      {user.user_type !== 'seller' && (
        <>
          {/* Payment Methods */}
          <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">결제 수단</h2>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-3 py-1.5 text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + 추가
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {method.card_company}
                          {method.is_default && <span className="ml-2 text-blue-600 dark:text-blue-400">(기본)</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{method.card_number}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      삭제
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">등록된 결제 수단이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Refund Account */}
          <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">환불 계좌</h2>
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="px-3 py-1.5 text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + 추가
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {refundAccounts.length > 0 ? (
                refundAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {account.bank_name}
                          {account.is_default && <span className="ml-2 text-blue-600 dark:text-blue-400">(기본)</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{account.account_number} ({account.account_holder})</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRefundAccount(account.id)}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      삭제
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">등록된 환불 계좌가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Delivery Addresses */}
          <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">배송지 관리</h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-3 py-1.5 text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + 추가
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div key={addr.id} className="border border-gray-200 p-3 dark:border-gray-700">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{addr.name}</span>
                        {addr.is_default && (
                          <span className="bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            기본 배송지
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            기본 배송지로 설정
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      [{addr.postal_code}] {addr.address} {addr.detail_address}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{addr.recipient} · {addr.phone}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">등록된 배송지가 없습니다.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-blue-100 dark:bg-blue-900">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">주문</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-purple-100 dark:bg-purple-900">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">찜한 상품</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-green-100 dark:bg-green-900">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">포인트</p>
            </div>
          </div>
        </div>
      </div>

      {/* 결제수단 추가 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-md bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">결제수단 추가</h3>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">카드사</label>
                <select
                  value={paymentForm.card_company}
                  onChange={(e) => setPaymentForm({ ...paymentForm, card_company: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="신한카드">신한카드</option>
                  <option value="삼성카드">삼성카드</option>
                  <option value="현대카드">현대카드</option>
                  <option value="KB국민카드">KB국민카드</option>
                  <option value="롯데카드">롯데카드</option>
                  <option value="하나카드">하나카드</option>
                  <option value="우리카드">우리카드</option>
                  <option value="NH농협카드">NH농협카드</option>
                  <option value="BC카드">BC카드</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">카드번호</label>
                <input
                  type="text"
                  value={paymentForm.card_number}
                  onChange={(e) => setPaymentForm({ ...paymentForm, card_number: e.target.value })}
                  placeholder="1234-5678-9012-3456"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">카드 소유자명</label>
                <input
                  type="text"
                  value={paymentForm.card_holder}
                  onChange={(e) => setPaymentForm({ ...paymentForm, card_holder: e.target.value })}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">유효기간</label>
                <input
                  type="text"
                  value={paymentForm.expiry_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, expiry_date: e.target.value })}
                  placeholder="MM/YY"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={paymentForm.is_default}
                  onChange={(e) => setPaymentForm({ ...paymentForm, is_default: e.target.checked })}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">기본 결제수단으로 설정</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 border border-gray-300 py-2 text-sm dark:border-gray-600">
                  취소
                </button>
                <button type="submit" className="flex-1 bg-gray-900 py-2 text-sm text-white dark:bg-white dark:text-gray-900">
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 환불계좌 추가 모달 */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setShowRefundModal(false)}>
          <div className="w-full max-w-md bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">환불계좌 추가</h3>
            <form onSubmit={handleAddRefundAccount} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">은행</label>
                <select
                  value={refundForm.bank_name}
                  onChange={(e) => setRefundForm({ ...refundForm, bank_name: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="신한은행">신한은행</option>
                  <option value="국민은행">국민은행</option>
                  <option value="우리은행">우리은행</option>
                  <option value="하나은행">하나은행</option>
                  <option value="농협은행">농협은행</option>
                  <option value="기업은행">기업은행</option>
                  <option value="카카오뱅크">카카오뱅크</option>
                  <option value="토스뱅크">토스뱅크</option>
                  <option value="케이뱅크">케이뱅크</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">계좌번호</label>
                <input
                  type="text"
                  value={refundForm.account_number}
                  onChange={(e) => setRefundForm({ ...refundForm, account_number: e.target.value })}
                  placeholder="110-123-456789"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">예금주</label>
                <input
                  type="text"
                  value={refundForm.account_holder}
                  onChange={(e) => setRefundForm({ ...refundForm, account_holder: e.target.value })}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={refundForm.is_default}
                  onChange={(e) => setRefundForm({ ...refundForm, is_default: e.target.checked })}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">기본 환불계좌로 설정</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowRefundModal(false)} className="flex-1 border border-gray-300 py-2 text-sm dark:border-gray-600">
                  취소
                </button>
                <button type="submit" className="flex-1 bg-gray-900 py-2 text-sm text-white dark:bg-white dark:text-gray-900">
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 배송지 추가 모달 */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setShowAddressModal(false)}>
          <div className="w-full max-w-md bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">배송지 추가</h3>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">배송지명</label>
                <input
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="자택, 회사 등"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">수령인</label>
                <input
                  type="text"
                  value={addressForm.recipient}
                  onChange={(e) => setAddressForm({ ...addressForm, recipient: e.target.value })}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">연락처</label>
                <input
                  type="text"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">우편번호</label>
                <input
                  type="text"
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                  placeholder="12345"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">기본주소</label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="서울시 강남구 테헤란로 123"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">상세주소</label>
                <input
                  type="text"
                  value={addressForm.detail_address}
                  onChange={(e) => setAddressForm({ ...addressForm, detail_address: e.target.value })}
                  placeholder="101동 202호"
                  className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">기본 배송지로 설정</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 border border-gray-300 py-2 text-sm dark:border-gray-600">
                  취소
                </button>
                <button type="submit" className="flex-1 bg-gray-900 py-2 text-sm text-white dark:bg-white dark:text-gray-900">
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
