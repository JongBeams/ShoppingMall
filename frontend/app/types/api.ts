/**
 * API Response Types
 * 모든 API 응답에 대한 TypeScript 타입 정의
 */

// ==================== User & Auth ====================
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  user_type: 'buyer' | 'seller';
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_number: string;
  business_address: string;
  store_name: string;
  store_description?: string;
  store_logo_url?: string;
  store_banner_url?: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
  vendor?: Vendor;
}

export interface RefreshTokenResponse {
  access_token: string;
}

// ==================== Product ====================
export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
  stock: number;
  category?: string;
  tags?: string[];
  thumbnail_url?: string;
  images?: string[];
  rating: number;
  review_count: number;
  sale_count: number;
  is_active: boolean;
  vendor_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductDetailResponse extends Product {
  vendor: Vendor;
  related_products?: Product[];
}

// ==================== Cart ====================
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_price: number;
}

// ==================== Order ====================
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  discount_amount?: number;
  product?: Product;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount?: number;
  point_used?: number;
  final_amount: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  shipping_zipcode?: string;
  shipping_request?: string;
  payment_method?: string;
  payment_key?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}

// ==================== Review ====================
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  content: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  product?: Product;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  average_rating: number;
}

// ==================== Payment ====================
export interface PaymentMethod {
  id: string;
  user_id: string;
  card_company: string;
  card_number: string;
  card_holder: string;
  expiry_date: string;
  is_default: boolean;
  created_at: string;
}

export interface PaymentApproval {
  orderId: string;
  amount: number;
  paymentKey: string;
}

// ==================== Point ====================
export interface Point {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'use' | 'cancel' | 'expire';
  reason: string;
  order_id?: string;
  expires_at?: string;
  created_at: string;
}

export interface PointBalance {
  total_points: number;
  available_points: number;
  expiring_soon: number;
}

// ==================== Notice & FAQ ====================
export interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
}

// ==================== Inquiry ====================
export interface Inquiry {
  id: string;
  user_id: string;
  product_id?: string;
  order_id?: string;
  title: string;
  content: string;
  status: 'pending' | 'answered' | 'closed';
  answer?: string;
  answered_at?: string;
  created_at: string;
  product?: Product;
  user?: User;
}

// ==================== Chat ====================
export interface ChatRoom {
  id: string;
  user_id: string;
  status: 'waiting' | 'active' | 'closed';
  created_at: string;
  closed_at?: string;
  user?: User;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'system';
  created_at: string;
}

// ==================== Gift Wizard ====================
export interface GiftRecommendation {
  products: Product[];
  reasons: string[];
  gift_messages: {
    emotional: string;
    witty: string;
    serious: string;
  };
  precautions: string[];
  packaging_tips: string[];
  delivery_methods: string[];
}

// ==================== Wishlist ====================
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

// ==================== Notification ====================
export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'shipping' | 'review' | 'point' | 'system';
  title: string;
  content: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

// ==================== Analytics ====================
export interface SalesAnalytics {
  total_sales: number;
  total_orders: number;
  total_products: number;
  average_order_value: number;
  sales_by_date: Array<{ date: string; amount: number }>;
  top_products: Product[];
}

// ==================== Common ====================
export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface MessageResponse {
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

// ==================== Image Search ====================
export interface ImageSearchResult {
  products: Product[];
  similarity_scores: number[];
}

// ==================== Subscription ====================
export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  created_at: string;
}
