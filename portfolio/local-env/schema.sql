-- ============================================================
-- ShoppingMall 로컬 재현용 스키마 (PostgreSQL 17 + PostgREST)
--
-- 원래 서비스는 Supabase(PostgreSQL + pgvector)를 썼습니다.
-- 로컬 Postgres 에는 pgvector 확장이 없어서 임베딩을 float8[] 로 저장하고,
-- 앱이 호출하는 RPC(search_documents_by_embedding, match_products_by_image)를
-- 같은 이름·같은 인자로 SQL 함수로 만들었습니다. (정규화 벡터 → 코사인 = 내적)
-- 컬럼은 backend/app 코드가 실제로 읽고 쓰는 이름을 기준으로 맞췄습니다.
-- ============================================================

create schema if not exists auth;

-- Supabase Auth(GoTrue) 대체용 계정 테이블 (gateway.py 가 사용)
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  encrypted_password text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 사용자 · 관리자 · 판매자
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  name text,
  phone text,
  avatar_url text,
  user_type text default 'buyer',
  address text,
  postal_code text,
  birth_date date,
  gender text,
  point_balance numeric default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  role text default 'admin',
  permissions jsonb default '[]',
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  business_name text,
  business_number text,
  business_address text,
  owner_name text,
  ceo_name text,
  phone text,
  email text,
  category text,
  store_name text,
  store_description text,
  store_logo_url text,
  store_banner_url text,
  subscription_plan text default 'basic',
  approval_status text default 'approved',
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  status text default 'approved',
  commission_rate numeric default 10.0,
  bank_name text,
  account_number text,
  account_holder text,
  is_active boolean default true,
  is_verified boolean default true,
  rating numeric default 0,
  review_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  approval_status text default 'approved',
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 상품
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id),
  description text,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  category_id uuid references categories(id),
  name text not null,
  slug text,
  description text,
  meta_title text,
  meta_description text,
  price numeric not null,
  discount_price numeric,
  discount_start timestamptz,
  discount_end timestamptz,
  stock int default 0,
  stock_quantity int default 0,
  low_stock_threshold int default 5,
  thumbnail_url text,
  images text[],
  tags text[],
  category text,                      -- personalized_recommendation.py 가 조회
  brand text,
  rating numeric default 0,
  review_count int default 0,
  sale_count int default 0,
  view_count int default 0,
  review_summary text,
  review_summary_updated_at timestamptz,
  is_active boolean default true,
  is_featured boolean default false,
  image_embedding float8[],           -- CLIP ViT-B/32, 512차원 (원본: vector(512))
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text,
  custom_type text,
  created_at timestamptz default now()
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid references product_options(id) on delete cascade,
  num int,
  value text,
  price numeric default 0,
  price_adjustment numeric default 0,
  stock int default 0,
  created_at timestamptz default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  sku text,
  option_values jsonb,
  price numeric,
  stock int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table product_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  reporter_id uuid,
  reason text,
  description text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 주문 · 결제
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id),
  order_number text,
  status text default 'pending',
  subtotal numeric default 0,
  discount numeric default 0,
  tax numeric default 0,
  shipping_fee numeric default 0,
  total numeric default 0,
  total_amount numeric,
  discount_amount numeric,
  point_used numeric,
  points_used numeric default 0,
  delivery_fee numeric,
  final_amount numeric,
  payment_method text,
  payment_id text,
  payment_key text,
  payment_status text,
  toss_order_id text,
  recipient_name text,
  recipient_phone text,
  shipping_address text,
  address text,
  address_detail text,
  postal_code text,
  delivery_address text,
  delivery_postal_code text,
  delivery_memo text,
  notes text,
  paid_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  vendor_id uuid references vendors(id),
  variant_id uuid,
  product_name text,
  quantity int default 1,
  price numeric default 0,
  discount_price numeric,
  subtotal numeric default 0,
  total_price numeric,
  selected_options jsonb,
  status text default 'pending',
  tracking_number text,
  created_at timestamptz default now()
);

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type text,
  card_number text,
  card_company text,
  card_holder text,
  expiry_date text,
  bank_name text,
  account_number text,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table refund_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  bank_name text,
  account_number text,
  account_holder text,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text,
  recipient text,
  phone text,
  postal_code text,
  address text,
  detail_address text,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 포인트 · 쿠폰 · 구독
-- ------------------------------------------------------------
create table point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  order_id uuid,
  change_amount numeric default 0,
  change_type text,
  balance_after numeric default 0,
  reason text,
  amount numeric,
  type text,
  description text,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid,
  name text,
  code text,
  discount_type text,
  discount_value numeric,
  max_discount_amount numeric,
  min_order_amount numeric,
  validity_days int,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  coupon_id uuid references coupons(id),
  order_id uuid,
  vendor_id uuid,
  name text,
  code text,
  discount_type text,
  discount_value numeric,
  discount_amount numeric,
  max_discount_amount numeric,
  min_order_amount numeric,
  validity_days int,
  start_at timestamptz,
  end_at timestamptz,
  is_using boolean default false,
  issued_at timestamptz default now(),
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text,
  slug text,
  description text,
  price numeric default 0,
  duration_days int default 30,
  benefits jsonb,
  features jsonb,
  is_buyer boolean default true,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table subscription_users (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  subscription_plan_id uuid references subscription_plans(id),
  started_at timestamptz,
  ended_at timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  status text default 'active',
  is_active boolean default true,
  auto_renew boolean default true,
  features jsonb,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 장바구니 · 찜 · 리뷰 · 알림
-- ------------------------------------------------------------
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product_id uuid references products(id),
  quantity int default 1,
  selected_options jsonb,
  selected_options_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product_id uuid references products(id),
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  product_id uuid references products(id),
  vendor_id uuid,
  order_id uuid,
  order_item_id uuid,
  rating int,
  content text,
  images text[],
  is_verified boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text,
  title text,
  body text,
  content text,
  summary text,
  link_url text,
  resource_id text,
  is_read boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 고객센터 · 채팅
-- ------------------------------------------------------------
create table notices (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references admin_users(id),
  title text not null,
  content text not null,
  is_important boolean default false,
  is_pinned boolean default false,
  views int default 0,
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references admin_users(id),
  category text,
  question text not null,
  answer text not null,
  is_published boolean default true,
  sort_order int default 0,
  views int default 0,
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  category text,
  status text default 'pending',
  admin_id uuid,
  admin_reply text,
  answer text,
  replied_at timestamptz,
  answered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chat_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_name text,
  status text default 'waiting',
  admin_id text,
  admin_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references chat_rooms(id) on delete cascade,
  sender_type text,
  sender_id text,
  sender_name text,
  message text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- AI / RAG
-- ------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text,
  title text,
  content text,
  file_url text,
  file_size bigint,
  file_path text,
  chunk_count int default 0,
  status text default 'processing',
  uploaded_at timestamptz default now(),
  created_at timestamptz default now()
);

create table document_chunks (
  id bigserial primary key,
  document_id uuid references documents(id) on delete cascade,
  chunk_index int,
  content text not null,
  embedding float8[],                 -- BAAI/bge-m3, 1024차원 (원본: vector(1024))
  created_at timestamptz default now()
);

create table rag_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  query text,
  documents_found int,
  response_time_ms int,
  llm_tokens_used int,
  clicked_product text,
  user_rating int,
  "timestamp" timestamptz default now(),
  created_at timestamptz default now()
);

create table gift_wizard_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  completed boolean,
  recommendations_count int,
  clicked_recommendation text,
  purchased boolean,
  satisfaction int,
  conversation_data jsonb,
  recommendations jsonb,
  "timestamp" timestamptz default now(),
  created_at timestamptz default now()
);

create table gift_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  recipient_relationship text,
  occasion text,
  product_id uuid,
  product_name text,
  product_image text,
  price numeric,
  given_date date,
  created_at timestamptz default now()
);

create table anniversaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  date date,
  remind_days_before int default 30,
  auto_remind boolean default true,
  created_at timestamptz default now()
);

create table gift_recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  relationship text,
  age_range text,
  style text,
  interests jsonb,
  occasion text,
  budget_min numeric,
  budget_max numeric,
  special_request text,
  recommended_products jsonb,
  created_at timestamptz default now()
);

create table remote_control_metrics (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  room_id uuid,
  user_id text,
  admin_id text,
  duration_seconds int,
  events_count int,
  success boolean,
  user_satisfaction int,
  "timestamp" timestamptz default now(),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 통계 · 설정
-- ------------------------------------------------------------
create table daily_statistics (
  id uuid primary key default gen_random_uuid(),
  date date,
  order_count int default 0,
  total_revenue numeric default 0,
  created_at timestamptz default now()
);

create table commission_records (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid,
  vendor_id uuid,
  order_amount numeric,
  commission_rate numeric,
  commission_amount numeric,
  vendor_payout numeric,
  status text default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid,
  period_start timestamptz,
  period_end timestamptz,
  total_sales numeric,
  commission_amount numeric,
  payout_amount numeric,
  status text default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table crm_system_settings (
  id serial primary key,
  admin_email text,
  admin_phone text,
  business_number text,
  business_name text,
  ceo_name text,
  business_address text,
  order_cancel_time int default 24,
  order_confirm_time int default 7,
  delivery_completion_time int default 3,
  payment_card boolean default true,
  payment_transfer boolean default true,
  payment_virtual_account boolean default true,
  payment_phone boolean default false,
  delivery_fee int default 3000,
  free_delivery_threshold int default 30000,
  point_enabled boolean default true,
  point_rate numeric default 1.0,
  signup_point int default 5000,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table platform_settings (
  key text primary key,
  value jsonb,
  description text,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 벡터 검색 RPC (Supabase 에서 쓰던 이름·인자 그대로)
-- ------------------------------------------------------------
create or replace function cosine_similarity(a float8[], b float8[])
returns float8 language sql immutable parallel safe as $$
  select sum(x * y) / nullif(sqrt(sum(x * x)) * sqrt(sum(y * y)), 0)
  from unnest(a, b) as t(x, y)
$$;

-- RAG: 질문 임베딩(bge-m3) ↔ 문서 청크 임베딩
create or replace function search_documents_by_embedding(
  query_embedding float8[],
  match_threshold float8 default 0.5,
  match_count int default 3
)
returns table (id bigint, document_id uuid, chunk_index int, content text, similarity float8)
language sql stable as $$
  select c.id, c.document_id, c.chunk_index, c.content,
         cosine_similarity(c.embedding, query_embedding) as similarity
  from document_chunks c
  where c.embedding is not null
    and cosine_similarity(c.embedding, query_embedding) > match_threshold
  order by similarity desc
  limit match_count
$$;

-- Vision: 업로드 이미지 임베딩(CLIP) ↔ 상품 이미지 임베딩
create or replace function match_products_by_image(
  query_embedding float8[],
  match_threshold float8 default 0.3,
  match_count int default 20
)
returns table (
  id uuid, name text, description text, price numeric, thumbnail_url text,
  category_id uuid, vendor_id uuid, rating numeric, review_count int,
  stock_quantity int, similarity float8
)
language sql stable as $$
  select p.id, p.name, p.description, p.price, p.thumbnail_url,
         p.category_id, p.vendor_id, p.rating, p.review_count, p.stock_quantity,
         cosine_similarity(p.image_embedding, query_embedding) as similarity
  from products p
  where p.is_active and p.image_embedding is not null
    and cosine_similarity(p.image_embedding, query_embedding) > match_threshold
  order by similarity desc
  limit match_count
$$;

create or replace function increment_faq_views(faq_id uuid)
returns void language sql as $$
  update faqs set views = coalesce(views, 0) + 1, view_count = coalesce(view_count, 0) + 1 where id = faq_id
$$;

create or replace function increment_notice_views(notice_id uuid)
returns void language sql as $$
  update notices set views = coalesce(views, 0) + 1, view_count = coalesce(view_count, 0) + 1 where id = notice_id
$$;

-- ------------------------------------------------------------
-- PostgREST 역할 권한 (로컬 전용: RLS 없음)
-- ------------------------------------------------------------
grant usage on schema public to shop_anon, shop_authenticated, shop_service;
grant all on all tables in schema public to shop_anon, shop_authenticated, shop_service;
grant all on all sequences in schema public to shop_anon, shop_authenticated, shop_service;
grant execute on all functions in schema public to shop_anon, shop_authenticated, shop_service;
