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

// Cart API (예시)
export const cartAPI = {
  get: (token: string) => fetchAPI('/cart', { token }),
  add: (productId: string, quantity: number, token: string) =>
    fetchAPI('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
      token,
    }),
  remove: (productId: string, token: string) =>
    fetchAPI(`/cart/${productId}`, {
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
    // image 필드를 image_url로 변환
    const { image, ...productData } = data;

    return fetchAPI(`/products/management/${data.id}`, {
      method: 'POST',
      body: JSON.stringify({
        ...productData,
        image_url: image || null, // image는 URL string
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
        image_url: image || null,
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