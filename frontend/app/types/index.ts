// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_slug?: string;
  category_name?: string;
  imageUrl?: string;
  thumbnail_url?: string;
  stock?: number;
  stock_quantity?: number;
  createdAt?: string;
}

// Product Creation/Update Request
export interface CreateProductRequest {
  id:string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  sku?: string;
  low_stock_threshold?: number;
  is_active?: boolean;
  is_featured?: boolean;
  image?: string; // 이미지 URL
}

// Vendor Product Response (판매자 상품 목록 조회용)
export interface GetVendorProductRequest {
  id: string;
  name: string;
  category_slug: string;
  description?: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  images?: any;
  thumbnail_url?: string;
  is_active: boolean;
  view_count: number;
  sale_count: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  status?: 'pending' | 'shipping' | 'delivered' | 'cancelled';
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
