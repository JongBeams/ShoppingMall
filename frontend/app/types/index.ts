// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt?: string;
}

// Product Creation/Update Request
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  sku?: string;
  low_stock_threshold?: number;
  is_active?: boolean;
  is_featured?: boolean;
  // image?: File;
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
