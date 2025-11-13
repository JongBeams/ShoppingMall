-- Multi-Vendor Marketplace Database Schema
-- Supabase + PostgreSQL

-- ============================================
-- 1. USERS & AUTH (extends Supabase auth.users)
-- ============================================

-- User Profiles (extends Supabase auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('buyer', 'seller')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. VENDOR/SELLER MANAGEMENT
-- ============================================

-- Vendor Stores (판매자 스토어)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_number TEXT UNIQUE NOT NULL, -- 사업자등록번호
    business_address TEXT NOT NULL,
    store_name TEXT UNIQUE NOT NULL,
    store_description TEXT,
    store_logo_url TEXT,
    store_banner_url TEXT,

    -- Subscription & Status
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false, -- 관리자 승인 필요
    is_verified BOOLEAN DEFAULT false,

    -- Commission Settings
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- 플랫폼 수수료율 (%)

    -- Stats
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Vendor Subscription Plans (판매자 구독 플랜)
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,

    -- Features
    max_products INTEGER, -- NULL = unlimited
    max_images_per_product INTEGER DEFAULT 10,
    commission_discount DECIMAL(5,2) DEFAULT 0, -- 수수료 할인 (%)
    priority_listing BOOLEAN DEFAULT false,
    analytics_access BOOLEAN DEFAULT false,
    custom_branding BOOLEAN DEFAULT false,

    description TEXT,
    features JSONB, -- Additional features
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES & PRODUCTS
-- ============================================

-- Product Categories (카테고리)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (상품)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),

    -- Product Info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2), -- 정가 (할인 표시용)
    cost_price DECIMAL(10,2), -- 원가

    -- Inventory
    sku TEXT UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,

    -- Media
    images JSONB, -- Array of image URLs
    thumbnail_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- SEO
    meta_title TEXT,
    meta_description TEXT,

    -- Stats
    view_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (상품 옵션: 사이즈, 색상 등)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Red / Large"
    sku TEXT UNIQUE,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB, -- {color: "red", size: "L"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ORDERS & PAYMENTS
-- ============================================

-- Orders (주문)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES profiles(id),

    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,

    -- Shipping
    shipping_address JSONB NOT NULL,
    shipping_method TEXT,
    tracking_number TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'failed', 'refunded'
    )),

    -- Payment
    payment_method TEXT,
    payment_id TEXT, -- External payment gateway ID
    paid_at TIMESTAMPTZ,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items (주문 상품)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),

    -- Product snapshot (주문 시점 정보 저장)
    product_name TEXT NOT NULL,
    variant_name TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    -- Commission (플랫폼 수수료)
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    vendor_payout DECIMAL(10,2) NOT NULL, -- 판매자가 받을 금액

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. REVIEWS & RATINGS
-- ============================================

-- Product Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    order_item_id UUID REFERENCES order_items(id),

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    images JSONB, -- Review images

    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,

    -- Vendor Response
    vendor_response TEXT,
    vendor_responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, order_item_id) -- One review per purchase
);

-- ============================================
-- 6. PLATFORM MANAGEMENT
-- ============================================

-- Platform Commission Records (수수료 기록)
CREATE TABLE commission_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),

    order_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    vendor_payout DECIMAL(10,2) NOT NULL,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Payouts (판매자 정산)
CREATE TABLE vendor_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),

    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    total_sales DECIMAL(15,2) NOT NULL,
    total_commission DECIMAL(15,2) NOT NULL,
    total_payout DECIMAL(15,2) NOT NULL,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payment_method TEXT,
    payment_details JSONB,

    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Settings (플랫폼 설정)
CREATE TABLE platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Vendors
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_subscription_plan ON vendors(subscription_plan);

-- Products
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Orders
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Vendors: Anyone can view active vendors, owners can manage their own
CREATE POLICY "Active vendors are viewable by everyone"
    ON vendors FOR SELECT
    USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own vendor"
    ON vendors FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can update own store"
    ON vendors FOR UPDATE
    USING (user_id = auth.uid());

-- Products: Anyone can view active products, vendors can manage their own
CREATE POLICY "Active products are viewable by everyone"
    ON products FOR SELECT
    USING (is_active = true OR vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
    ));

CREATE POLICY "Vendors can insert own products"
    ON products FOR INSERT
    WITH CHECK (vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
    ));

CREATE POLICY "Vendors can update own products"
    ON products FOR UPDATE
    USING (vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
    ));

-- Orders: Buyers can view their own orders, vendors can view orders containing their products
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (
        buyer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM order_items oi
            JOIN vendors v ON oi.vendor_id = v.id
            WHERE oi.order_id = orders.id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (buyer_id = auth.uid());

-- Reviews: Anyone can view approved reviews, users can create reviews for purchased items
CREATE POLICY "Approved reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Users can create reviews for purchased items"
    ON reviews FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = order_item_id
            AND o.buyer_id = auth.uid()
            AND o.status = 'delivered'
        )
    );

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. INITIAL DATA
-- ============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, duration_days, max_products, commission_discount, description) VALUES
('Free', 0, 30, 50, 0, '무료 플랜 - 기본 판매 기능'),
('Basic', 29000, 30, 200, 2, '베이직 플랜 - 수수료 2% 할인'),
('Premium', 99000, 30, 1000, 5, '프리미엄 플랜 - 수수료 5% 할인, 우선 노출'),
('Enterprise', 299000, 30, NULL, 10, '엔터프라이즈 플랜 - 무제한 상품, 수수료 10% 할인, 커스텀 브랜딩')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('패션/의류', 'fashion', '의류, 신발, 액세서리'),
('뷰티', 'beauty', '화장품, 스킨케어, 향수'),
('식품', 'food', '신선식품, 가공식품, 건강식품'),
('가전/디지털', 'electronics', '가전제품, IT기기, 디지털 액세서리'),
('생활/건강', 'living', '생활용품, 건강용품, 주방용품'),
('출산/유아', 'baby', '유아용품, 출산용품, 완구'),
('스포츠', 'sports', '운동기구, 스포츠웨어, 아웃도어'),
('도서', 'books', '도서, 전자책, 문구')
ON CONFLICT (slug) DO NOTHING;

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('default_commission_rate', '{"rate": 10}', '기본 수수료율 (%)'),
('min_payout_amount', '{"amount": 10000}', '최소 정산 금액 (원)'),
('payout_schedule', '{"frequency": "monthly", "day": 15}', '정산 주기')
ON CONFLICT (key) DO NOTHING;
