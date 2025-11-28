/**
 * 사용자 인증 및 권한 관련 유틸리티
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
}

/**
 * 판매자 정보 조회
 */
export async function getVendorInfo() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/vendors/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('판매자 정보 조회 실패:', error);
    return null;
  }
}

/**
 * 승인된 판매자인지 확인
 */
export async function isApprovedVendor(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_type !== 'seller') return false;

    const vendor = await getVendorInfo();
    if (!vendor) return false;

    return vendor.approval_status === 'approved' && vendor.is_active === true;
  } catch (error) {
    console.error('판매자 승인 상태 확인 실패:', error);
    return false;
  }
}

/**
 * 판매자 승인 대기 중인지 확인
 */
export async function isVendorPending(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_type !== 'seller') return false;

    const vendor = await getVendorInfo();
    if (!vendor) return false;

    return vendor.approval_status === 'pending';
  } catch (error) {
    console.error('판매자 대기 상태 확인 실패:', error);
    return false;
  }
}

/**
 * 관리자인지 확인
 */
export function isAdmin(): boolean {
  return !!localStorage.getItem('admin_token');
}
