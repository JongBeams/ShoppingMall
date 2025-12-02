// Product Types
export interface Product {
  id: string;
  name: string;
  meta_description?:string;
  description?: string;
  price: number;
  category?: string;
  category_slug?: string;
  category_name?: string;
  vendor_name?: string;  // 스토어명
  vendor_address?: string;  // 사업장 주소
  imageUrl?: string;
  thumbnail_url?: string;
  images?: string[];  // 추가 이미지 배열
  stock?: number;
  stock_quantity?: number;
  options?: ProductOption[];  // 상품 옵션
  createdAt?: string;
  created_at?: string;
  // 할인 관련 필드
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
}

// Product Option Types
export interface ProductOptionValue {
  id: string;
  value: string;
  price: string;
  stock: string;
}

export interface ProductOption {
  id: string;
  customType: string;
  values: ProductOptionValue[];
}

// Product Creation/Update Request
export interface CreateProductRequest {
  id:string;
  name: string;
  meta_description:string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  sku?: string;
  low_stock_threshold?: number;
  is_active?: boolean;
  image?: string; // 이미지 URL
  tags?: string[]; // 해시태그 배열
  options?: ProductOption[]; // 상품 옵션
}

// Vendor Product Response (판매자 상품 목록 조회용)
export interface GetVendorProductRequest {
  id: string;
  name: string;
  category_slug: string;
  meta_description?: string;
  description?: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  images?: any;
  thumbnail_url?: string;
  tags?: string[];
  options?: ProductOption[];
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
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_thumbnail: string | null;
  quantity: number;
  total_price: number;
  selected_options?: Array<{
    option_id: string;
    option_name: string;
    value_id: string;
    value_name: string;
    price: number;
  }>;
  created_at: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  count: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
  selected_options?: Array<{
    option_id: string;
    value_id: string;
  }>;
}

export interface UpdateCartItemRequest {
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

// Subscription Types
// 구매자용 Features
export interface BuyerFeatures {
  points: {
    amount: number;
    cycle: string;
  };
  shipping: string;
  coupon_tier: string;
  priority_delivery: boolean;
  early_access: boolean;
  cs_level: 'standard' | 'priority';
  event_invites: boolean;
}

// 판매자용 Features
export interface SellerFeatures {
  product_limit: number | string;
  coupon_issue: boolean;
  promo_slots: number | string;
  ads_included: number | string;
  api_access: boolean;
  cs_level: 'standard' | 'priority' | 'dedicated';
}

// 구독 플랜
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  duration_days: number;
  commission_discount: number;
  description: string | null;
  features: BuyerFeatures | SellerFeatures;
  is_active: boolean;
  is_buyer: boolean;
}

// 구독 플랜 목록 응답
export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  count: number;
}
