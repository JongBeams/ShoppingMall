// FastAPI 백엔드 연동을 위한 API 유틸리티

import { CreateProductRequest, GetVendorProductRequest } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string;
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

    // 토큰 만료 또는 유효하지 않음 (401) - 자동 로그아웃
    if (response.status === 401) {
      // 일반 사용자 로그아웃
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('vendor');

      // 관리자 로그아웃
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');

      // CRM 페이지인지 확인
      if (window.location.pathname.startsWith('/crm')) {
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
      // 에러 메시지만 던지고 각 컴포넌트에서 처리하도록 함
      throw new Error(error.detail || '접근 권한이 없습니다.');
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



