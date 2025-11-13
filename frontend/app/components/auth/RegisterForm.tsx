'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/app/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

type UserType = 'buyer' | 'seller';

export default function RegisterForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>('buyer');

  // 이메일 인증 상태
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // 남은 시간 (초)

  // 일반 회원과 사업자 회원의 데이터를 별도로 관리
  const [buyerFormData, setBuyerFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [sellerFormData, setSellerFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    businessNumber: '',
    businessAddress: '',
    storeName: '',
    storeDescription: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 현재 선택된 탭에 따라 formData 결정
  const formData = userType === 'buyer' ? buyerFormData : sellerFormData;
  const setFormData = userType === 'buyer' ? setBuyerFormData : setSellerFormData;

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    setError('');
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // 주소 검색
  const handleAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        // 도로명 주소 또는 지번 주소 선택
        const fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        setFormData({ ...formData, businessAddress: fullAddress });
      }
    }).open();
  };

  // 타이머 useEffect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 시간 포맷팅 (5:00 형식)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP 전송
  const handleSendOTP = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || '인증번호 전송에 실패했습니다.');
        return;
      }

      setOtpSent(true);
      setTimeLeft(300); // 5분 = 300초
      setSuccessMessage(data.message);
    } catch (err: any) {
      setError(err.message || '인증번호 전송 중 오류가 발생했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP 검증
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('6자리 인증번호를 입력해주세요.');
      return;
    }

    setOtpLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '인증번호 확인에 실패했습니다.');
      }

      setIsEmailVerified(true);
      setTimeLeft(0); // 타이머 종료
      setSuccessMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }

    if (!agreedToTerms) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 유효성 검사: 6자 이상, 특수문자 포함
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(formData.password)) {
      setError('비밀번호에 특수문자를 포함해야 합니다.');
      return;
    }

    // 사업자 회원가입 시 필수 필드 검증
    if (userType === 'seller') {
      if (!formData.businessName || !formData.businessNumber || !formData.businessAddress || !formData.storeName) {
        setError('사업자 정보를 모두 입력해주세요.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const registerData = {
        email: email,
        password: formData.password,
        full_name: formData.name,
        phone: formData.phone,
        user_type: userType,
        ...(userType === 'seller' && {
          business_name: formData.businessName,
          business_number: formData.businessNumber,
          business_address: formData.businessAddress,
          store_name: formData.storeName,
          store_description: formData.storeDescription || undefined,
        }),
      };

      await authAPI.register(registerData);

      alert(`${userType === 'buyer' ? '일반 회원' : '사업자 회원'} 가입 성공! 로그인해주세요.`);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
        회원가입
      </h2>

      {/* 회원 유형 선택 탭 */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => handleUserTypeChange('buyer')}
          className={`flex-1 border-b-2 pb-3 text-sm font-medium transition ${
            userType === 'buyer'
              ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          일반 회원
        </button>
        <button
          type="button"
          onClick={() => handleUserTypeChange('seller')}
          className={`flex-1 border-b-2 pb-3 text-sm font-medium transition ${
            userType === 'seller'
              ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          사업자 회원
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value } as any)}
            placeholder="이름을 입력해주세요"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        {/* 이메일 인증 섹션 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            이메일 <span className="text-red-500">*</span> {isEmailVerified && <span className="text-green-600 dark:text-green-400">✓ 인증완료</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력해주세요"
              disabled={isEmailVerified}
              required
              className="flex-1 border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:disabled:bg-gray-600"
            />
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isEmailVerified || otpLoading}
              className="whitespace-nowrap border border-gray-900 bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900"
            >
              {otpLoading ? '전송중...' : otpSent ? '재전송' : '인증'}
            </button>
          </div>

          {successMessage && otpSent && !isEmailVerified && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              인증번호가 전송되었습니다.
            </p>
          )}

          {isEmailVerified && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ 이메일 인증이 완료되었습니다.
            </p>
          )}

          {otpSent && !isEmailVerified && (
            <>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6자리 인증번호"
                  maxLength={6}
                  className="flex-1 border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || timeLeft === 0}
                  className="whitespace-nowrap border border-green-600 bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {otpLoading ? '확인중...' : '인증확인'}
                </button>
              </div>
              {timeLeft > 0 ? (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  남은 시간: {formatTime(timeLeft)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  인증번호가 만료되었습니다. 재전송 버튼을 눌러주세요.
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="전화번호를 입력해주세요"
            maxLength={13}
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            비밀번호 <span className="text-red-500">*</span> <span className="text-xs text-gray-500 dark:text-gray-400">(특수문자 포함 6자 이상)</span>
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="비밀번호를 입력해주세요"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="비밀번호 확인을 입력해주세요"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        {/* 사업자 회원 추가 필드 */}
        {userType === 'seller' && (
          <>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                사업자 정보
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    사업자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="사업자명을 입력해주세요"
                    required={userType === 'seller'}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    placeholder="사업자등록번호를 입력해주세요"
                    required={userType === 'seller'}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    사업장 주소 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.businessAddress}
                      placeholder="주소 검색 버튼을 클릭해주세요"
                      required={userType === 'seller'}
                      readOnly
                      className="flex-1 border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddressSearch}
                      className="whitespace-nowrap border border-gray-900 bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900"
                    >
                      주소 찾기
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    스토어 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="스토어 이름을 입력해주세요"
                    required={userType === 'seller'}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    스토어 설명 (선택)
                  </label>
                  <textarea
                    value={formData.storeDescription}
                    onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                    placeholder="스토어 설명을 입력해주세요 (선택사항)"
                    rows={3}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setAgreedToTerms(!agreedToTerms);
                }
              }}
              className="h-4 w-4 border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              이용약관 및 개인정보처리방침에 동의합니다 (필수)
            </span>
          </label>
        </div>

        {error && (
          <div className="border border-red-500 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}


        <button
          type="submit"
          disabled={isLoading || !isEmailVerified}
          className="w-full border border-gray-900 bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {isLoading ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-6 text-center dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">이미 계정이 있으신가요?</span>{' '}
        <Link href="/login" className="text-sm font-medium text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300">
          로그인
        </Link>
      </div>
    </div>
  );
}