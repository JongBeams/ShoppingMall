'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/app/lib/api';

type UserType = 'buyer' | 'seller';

export default function RegisterForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>('buyer');

  // 일반 회원과 사업자 회원의 데이터를 별도로 관리
  const [buyerFormData, setBuyerFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [sellerFormData, setSellerFormData] = useState({
    name: '',
    email: '',
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

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
        email: formData.email,
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

      const response = await authAPI.register(registerData);

      // 토큰을 localStorage에 저장
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      if (response.vendor) {
        localStorage.setItem('vendor', JSON.stringify(response.vendor));
      }

      alert(`${userType === 'buyer' ? '일반 회원' : '사업자 회원'} 가입 성공!`);
      router.push('/');
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
            이름
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="홍길동"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            이메일
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="example@email.com"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            전화번호
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="010-1234-5678"
            maxLength={13}
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            비밀번호
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="6자 이상, 특수문자 포함"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            비밀번호 확인
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="비밀번호를 다시 입력하세요"
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
                    사업자명
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="상호명을 입력하세요"
                    required={userType === 'seller'}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    placeholder="123-45-67890"
                    required={userType === 'seller'}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    사업장 주소
                  </label>
                  <input
                    type="text"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="사업장 주소를 입력하세요"
                    required={userType === 'seller'}
                    className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    스토어 이름
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="스토어 이름을 입력하세요"
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
                    placeholder="스토어에 대한 간단한 설명을 입력하세요"
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
          disabled={isLoading}
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
