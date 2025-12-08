// FastAPI 백엔드 연동을 위한 API 유틸리티

import { CreateProductRequest, GetVendorProductRequest } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string;
}

// Refresh Token 갱신 (재귀 방지 플래그)
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(isAdmin: boolean = false): Promise<string | null> {
  try {
    const refreshToken = isAdmin
      ? localStorage.getItem('admin_refresh_token')
      : localStorage.getItem('refresh_token');

    if (!refreshToken) {
      console.error('[API] Refresh Token 없음');
      return null;
    }

    const endpoint = isAdmin ? '/admin/refresh' : '/auth/refresh';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      console.error('[API] Refresh Token 갱신 실패');
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    // 새 Access Token 저장
    if (isAdmin) {
      localStorage.setItem('admin_token', newAccessToken);
    } else {
      localStorage.setItem('access_token', newAccessToken);
    }

    console.log('[API] Access Token 갱신 성공');
    return newAccessToken;
  } catch (error) {
    console.error('[API] Refresh Token 갱신 오류:', error);
    return null;
  }
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers if any
  if (fetchOptions.headers) {
    const existingHeaders = new Headers(fetchOptions.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));

    // 토큰 만료 또는 유효하지 않음 (401) - Refresh Token 시도
    if (response.status === 401 && token) {
      const isAdmin = window.location.pathname.startsWith('/crm');

      // Refresh Token 갱신 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            // 새 토큰으로 재시도
            fetchAPI(endpoint, { ...options, token: newToken })
              .then(resolve)
              .catch(reject);
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken(isAdmin);
      isRefreshing = false;

      if (newToken) {
        // 대기 중인 요청들에게 새 토큰 전달
        onTokenRefreshed(newToken);

        // 현재 요청 재시도
        return fetchAPI(endpoint, { ...options, token: newToken });
      }

      // Refresh Token 실패 → 로그아웃
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('vendor');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');

      if (isAdmin) {
        window.location.href = '/crm/login';
      } else {
        window.location.href = '/login';
      }
      throw new Error('로그인이 필요합니다.');
    }

    // 403 에러 처리
    if (response.status === 403) {
      // 비활성화된 계정 - 로그아웃
      if (error.detail?.includes('비활성화된 계정')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('vendor');
        alert('비활성화된 계정입니다. 관리자에게 문의해주세요. (wwhow2003@naver.com)');
        window.location.href = '/login';
        throw new Error(error.detail);
      }

      // 승인 대기 중인 판매자 - 에러만 던짐 (로그아웃 안 함)
      throw new Error(error.detail || '접근 권한이 없습니다.');
    }

    // 5xx 서버 에러
    if (response.status >= 500) {
      console.error('[API] 서버 오류:', error);
      throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    // FastAPI는 detail 필드를 사용
    const errorMessage = error.detail || error.message || `API Error: ${response.status}`;
    const errorObj = new Error(errorMessage);
    (errorObj as any).response = { data: error };
    throw errorObj;
  }

  return response.json();
}

// Product API
export const productAPI = {
  getAll: () => fetchAPI('/products'),
  getById: (id: string) => fetchAPI(`/products/${id}`),
  getByCategory: (category: string) => fetchAPI(`/products/category/${category}`),
  getCategories: () => fetchAPI('/products/categories'),
  search: (query: string) => fetchAPI(`/products/search?q=${encodeURIComponent(query)}`),
};

// Auth API types
interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  user_type: 'buyer' | 'seller';
  business_name?: string;
  business_number?: string;
  business_address?: string;
  store_name?: string;
  store_description?: string;
}

interface LoginData {
  email: string;
  password: string;
}

// Auth API
export const authAPI = {
  login: (data: LoginData) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: RegisterData) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: (token: string) =>
    fetchAPI('/auth/logout', {
      method: 'POST',
      token,
    }),
  getUser: (token: string) =>
    fetchAPI('/auth/me', {
      token,
    }),
};

// Cart API
export const cartAPI = {
  // 장바구니 조회
  get: (token: string) => fetchAPI('/cart', { token }),

  // 장바구니에 상품 추가
  add: (
    product_id: string,
    quantity: number,
    token: string,
    selected_options?: Array<{ option_id: string; value_id: string }>
  ) =>
    fetchAPI('/cart', {
      method: 'POST',
      body: JSON.stringify({
        product_id,
        quantity,
        ...(selected_options && selected_options.length > 0 && { selected_options })
      }),
      token,
    }),

  // 장바구니 수량 변경
  updateQuantity: (item_id: string, quantity: number, token: string) =>
    fetchAPI(`/cart/${item_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
      token,
    }),

  // 장바구니 아이템 삭제
  remove: (item_id: string, token: string) =>
    fetchAPI(`/cart/${item_id}`, {
      method: 'DELETE',
      token,
    }),

  // 장바구니 전체 비우기
  clear: (token: string) =>
    fetchAPI('/cart', {
      method: 'DELETE',
      token,
    }),
};



// Product Management API (판매자 전용)
export const productManagementAPI = {
  // 판매자의 상품 목록 조회
  getMyProducts: (token: string): Promise<{ message: string; products: GetVendorProductRequest[] }> =>
    fetchAPI('/products/management', {
      method: 'GET',
      token,
    }),

  // 수정 시 기존 상품 정보 조회
  getById: (id: string, token: string) =>
    fetchAPI(`/products/management/${id}`, {
      method: 'GET',
      token,
    }),

  // 상품 등록/수정 (판매자 전용)
  create: (data: CreateProductRequest, token: string) => {
    // image 필드를 image_url로 변환 (단, image_url이 이미 있으면 유지)
    const { image, ...productData } = data;

    return fetchAPI(`/products/management/${data.id}`, {
      method: 'POST',
      body: JSON.stringify({
        ...productData,
        // productData에 image_url이 이미 있으면 그걸 사용, 없으면 image 사용
        image_url: (productData as any).image_url || image || null,
      }),
      token,
    });
  },

  // 상품 수정 (create와 동일하게 동작)
  update: (id: string, data: Partial<CreateProductRequest>, token: string) => {
    const { image, ...productData } = data;

    return fetchAPI(`/products/management/${id}`, {
      method: 'POST',
      body: JSON.stringify({
        ...productData,
        id,
        // productData에 image_url이 이미 있으면 그걸 사용, 없으면 image 사용
        image_url: (productData as any).image_url || image || null,
      }),
      token,
    });
  },

  // 상품 삭제 (판매자 전용)
  delete: (id: string, token: string) =>
    fetchAPI(`/products/management/${id}`, {
      method: 'DELETE',
      token,
    }),

  // 이미지 업로드 (여러 파일 지원, 최대 5개)
  uploadImages: async (id: string, files: File[], token: string): Promise<{ thumbnail_url: string; image_urls: string[] }> => {
    const formData = new FormData();

    // 여러 파일을 'files' 필드로 추가
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/products/product-image/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Image upload failed');
    }

    return response.json();
  },
};




// Payment API Types
interface PaymentSuccessResponse {
  message: string;
  order_id: string;
  order_number: string;
  payment_key: string;
  payment_status: string;
  total_amount: number;
  approved_at: string | null;
}

// Payment API
export const paymentAPI = {
  /**
   * 토스페이먼츠 결제 승인 및 DB 업데이트
   *
   * @param paymentKey - 토스페이먼츠에서 전달받은 결제 키
   * @param orderId - 주문 번호 (orderId)
   * @param amount - 결제 금액
   * @param token - 인증 토큰
   * @returns 결제 승인 결과
   */
  confirmTossPayment: (
    paymentKey: string,
    orderId: string,
    amount: number,
    token: string
  ): Promise<PaymentSuccessResponse> =>
    fetchAPI('/orders/success', {
      method: 'POST',
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
      token,
    }),
};

// order payments 결제관련 (기존 API - 향후 통합 가능)
export const orderPaymentsAPI = {
  getPayments: (token: string): Promise<{ message: string; products: GetVendorProductRequest[] }> =>
    fetchAPI('/orders/checkout', {
      method: 'GET',
      token,
    }),
};

// Admin API (CRM 관리자용)
export const adminAPI = {
  // 회원 목록 조회
  getUsers: (token: string) =>
    fetchAPI('/admin/users', {
      method: 'GET',
      token,
    }),

  // 문의 목록 조회
  getInquiries: (token: string) =>
    fetchAPI('/inquiries', {
      method: 'GET',
      token,
    }),

  // 판매자 목록 조회 (status: pending, approved, rejected)
  getVendors: (token: string, status?: string) =>
    fetchAPI(`/admin/vendors${status ? `?status=${status}` : ''}`, {
      method: 'GET',
      token,
    }),

  // 매출 통계 조회
  getSalesStatistics: (token: string) =>
    fetchAPI('/analytics/sales/statistics', {
      method: 'GET',
      token,
    }),
};




// Subscription(구독) 관련
export const subscriptionApi = {
  // 구독 플랜 목록 조회
  getPlans: async (isBuyer: boolean = true) => {
    const response = await fetch(`${API_BASE_URL}/subscription/plans?is_buyer=${isBuyer}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('구독 플랜 조회 실패');
    return response.json();
  },

  // 특정 구독 플랜 조회 (ID)
  getPlanById: async (planId: string) => {
    const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('구독 플랜 조회 실패');
    return response.json();
  },

  // 특정 구독 플랜 조회 (slug)
  getPlanBySlug: async (slug: string) => {
    const response = await fetch(`${API_BASE_URL}/subscription/plans/slug/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('구독 플랜 조회 실패');
    return response.json();
  },

  // 현재 사용자의 활성 구독 정보 조회
  getCurrentSubscription: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/subscription/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('현재 구독 정보 조회 실패');
    return response.json();
  },
};




// point 관련
export const pointApi = {
  // 포인트 잔액 조회
  getBalance: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/points/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('포인트 잔액 조회 실패');
    return response.json();
  },

  // 포인트 거래 내역 조회
  getTransactions: async (token: string, page: number = 1, limit: number = 20) => {
    const response = await fetch(
      `${API_BASE_URL}/points/transactions?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error('포인트 내역 조회 실패');
    return response.json();
  },

  // 포인트 적립 (시스템/관리자용)
  earnPoints: async (
    token: string,
    data: {
      user_id: string;
      change_amount: number;
      reason: string;
      order_id?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/points/earn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('포인트 적립 실패');
    return response.json();
  },

  // 포인트 사용 (결제 시)
  usePoints: async (
    token: string,
    data: {
      user_id: string;
      change_amount: number;
      reason?: string;
      order_id?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/points/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('포인트 사용 실패');
    return response.json();
  },

  // 포인트 취소 (주문 취소 시)
  cancelPoints: async (
    token: string,
    data: {
      user_id: string;
      order_id: string;
      reason?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/points/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('포인트 취소 실패');
    return response.json();
  },

  // 포인트 조정 (관리자용)
  adjustPoints: async (
    token: string,
    data: {
      user_id: string;
      change_amount: number;
      reason?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/points/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('포인트 조정 실패');
    return response.json();
  },

  // 포인트 잔액 동기화
  syncBalance: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/points/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('포인트 잔액 동기화 실패');
    return response.json();
  },
};


//찜 목록 관련
export const wishlistAPI = {
  // 찜 목록 조회
  getWishlist: async (token: string) => {
    return fetchAPI('/wishlist', {
      method: 'GET',
      token,
    });
  },

  // 찜 상태 확인
  checkWishlistStatus: async (productId: string, token: string) => {
    return fetchAPI(`/wishlist/check/${productId}`, {
      method: 'GET',
      token,
    });
  },

  // 찜 추가
  addToWishlist: async (productId: string, token: string) => {
    return fetchAPI(`/wishlist/${productId}`, {
      method: 'POST',
      token,
    });
  },

  // 찜 삭제
  removeFromWishlist: async (productId: string, token: string) => {
    return fetchAPI(`/wishlist/${productId}`, {
      method: 'DELETE',
      token,
    });
  },

  // 찜 목록 전체 비우기
  clearWishlist: async (token: string) => {
    return fetchAPI('/wishlist', {
      method: 'DELETE',
      token,
    });
  },
};

// 알림 관련
export const notificationAPI = {
  // 알림 목록 조회
  getNotifications: async (
    token: string,
    params?: {
      type?: 'order' | 'shipment' | 'coupon' | 'event';
      is_read?: boolean;
      limit?: number;
      offset?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_read !== undefined) queryParams.append('is_read', String(params.is_read));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    return fetchAPI(`/api/notifications${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      token,
    });
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async (token: string) => {
    return fetchAPI('/api/notifications/unread-count', {
      method: 'GET',
      token,
    });
  },

  // 알림 상세 조회
  getNotificationById: async (id: string, token: string) => {
    return fetchAPI(`/api/notifications/${id}`, {
      method: 'GET',
      token,
    });
  },

  // 알림 읽음 처리
  markAsRead: async (id: string, token: string) => {
    return fetchAPI(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      token,
    });
  },

  // 전체 알림 읽음 처리
  markAllAsRead: async (token: string) => {
    return fetchAPI('/api/notifications/read-all', {
      method: 'PATCH',
      token,
    });
  },

  // 알림 삭제
  deleteNotification: async (id: string, token: string) => {
    return fetchAPI(`/api/notifications/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

// 쿠폰 관련
export const couponAPI = {
  // 쿠폰 생성 (관리자/판매자)
  createCoupon: async (couponData: any, token: string, autoIssueToAll: boolean = false) => {
    const queryParams = autoIssueToAll ? '?auto_issue_to_all=true' : '';
    return fetchAPI(`/api/coupons${queryParams}`, {
      method: 'POST',
      token,
      body: JSON.stringify(couponData),
    });
  },

  // 쿠폰 목록 조회
  getCoupons: async (
    token: string,
    params?: {
      vendor_id?: string;
      discount_type?: 'percent' | 'fixed';
      is_active?: boolean;
      limit?: number;
      offset?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.vendor_id) queryParams.append('vendor_id', params.vendor_id);
    if (params?.discount_type) queryParams.append('discount_type', params.discount_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    return fetchAPI(`/api/coupons${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      token,
    });
  },

  // 쿠폰 상세 조회 (ID)
  getCouponById: async (couponId: string, token: string) => {
    return fetchAPI(`/api/coupons/${couponId}`, {
      method: 'GET',
      token,
    });
  },

  // 쿠폰 상세 조회 (코드)
  getCouponByCode: async (code: string, token: string) => {
    return fetchAPI(`/api/coupons/code/${code}`, {
      method: 'GET',
      token,
    });
  },

  // 쿠폰 사용 통계 조회
  getCouponStats: async (couponId: string, token: string) => {
    return fetchAPI(`/api/coupons/${couponId}/stats`, {
      method: 'GET',
      token,
    });
  },

  // 쿠폰 수정 (관리자)
  updateCoupon: async (couponId: string, updateData: any, token: string) => {
    return fetchAPI(`/api/coupons/${couponId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(updateData),
    });
  },

  // 쿠폰 삭제 (관리자)
  deleteCoupon: async (couponId: string, token: string) => {
    return fetchAPI(`/api/coupons/${couponId}`, {
      method: 'DELETE',
      token,
    });
  },

  // 쿠폰 발급
  issueCoupon: async (issueData: { coupon_id: string; user_id: string }, token: string) => {
    return fetchAPI('/api/coupons/issue', {
      method: 'POST',
      token,
      body: JSON.stringify(issueData),
    });
  },

  // 내 쿠폰 목록 조회
  getMyCoupons: async (
    token: string,
    params?: {
      is_using?: boolean;
      include_expired?: boolean;
      limit?: number;
      offset?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.is_using !== undefined) queryParams.append('is_using', String(params.is_using));
    if (params?.include_expired !== undefined) queryParams.append('include_expired', String(params.include_expired));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    return fetchAPI(`/api/coupons/user/my-coupons${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      token,
    });
  },

  // 쿠폰 사용
  useCoupon: async (
    useData: { user_coupon_id: string; order_id: string; discount_amount: number },
    token: string
  ) => {
    return fetchAPI('/api/coupons/use', {
      method: 'POST',
      token,
      body: JSON.stringify(useData),
    });
  },

  // 쿠폰 사용 취소
  cancelCouponUse: async (userCouponId: string, token: string) => {
    return fetchAPI(`/api/coupons/cancel/${userCouponId}`, {
      method: 'POST',
      token,
    });
  },
};
