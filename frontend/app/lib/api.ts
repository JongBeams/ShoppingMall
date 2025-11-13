// FastAPI 백엔드 연동을 위한 API 유틸리티

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
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `API Error: ${response.status}`);
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
