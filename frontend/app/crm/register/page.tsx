'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function CRMRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 이메일 인증 상태
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

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

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    let formattedPhone = '';

    if (value.length <= 3) {
      formattedPhone = value;
    } else if (value.length <= 7) {
      formattedPhone = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length <= 11) {
      formattedPhone = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else {
      formattedPhone = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }

    setFormData({ ...formData, phone: formattedPhone });
  };

  // OTP 전송
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '인증번호 전송에 실패했습니다.');
      }

      setOtpSent(true);
      setTimeLeft(300);
      setSuccessMessage(data.message);
    } catch (err: any) {
      setError(err.message);
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
        body: JSON.stringify({ email: formData.email, token: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '인증번호 확인에 실패했습니다.');
      }

      setIsEmailVerified(true);
      setTimeLeft(0);
      setSuccessMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }

    // 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('비밀번호에 특수문자를 포함해야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
        }),
      });

      if (response.ok) {
        alert('관리자 계정이 생성되었습니다. 로그인 해주세요.');
        router.push('/crm/login');
      } else {
        const data = await response.json();
        setError(data.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버와 연결할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CRM</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">관리자 계정 생성</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                이름 <span className="text-red-600">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                placeholder="이름을 입력해주세요"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                이메일 <span className="text-red-600">*</span> {isEmailVerified && <span className="text-green-600 dark:text-green-400">✓ 인증완료</span>}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEmailVerified}
                  className="flex-1 border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white dark:disabled:bg-gray-600"
                  placeholder="이메일을 입력해주세요"
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isEmailVerified || otpLoading}
                  className="whitespace-nowrap border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900"
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
                      className="flex-1 border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={otpLoading || timeLeft === 0}
                      className="whitespace-nowrap border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                전화번호
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="mt-1 block w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                placeholder="전화번호를 입력해주세요"
                maxLength={13}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                비밀번호 <span className="text-red-600">*</span> <span className="text-xs text-gray-500">(특수문자 포함 6자 이상)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                placeholder="비밀번호를 입력해주세요"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                비밀번호 확인 <span className="text-red-600">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-white"
                placeholder="비밀번호를 다시 입력해주세요"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isEmailVerified}
              className="w-full border border-gray-900 bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {isLoading ? '등록 중...' : '관리자 계정 생성'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">이미 계정이 있으신가요? </span>
            <Link href="/crm/login" className="font-medium text-gray-900 hover:underline dark:text-white">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}