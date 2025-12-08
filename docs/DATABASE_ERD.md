# 🗄️ 데이터베이스 ERD (Entity Relationship Diagram)

## 전체 ERD 다이어그램

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         E-COMMERCE DATABASE SCHEMA                           │
│                              (34 Tables)                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│    profiles     │ (사용자 기본 정보)
├─────────────────┤
│ id (PK)         │◀─────┐
│ email           │      │
│ full_name       │      │
│ phone           │      │
│ avatar_url      │      │
│ user_type       │      │ (buyer/seller)
│ is_active       │      │
│ created_at      │      │
│ updated_at      │      │
└─────────────────┘      │
        │                │
        │                │
        ├────────────────┼───────────────────────────┐
        │                │                           │
        │                │                           │
┌───────▼──────┐  ┌──────▼──────┐          ┌────────▼────────┐
│   vendors    │  │   orders    │          │  point_trans... │
├──────────────┤  ├─────────────┤          ├─────────────────┤
│ id (PK)      │  │ id (PK)     │          │ id (PK)         │
│ user_id (FK) │  │ buyer_id(FK)│          │ user_id (FK)    │
│ business_name│  │ order_number│          │ order_id (FK)   │
│ store_name   │  │ status      │          │ change_amount   │
│ rating       │  │ total       │          │ balance_after   │
└──────────────┘  │ payment_id  │          │ change_type     │
        │         │ paid_at     │          │ expires_at      │
        │         └─────────────┘          └─────────────────┘
        │                │
        │                │
┌───────▼────────┐       │
│   products     │◀──────┼──────────────────┐
├────────────────┤       │                  │
│ id (PK)        │       │                  │
│ vendor_id (FK) │       │                  │
│ category_id(FK)│       │                  │
│ name           │       │                  │
│ price          │       │                  │
│ stock_quantity │       │                  │
│ rating         │       │                  │
│ tags (JSONB)   │       │                  │
│ image_embed... │◀──┐   │                  │
└────────────────┘   │   │                  │
        │            │   │                  │
        │            │   │                  │
   ┌────┼────┐       │   │                  │
   │    │    │       │   │                  │
┌──▼──┐ │ ┌──▼────┐ │   │         ┌────────▼──────┐
│cart │ │ │review │ │   │         │  order_items  │
│items│ │ │       │ │   │         ├───────────────┤
└─────┘ │ └───────┘ │   │         │ id (PK)       │
        │           │   │         │ order_id (FK) │
┌───────▼─────┐     │   │         │ product_id(FK)│
│  wishlist   │     │   │         │ quantity      │
└─────────────┘     │   │         │ price         │
                    │   │         └───────────────┘
┌───────────────────┘   │
│ CLIP Vector (512D)    │
│ for Image Search      │
└───────────────────────┘

┌──────────────────┐
│ document_chunks  │ (RAG 챗봇용)
├──────────────────┤
│ id (PK)          │
│ content          │
│ embedding        │◀─── BGE-M3 Vector (1024D)
│ metadata (JSONB) │
│ created_at       │
└──────────────────┘

┌──────────────────┐          ┌──────────────────┐
│  chat_rooms      │◀─────────│  chat_messages   │
├──────────────────┤          ├──────────────────┤
│ id (PK)          │          │ id (PK)          │
│ user_id (FK)     │          │ room_id (FK)     │
│ admin_id (FK)    │          │ sender_type      │
│ status           │          │ message          │
│ created_at       │          │ created_at       │
└──────────────────┘          └──────────────────┘

┌──────────────────┐          ┌──────────────────┐
│ subscription_... │◀─────────│ subscription_... │
│ plans            │          │ users            │
├──────────────────┤          ├──────────────────┤
│ id (PK)          │          │ id (PK)          │
│ name             │          │ profile_id (FK)  │
│ price            │          │ plan_id (FK)     │
│ features (JSONB) │          │ is_active        │
└──────────────────┘          └──────────────────┘
```

---

## 테이블 상세 스키마

### 1. 사용자 관련 테이블

#### profiles (사용자 기본 정보)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    avatar_url VARCHAR(500),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('buyer', 'seller')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
```

**샘플 데이터**:
```
id: 550e8400-e29b-41d4-a716-446655440000
email: john.doe@example.com
full_name: 홍길동
phone: 010-1234-5678
user_type: buyer
is_active: true
```

#### vendors (판매자 정보)
```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(100) NOT NULL,
    business_number VARCHAR(20) NOT NULL UNIQUE,
    owner_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    business_address TEXT NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    store_description TEXT,
    store_logo_url VARCHAR(500),
    store_banner_url VARCHAR(500),
    subscription_plan VARCHAR(20) DEFAULT 'free',
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_approval_status ON vendors(approval_status);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);
```

#### admins (관리자)
```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_admins_email ON admins(email);
```

---

### 2. 상품 관련 테이블

#### categories (카테고리)
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);
```

**카테고리 예시**:
```
패션 (parent_id: null)
├─ 의류 (parent_id: 패션_id)
│  ├─ 상의
│  ├─ 하의
│  └─ 아우터
└─ 액세서리 (parent_id: 패션_id)
   ├─ 가방
   ├─ 시계
   └─ 주얼리
```

#### products (상품)
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

    -- 기본 정보
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,

    -- 가격 정보
    price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(12,2) CHECK (compare_at_price >= price),
    cost_price DECIMAL(12,2),
    discount_price DECIMAL(12,2),
    discount_start TIMESTAMP,
    discount_end TIMESTAMP,

    -- 재고 관리
    sku VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,

    -- 이미지 & 메타데이터
    images JSONB,  -- ["url1", "url2", ...]
    thumbnail_url VARCHAR(500),
    tags JSONB,  -- ["미니멀", "캐주얼", ...]

    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),

    -- 상태
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- 통계
    view_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,

    -- AI 임베딩
    image_embedding VECTOR(512),  -- CLIP 벡터 (이미지 검색용)

    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_products_sale_count ON products(sale_count DESC);

-- GIN 인덱스 (JSONB 배열 검색용)
CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- HNSW 인덱스 (벡터 검색용) ⭐ 핵심
CREATE INDEX idx_products_image_embedding ON products
USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**샘플 데이터**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "프리미엄 가죽 토트백",
  "price": 89000,
  "stock_quantity": 45,
  "tags": ["미니멀", "가죽", "토트백", "여성"],
  "rating": 4.8,
  "review_count": 156,
  "image_embedding": [0.023, -0.145, 0.567, ...], // 512개
  "images": [
    "https://cdn.example.com/product1-1.jpg",
    "https://cdn.example.com/product1-2.jpg"
  ]
}
```

#### product_options (상품 옵션)
```sql
CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    custom_type VARCHAR(50) NOT NULL,  -- "색상", "사이즈", "용량" 등
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_product_options_product_id ON product_options(product_id);
```

#### product_option_values (옵션 값)
```sql
CREATE TABLE product_option_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,  -- "빨강", "XL", "500ml" 등
    price DECIMAL(12,2) NOT NULL DEFAULT 0,  -- 추가 가격
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_option_values_option_id ON product_option_values(option_id);
```

**옵션 예시**:
```
Product: 티셔츠
└─ Option 1: 색상
   ├─ 빨강 (+0원, 재고: 20)
   ├─ 파랑 (+0원, 재고: 15)
   └─ 검정 (+0원, 재고: 30)
└─ Option 2: 사이즈
   ├─ S (+0원, 재고: 10)
   ├─ M (+0원, 재고: 25)
   └─ L (+0원, 재고: 18)
```

---

### 3. 주문 & 결제 테이블

#### orders (주문)
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 주문 번호
    order_number VARCHAR(50) UNIQUE NOT NULL,  -- "ORD-20250101-A1B2C3"
    toss_order_id VARCHAR(100),  -- Toss Payments nanoid

    -- 주문 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'shipping', 'delivered', 'confirmed', 'cancelled')),

    -- 금액 정보
    subtotal DECIMAL(12,2) NOT NULL,  -- 상품 금액
    shipping_fee DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,  -- 최종 결제 금액

    -- 배송 정보
    shipping_address JSONB NOT NULL,  -- {recipient_name, phone, postal_code, address, ...}
    notes TEXT,  -- 배송 요청 사항

    -- 결제 정보
    payment_method VARCHAR(20),  -- "card", "bank", "kakao", "toss"
    payment_id VARCHAR(200),  -- Toss paymentKey
    payment_status VARCHAR(20),  -- "completed", "pending", "cancelled"

    -- 타임스탬프
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
```

#### order_items (주문 항목)
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,  -- 주문 시점 이름 (변경 대비)
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

    -- 수량 & 가격
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(12,2) NOT NULL,  -- 주문 시점 가격
    subtotal DECIMAL(12,2) NOT NULL,  -- price * quantity

    -- 수수료 정산
    commission_rate DECIMAL(5,4) DEFAULT 0.1,  -- 10%
    commission_amount DECIMAL(12,2),
    vendor_payout DECIMAL(12,2),  -- 판매자 정산 금액

    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),

    -- 선택된 옵션
    selected_options JSONB,  -- [{option_id, option_name, value_id, value_name, price}, ...]

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_vendor_id ON order_items(vendor_id);
```

**샘플 주문 데이터**:
```json
{
  "order": {
    "id": "order_uuid",
    "order_number": "ORD-20250101-A1B2C3",
    "buyer_id": "user_uuid",
    "status": "paid",
    "total": 124000,
    "shipping_address": {
      "recipient_name": "홍길동",
      "phone": "010-1234-5678",
      "postal_code": "06234",
      "address": "서울시 강남구 테헤란로 123",
      "address_detail": "2층"
    },
    "payment_id": "toss_paymentKey_abc123"
  },
  "items": [
    {
      "product_name": "프리미엄 가죽 토트백",
      "quantity": 1,
      "price": 89000,
      "selected_options": [
        {"option_name": "색상", "value_name": "검정", "price": 0}
      ]
    }
  ]
}
```

---

### 4. 장바구니 & 위시리스트

#### cart_items (장바구니)
```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selected_options JSONB,  -- [{option_id, value_id}, ...]
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 중복 방지 (같은 사용자 + 상품 + 옵션)
    UNIQUE (user_id, product_id, selected_options)
);

-- 인덱스
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

#### wishlist (위시리스트)
```sql
CREATE TABLE wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (user_id, product_id)
);

-- 인덱스
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);
```

---

### 5. 리뷰 테이블

#### reviews (상품 리뷰)
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- 평가
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,

    -- 이미지
    images JSONB,  -- ["review_image1.jpg", ...]

    -- 통계
    helpful_count INTEGER DEFAULT 0,  -- "도움이 돼요" 카운트

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 한 주문당 한 리뷰만
    UNIQUE (user_id, order_id, product_id)
);

-- 인덱스
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

---

### 6. 포인트 & 구독 테이블

#### point_transactions (포인트 거래 내역)
```sql
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

    -- 변동 내역
    change_amount INTEGER NOT NULL,  -- 양수: 적립, 음수: 사용
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),

    -- 분류
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('earn', 'use', 'expire', 'cancel', 'adjust')),
    reason VARCHAR(100),  -- "order_reward", "review", "payment_use", "admin_adjust", ...

    -- 만료
    expires_at TIMESTAMP,  -- 적립 포인트 1년 후 만료

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_point_trans_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_trans_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_trans_expires_at ON point_transactions(expires_at);
```

**포인트 흐름 예시**:
```
1. 주문 완료 (89,000원) → +890P 적립 (1% 적립률)
2. 리뷰 작성 → +100P
3. 사진 리뷰 → +500P 추가
4. 다음 주문 시 1000P 사용 → -1000P
5. 1년 후 미사용 포인트 → 자동 소멸
```

#### subscription_plans (구독 플랜)
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    duration_days INTEGER NOT NULL,  -- 30, 90, 365
    commission_discount DECIMAL(5,4) DEFAULT 0,  -- 수수료 할인율
    description TEXT,
    features JSONB NOT NULL,  -- {free_shipping: true, priority_support: true, ...}
    is_active BOOLEAN DEFAULT true,
    is_buyer BOOLEAN DEFAULT false,  -- true: 구매자용, false: 판매자용
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### subscription_users (사용자 구독)
```sql
CREATE TABLE subscription_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,

    -- 기간
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,

    -- 상태
    is_active BOOLEAN DEFAULT true,

    -- 혜택
    features JSONB,  -- 플랜 혜택 스냅샷

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_subscription_users_profile_id ON subscription_users(profile_id);
CREATE INDEX idx_subscription_users_is_active ON subscription_users(is_active);
```

---

### 7. 결제 수단 관리

#### payment_methods (결제수단)
```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 카드 정보
    card_company VARCHAR(50) NOT NULL,  -- "신한", "삼성", "현대"
    card_number VARCHAR(20) NOT NULL,  -- "1234-****-****-5678" (마스킹)
    card_holder VARCHAR(50) NOT NULL,
    expiry_date VARCHAR(7) NOT NULL,  -- "MM/YY"

    -- 기본 결제수단
    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
```

#### refund_accounts (환불 계좌)
```sql
CREATE TABLE refund_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 계좌 정보
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_holder VARCHAR(50) NOT NULL,

    -- 기본 환불계좌
    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_refund_accounts_user_id ON refund_accounts(user_id);
```

#### addresses (배송지)
```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 배송지 정보
    name VARCHAR(50) NOT NULL,  -- "자택", "회사" 등
    recipient VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    detail_address TEXT,

    -- 기본 배송지
    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

---

### 8. AI/챗봇 테이블

#### document_chunks (RAG 문서)
```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding VECTOR(1024) NOT NULL,  -- BGE-M3 임베딩
    metadata JSONB,  -- {source: "faq.md", page: 1, ...}
    created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW 인덱스 (벡터 검색) ⭐
CREATE INDEX idx_document_chunks_embedding ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

#### chat_rooms (채팅방)
```sql
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    admin_name VARCHAR(100),

    -- 상태
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed')),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX idx_chat_rooms_status ON chat_rooms(status);
```

#### chat_messages (채팅 메시지)
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id UUID,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

---

### 9. 선물 추천 테이블

#### gift_history (선물 이력)
```sql
CREATE TABLE gift_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 받는 사람 정보
    recipient_relationship VARCHAR(50) NOT NULL,  -- "연인_남", "부모", ...
    occasion VARCHAR(50),  -- "생일", "기념일", ...

    -- 선물한 상품
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,
    product_image VARCHAR(500),
    price DECIMAL(12,2) NOT NULL,

    -- 선물 날짜
    given_date TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_gift_history_user_id ON gift_history(user_id);
CREATE INDEX idx_gift_history_given_date ON gift_history(given_date DESC);
```

#### anniversaries (기념일)
```sql
CREATE TABLE anniversaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 기념일 정보
    name VARCHAR(100) NOT NULL,  -- "엄마 생신", "결혼기념일", ...
    date DATE NOT NULL,

    -- 알림 설정
    auto_remind BOOLEAN DEFAULT true,
    remind_days_before INTEGER DEFAULT 30,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_anniversaries_user_id ON anniversaries(user_id);
CREATE INDEX idx_anniversaries_date ON anniversaries(date);
```

---

### 10. 알림 & CRM

#### notifications (알림)
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 알림 내용
    type VARCHAR(20) NOT NULL,  -- "order", "shipment", "coupon", "event"
    resource_id UUID,  -- 관련 리소스 ID (주문, 쿠폰 등)
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(500),
    body TEXT NOT NULL,

    -- 상태
    is_read BOOLEAN DEFAULT false,

    -- 만료
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

#### crm_system_settings (CRM 시스템 설정)
```sql
CREATE TABLE crm_system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 포인트 설정
    point_enabled BOOLEAN DEFAULT true,
    point_rate DECIMAL(5,4) DEFAULT 0.01,  -- 1% 적립
    signup_point INTEGER DEFAULT 1000,

    -- 배송비 설정
    delivery_fee INTEGER DEFAULT 3000,
    free_delivery_threshold INTEGER DEFAULT 30000,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 데이터베이스 관계 요약

### 핵심 관계

```
profiles (사용자)
├─ 1:1 → vendors (판매자 정보)
├─ 1:N → orders (주문)
├─ 1:N → point_transactions (포인트)
├─ 1:N → cart_items (장바구니)
├─ 1:N → wishlist (위시리스트)
├─ 1:N → reviews (리뷰)
└─ 1:N → subscription_users (구독)

products (상품)
├─ N:1 → vendors (판매자)
├─ N:1 → categories (카테고리)
├─ 1:N → product_options (옵션)
├─ 1:N → cart_items (장바구니)
├─ 1:N → wishlist (위시리스트)
├─ 1:N → reviews (리뷰)
└─ 1:N → order_items (주문 항목)

orders (주문)
├─ N:1 → profiles (구매자)
├─ 1:N → order_items (주문 항목)
└─ 1:N → point_transactions (포인트)

order_items (주문 항목)
├─ N:1 → orders (주문)
├─ N:1 → products (상품)
└─ N:1 → vendors (판매자)
```

---

## 성능 최적화

### 1. 인덱스 전략
- **B-tree 인덱스**: 일반 조회 (id, email, created_at 등)
- **GIN 인덱스**: JSONB 배열 검색 (tags, images 등)
- **HNSW 인덱스**: 벡터 유사도 검색 (image_embedding, text_embedding)

### 2. 파티셔닝
```sql
-- 주문 테이블 월별 파티셔닝 (대용량 데이터 처리)
CREATE TABLE orders_2025_01 PARTITION OF orders
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE orders_2025_02 PARTITION OF orders
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

### 3. 캐싱 전략
- **Redis 캐싱**: 카테고리, 시스템 설정 (TTL: 1시간)
- **Application Cache**: 상품 목록 (5분)
- **CDN**: 이미지 (무한대)

---

## 데이터 무결성

### 1. 외래 키 제약
- `ON DELETE CASCADE`: 사용자 삭제 시 관련 데이터 모두 삭제
- `ON DELETE RESTRICT`: 참조되는 상품/카테고리 삭제 방지
- `ON DELETE SET NULL`: 관리자 삭제 시 채팅방은 유지

### 2. CHECK 제약
- `rating >= 0 AND rating <= 5`: 평점 범위
- `stock_quantity >= 0`: 재고 음수 방지
- `price >= 0`: 가격 음수 방지

### 3. UNIQUE 제약
- `(user_id, product_id)`: 위시리스트 중복 방지
- `(user_id, order_id, product_id)`: 리뷰 중복 방지

---

## 총 테이블 수: 34개

**카테고리별 분류**:
- 사용자: 3개 (profiles, vendors, admins)
- 상품: 4개 (categories, products, product_options, product_option_values)
- 주문: 2개 (orders, order_items)
- 장바구니: 2개 (cart_items, wishlist)
- 리뷰: 1개 (reviews)
- 포인트: 1개 (point_transactions)
- 구독: 2개 (subscription_plans, subscription_users)
- 결제수단: 3개 (payment_methods, refund_accounts, addresses)
- AI: 2개 (document_chunks, chat_rooms + chat_messages)
- 선물: 2개 (gift_history, anniversaries)
- 알림: 2개 (notifications, crm_system_settings)

**총 데이터 크기 예상** (10만 사용자 기준):
- 사용자: ~100MB
- 상품: ~500MB
- 주문: ~2GB (1년치)
- 리뷰: ~300MB
- 벡터 임베딩: ~1GB (products 10만개 × 512D × 4bytes)
- **합계: 약 4GB** (인덱스 제외)
