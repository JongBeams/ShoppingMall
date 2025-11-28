'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface VendorAuthGuardProps {
  children: React.ReactNode;
}

export default function VendorAuthGuard({ children }: VendorAuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const checkVendorStatus = async () => {
      try {
        // 로그인 확인
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!user || !token) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(user);

        // 판매자가 아니면 홈으로
        if (userData.user_type !== 'seller') {
          router.push('/');
          return;
        }

        // 판매자 승인 상태 확인
        const response = await fetch(`${API_BASE_URL}/vendors/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const vendorData = await response.json();

          // 승인된 판매자만 통과
          if (vendorData.approval_status === 'approved' && vendorData.is_active) {
            setIsApproved(true);
          } else {
            // 승인되지 않은 판매자는 홈으로 리다이렉트
            router.push('/');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('판매자 상태 확인 실패:', error);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkVendorStatus();
  }, [router]);

  // 체크 중이면 로딩 화면
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-white"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 승인된 판매자만 자식 컴포넌트 렌더링
  if (isApproved) {
    return <>{children}</>;
  }

  return null;
}
