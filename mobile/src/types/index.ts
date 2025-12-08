export interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'buyer' | 'seller' | 'admin';
  phone?: string;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  thumbnail_url?: string;
  vendor_name?: string;
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
  stock: number;
  category?: string;
  tags?: string[];
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
