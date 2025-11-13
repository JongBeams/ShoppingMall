'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/app/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      // 토큰을 localStorage에 저장
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      if (response.vendor) {
        localStorage.setItem('vendor', JSON.stringify(response.vendor));
      }

      alert('로그인 성공!');
      // 페이지 이동 후 새로고침하여 헤더 업데이트
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
        로그인
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
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
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
        <Link href="/find-password" className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          비밀번호 찾기
        </Link>
        <Link href="/register" className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          회원가입
        </Link>
      </div>

      <div className="mt-6 space-y-2">
        <button className="flex w-full items-center justify-center gap-2 border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <span>📱</span> 카카오 로그인
        </button>
        <button className="flex w-full items-center justify-center gap-2 border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <span>N</span> 네이버 로그인
        </button>
      </div>
    </div>
  );
}
