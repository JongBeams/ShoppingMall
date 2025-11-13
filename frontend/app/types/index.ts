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

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
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
