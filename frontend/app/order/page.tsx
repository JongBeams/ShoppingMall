'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cartAPI } from '../lib/api';
import { CartItem } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface OrderForm {
  recipient_name: string;
  recipient_phone: string;
  postal_code: string;
  address: string;
  address_detail: string;
  delivery_message: string;
  payment_method: 'card' | 'bank' | 'kakao' | 'toss';
}

export default function OrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderType = searchParams.get('type'); // 'direct' = 바로구매
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [orderForm, setOrderForm] = useState<OrderForm>({
    recipient_name: '',
    recipient_phone: '',
    postal_code: '',
    address: '',
    address_detail: '',
    delivery_message: '',
    payment_method: 'card',
  });
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [paymentPopup, setPaymentPopup] = useState<Window | null>(null);

  // 사용자 정보 및 장바구니 조회
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // 기본 배송지 API에서 불러오기
      fetchDefaultAddress(token, parsedUser);
      // 저장된 결제수단 불러오기
      fetchSavedCards(token);
      // 저장된 계좌 불러오기
      fetchSavedAccounts(token);
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }

    // 바로구매인 경우
    if (orderType === 'direct') {
      const directOrderData = sessionStorage.getItem('directOrder');
      if (directOrderData) {
        try {
          const items = JSON.parse(directOrderData);
          const cartItemsFromDirect: any[] = items.map((item: any, index: number) => ({
            id: `direct-${index}`,
            product_id: item.product_id,
            product_name: item.product_name,
            product_thumbnail: item.product_image,
            product_price: item.price,
            product_original_price: item.original_price || item.price,
            is_on_sale: item.is_on_sale || false,
            quantity: item.quantity,
            total_price: item.price * item.quantity,
            selected_options: item.selected_options || [],
            vendor_name: item.vendor_name,
          }));
          setCartItems(cartItemsFromDirect);
          setLoading(false);
          sessionStorage.removeItem('directOrder');
          return;
        } catch (e) {
          console.error('바로구매 데이터 파싱 실패:', e);
        }
      }
      // 데이터 없으면 장바구니로
      alert('주문 정보가 없습니다.');
      router.push('/cart');
      return;
    }

    // 장바구니 주문인 경우
    fetchCart(token);
  }, [orderType]);

  // 결제 팝업에서 postMessage 받기 (실패 시에만 사용)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안을 위해 origin 확인
      if (event.origin !== window.location.origin) {
        return;
      }

      // 결제 실패 메시지만 처리 (성공은 success 페이지에서 직접 처리)
      if (event.data.type === 'PAYMENT_FAILURE') {
        console.log('결제 실패:', event.data.data);
        alert(`결제 실패: ${event.data.data.message}`);
        setSubmitting(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 저장된 결제수단 불러오기
  const fetchSavedCards = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedCards(data.payment_methods || []);
        // 기본 카드가 있으면 선택
        const defaultCard = (data.payment_methods || []).find((c: any) => c.is_default);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        }
      }
    } catch (error) {
      console.error('저장된 결제수단 조회 실패:', error);
    }
  };

  // 저장된 계좌 불러오기
  const fetchSavedAccounts = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/refund-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedAccounts(data.refund_accounts || []);
        // 기본 계좌가 있으면 선택
        const defaultAccount = (data.refund_accounts || []).find((a: any) => a.is_default);
        if (defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        }
      }
    } catch (error) {
      console.error('저장된 계좌 조회 실패:', error);
    }
  };

  // 기본 배송지 API에서 불러오기
  const fetchDefaultAddress = async (token: string, parsedUser: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/addresses/default`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setOrderForm((prev) => ({
            ...prev,
            recipient_name: data.recipient || parsedUser.full_name || '',
            recipient_phone: data.phone || parsedUser.phone || '',
            postal_code: data.postal_code || '',
            address: data.address || '',
            address_detail: data.detail_address || '',
          }));
          setHasSavedAddress(true);
        } else {
          // 기본 배송지 없으면 사용자 정보로 초기값 설정
          setOrderForm((prev) => ({
            ...prev,
            recipient_name: parsedUser.full_name || '',
            recipient_phone: parsedUser.phone || '',
          }));
        }
      }
    } catch (error) {
      console.error('기본 배송지 조회 실패:', error);
      // 실패시 사용자 정보로
      setOrderForm((prev) => ({
        ...prev,
        recipient_name: parsedUser.full_name || '',
        recipient_phone: parsedUser.phone || '',
      }));
    }
  };

  // 장바구니 조회 (선택된 상품만)
  const fetchCart = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cartAPI.get(token);

      if (!response.items || response.items.length === 0) {
        alert('장바구니가 비어있습니다.');
        router.push('/cart');
        return;
      }

      // 선택된 상품 ID 가져오기
      const selectedItemsJson = sessionStorage.getItem('selectedCartItems');
      let items = response.items || [];

      if (selectedItemsJson) {
        const selectedIds = JSON.parse(selectedItemsJson) as string[];
        items = items.filter((item: CartItem) => selectedIds.includes(item.id));
        // 사용 후 삭제
        sessionStorage.removeItem('selectedCartItems');
      }

      if (items.length === 0) {
        alert('주문할 상품이 없습니다.');
        router.push('/cart');
        return;
      }

      setCartItems(items);
    } catch (err: any) {
      console.error('장바구니 조회 실패:', err);
      setError(err.message || '장바구니를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 전화번호 자동 포맷
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'recipient_phone') {
      setOrderForm((prev) => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setOrderForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 우편번호 검색 (다음 주소 API)
  const searchPostalCode = () => {
    // @ts-ignore
    new window.daum.Postcode({
      oncomplete: function (data: any) {
        setOrderForm((prev) => ({
          ...prev,
          postal_code: data.zonecode,
          address: data.address,
        }));
      },
    }).open();
  };

  // 주문하기 (결제 팝업 열기)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 입력값 검증
    if (!orderForm.recipient_name || !orderForm.recipient_phone || !orderForm.address) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    // sessionStorage에 주문 데이터 저장
    const checkoutData = {
      amount: finalPrice,
      orderName: cartItems.length > 1
        ? `${cartItems[0].product_name} 외 ${cartItems.length - 1}건`
        : cartItems[0].product_name,
      ...orderForm,
      email: user?.email || '',
      items: cartItems,
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // 결제 팝업 열기 (800x700 크기)
    const popup = window.open(
      '/order/checkout',
      'payment',
      'width=800,height=700,left=100,top=100'
    );
    setPaymentPopup(popup);
  };


  // 금액 계산
  const totalPrice = cartItems.reduce((sum, item) => sum + item.total_price, 0);
  const deliveryFee = totalPrice >= 50000 ? 0 : 3000;
  const finalPrice = totalPrice + deliveryFee;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">주문 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">주문하기</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          주문할 상품을 확인하고 배송지를 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* 왼쪽: 주문 정보 */}
          <div className="space-y-4 lg:col-span-2">
            {/* 주문 상품 */}
            <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">주문 상품</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
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
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/products/${item.product_id}`}
                            className="text-sm font-medium text-gray-900 hover:underline dark:text-white"
                          >
                            {item.product_name}
                          </Link>
                          {item.selected_options && item.selected_options.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.selected_options.map((option, idx) => (
                                <p key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                                  • {option.option_name}: {option.value_name}
                                  {option.price > 0 && ` (+${option.price.toLocaleString()}원)`}
                                </p>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {(item as any).is_on_sale ? (
                              <>
                                <span className="text-blue-600 dark:text-blue-400">{Math.floor(item.product_price).toLocaleString()}원</span>
                                <span className="ml-1 text-gray-400 line-through">{Math.floor((item as any).product_original_price).toLocaleString()}원</span>
                              </>
                            ) : (
                              <>{Math.floor(item.product_price).toLocaleString()}원</>
                            )}
                            {' '}× {item.quantity}개
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {Math.floor(item.total_price).toLocaleString()}원
                          </p>
                          {(item as any).is_on_sale && (
                            <p className="text-xs text-gray-400 line-through">
                              {Math.floor((item as any).product_original_price * item.quantity).toLocaleString()}원
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 배송지 정보 */}
            <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">배송지 정보</h2>
                  {hasSavedAddress && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      저장됨
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                    받는 사람 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="recipient_name"
                    value={orderForm.recipient_name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                    휴대폰 번호 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="recipient_phone"
                    value={orderForm.recipient_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                    주소 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="postal_code"
                      value={orderForm.postal_code}
                      readOnly
                      className="w-32 border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="우편번호"
                    />
                    <button
                      type="button"
                      onClick={searchPostalCode}
                      className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      우편번호 찾기
                    </button>
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={orderForm.address}
                    readOnly
                    required
                    className="mt-2 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="주소를 검색해주세요"
                  />
                  <input
                    type="text"
                    name="address_detail"
                    value={orderForm.address_detail}
                    onChange={handleInputChange}
                    className="mt-2 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                    placeholder="상세주소를 입력하세요"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                    배송 메시지
                  </label>
                  <select
                    name="delivery_message_select"
                    value={orderForm.delivery_message.startsWith('직접입력:') ? '직접입력' : orderForm.delivery_message}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '직접입력') {
                        setOrderForm((prev) => ({ ...prev, delivery_message: '직접입력:' }));
                      } else {
                        setOrderForm((prev) => ({ ...prev, delivery_message: value }));
                      }
                    }}
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  >
                    <option value="">배송 메시지를 선택하세요</option>
                    <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
                    <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
                    <option value="배송 전 연락 바랍니다">배송 전 연락 바랍니다</option>
                    <option value="부재 시 휴대폰으로 연락주세요">부재 시 휴대폰으로 연락주세요</option>
                    <option value="택배함에 넣어주세요">택배함에 넣어주세요</option>
                    <option value="직접입력">직접 입력하기</option>
                  </select>
                  {orderForm.delivery_message.startsWith('직접입력:') && (
                    <div className="mt-2">
                      <textarea
                        name="delivery_message_custom"
                        value={orderForm.delivery_message.replace('직접입력:', '')}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 50);
                          setOrderForm((prev) => ({ ...prev, delivery_message: '직접입력:' + value }));
                        }}
                        maxLength={50}
                        rows={2}
                        className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                        placeholder="배송 메시지를 입력하세요 (최대 50자)"
                      />
                      <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                        {orderForm.delivery_message.replace('직접입력:', '').length}/50자
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 결제 수단 */}
            <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">결제 수단</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'card', label: '신용/체크카드', icon: '💳', disabled: false },
                    { value: 'transfer', label: '계좌이체', icon: '🏧', disabled: false },
                    { value: 'bank', label: '무통장입금', icon: '🏦', disabled: true },
                  ].map((method) => (
                    <label
                      key={method.value}
                      onClick={(e) => {
                        if (method.disabled) {
                          e.preventDefault();
                          alert('개발 중입니다.');
                        }
                      }}
                      className={`flex cursor-pointer flex-col items-center justify-center border p-4 transition ${
                        method.disabled
                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60 dark:border-gray-700 dark:bg-gray-800'
                          : orderForm.payment_method === method.value
                          ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.value}
                        checked={orderForm.payment_method === method.value}
                        onChange={handleInputChange}
                        disabled={method.disabled}
                        className="sr-only"
                      />
                      <div className="mb-2 text-2xl">{method.icon}</div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* 저장된 카드 목록 */}
                {orderForm.payment_method === 'card' && savedCards.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">저장된 카드</p>
                    {savedCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex cursor-pointer items-center gap-3 border p-3 transition ${
                          selectedCardId === card.id
                            ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_card"
                          checked={selectedCardId === card.id}
                          onChange={() => setSelectedCardId(card.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {card.card_company}
                            {card.is_default && <span className="ml-2 text-xs text-blue-600">(기본)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{card.card_number}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* 저장된 계좌 목록 */}
                {orderForm.payment_method === 'transfer' && savedAccounts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">저장된 계좌</p>
                    {savedAccounts.map((account) => (
                      <label
                        key={account.id}
                        className={`flex cursor-pointer items-center gap-3 border p-3 transition ${
                          selectedAccountId === account.id
                            ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_account"
                          checked={selectedAccountId === account.id}
                          onChange={() => setSelectedAccountId(account.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {account.bank_name}
                            {account.is_default && <span className="ml-2 text-xs text-blue-600">(기본)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{account.account_number} ({account.account_holder})</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 결제 정보 */}
          <div>
            <div className="sticky top-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">결제 금액</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>상품 금액</span>
                    <span>{totalPrice.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>배송비</span>
                    <span>{deliveryFee === 0 ? '무료' : `${deliveryFee.toLocaleString()}원`}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      * 50,000원 이상 구매시 무료배송
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>최종 결제 금액</span>
                  <span className="text-red-600 dark:text-red-500">{finalPrice.toLocaleString()}원</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 w-full border border-gray-900 bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {submitting ? '주문 처리 중...' : `${finalPrice.toLocaleString()}원 결제하기`}
                </button>

                <Link
                  href="/cart"
                  className="mt-2 block w-full border border-gray-300 bg-white py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  장바구니로 돌아가기
                </Link>

                {/* 안내사항 */}
                <div className="mt-5 space-y-2 border-t border-gray-200 pt-5 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">주문 안내</h3>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• 주문 완료 후 배송 준비까지 1-2일 소요됩니다.</li>
                    <li>• 배송은 평일 기준 2-3일 소요됩니다.</li>
                    <li>• 주문 취소는 배송 전까지 가능합니다.</li>
                    <li>• 교환/환불은 상품 수령 후 7일 이내 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}
