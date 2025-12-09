# Database Migrations

이 디렉토리는 쇼핑몰 애플리케이션의 PostgreSQL 데이터베이스 마이그레이션 파일을 포함합니다.

## 마이그레이션 파일 목록

| 파일명 | 설명 | 주요 내용 |
|--------|------|-----------|
| `001_init_extensions.sql` | PostgreSQL 확장 프로그램 초기화 | uuid-ossp, pgvector, citext |
| `002_create_user_tables.sql` | 사용자 관련 테이블 | profiles, admin_users, vendors, commissions, payouts |
| `003_create_product_tables.sql` | 상품 카탈로그 테이블 | products, categories, variants, options, wishlists |
| `004_create_order_payment_tables.sql` | 주문 및 결제 테이블 | orders, order_items, carts, payments, refunds, shipping |
| `005_create_points_coupons_subscriptions.sql` | 포인트/쿠폰/구독 테이블 | point_transactions, coupons, subscriptions |
| `006_create_chat_review_inquiry_tables.sql` | 고객 소통 테이블 | reviews, Q&A, inquiries, chat_messages |
| `007_create_ai_ml_tables.sql` | AI/ML 기능 테이블 | documents (RAG), embeddings, metrics |
| `008_create_performance_indexes.sql` | 성능 최적화 | indexes, materialized views, maintenance functions |

## 마이그레이션 실행 방법

### Supabase 사용 시

1. **Supabase Dashboard에서 실행**:
   - Supabase 프로젝트의 SQL Editor로 이동
   - 파일을 순서대로 복사하여 실행

2. **Supabase CLI 사용**:
   ```bash
   # Supabase 초기화 (처음 한 번만)
   supabase init

   # 마이그레이션 파일 복사
   cp backend/migrations/*.sql supabase/migrations/

   # 로컬에서 테스트
   supabase db reset

   # 프로덕션에 적용
   supabase db push
   ```

### psql 명령어로 직접 실행

```bash
# 환경 변수 설정
export DB_HOST="your-db-host"
export DB_PORT="5432"
export DB_NAME="your-db-name"
export DB_USER="your-db-user"
export DB_PASSWORD="your-db-password"

# 마이그레이션 실행 (순서대로)
for file in backend/migrations/*.sql; do
    echo "Running migration: $file"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file"
done
```

### Python 스크립트로 실행

```bash
# 마이그레이션 실행 스크립트
python backend/scripts/run_migrations.py
```

## 데이터베이스 구조

### 핵심 테이블 (36개)

#### 사용자 관리 (User Management)
- `profiles`: 사용자 프로필
- `admin_users`: 관리자 계정
- `vendors`: 판매자 정보
- `vendor_commissions`: 수수료 추적
- `vendor_payouts`: 정산 관리

#### 상품 관리 (Product Catalog)
- `categories`: 카테고리 (계층 구조)
- `products`: 상품 정보 + CLIP 이미지 임베딩 (512차원)
- `product_images`: 상품 이미지
- `product_options`: 상품 옵션 (색상, 사이즈 등)
- `product_variants`: SKU별 재고 관리
- `product_tags`: 태그
- `wishlists`: 찜 목록
- `recently_viewed`: 최근 본 상품

#### 주문 및 결제 (Orders & Payments)
- `orders`: 주문 정보
- `order_items`: 주문 아이템
- `carts`: 장바구니
- `payment_methods`: 저장된 결제 수단
- `refund_accounts`: 환불 계좌
- `refunds`: 환불 요청
- `shipping_addresses`: 배송지 정보

#### 포인트/쿠폰/구독 (Loyalty & Subscriptions)
- `user_points`: 포인트 잔액
- `point_transactions`: 포인트 거래 내역
- `coupons`: 쿠폰 정의
- `user_coupons`: 사용자별 쿠폰
- `subscription_plans`: 구독 플랜
- `subscriptions`: 사용자 구독
- `subscription_payments`: 구독 결제

#### 고객 소통 (Customer Engagement)
- `reviews`: 상품 리뷰
- `review_images`: 리뷰 이미지
- `review_reactions`: 리뷰 반응 (도움됨/안됨)
- `product_questions`: 상품 문의
- `product_answers`: 상품 문의 답변
- `inquiries`: 1:1 문의
- `inquiry_replies`: 문의 답변
- `chat_messages`: 실시간 채팅 메시지 (WebSocket)
- `chat_rooms`: 채팅방
- `chat_participants`: 채팅 참여자

#### AI/ML 기능 (AI Features)
- `documents`: RAG 문서 소스
- `document_chunks`: 문서 청크 + 벡터 임베딩 (1024차원)
- `rag_metrics`: RAG 시스템 사용 메트릭
- `gift_wizard_metrics`: AI 선물 추천 메트릭
- `remote_control_metrics`: WebRTC 원격 쇼핑 메트릭
- `ai_search_logs`: CLIP 이미지 검색 로그
- `notifications`: 알림

## 주요 기능

### 1. pgvector를 활용한 벡터 검색

#### CLIP 이미지 유사도 검색
```sql
-- 이미지 기반 상품 검색 (코사인 유사도)
SELECT p.id, p.name,
       1 - (p.image_embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM products p
WHERE p.is_active = TRUE
ORDER BY p.image_embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

#### RAG 문서 검색
```sql
-- 의미 기반 문서 검색
SELECT dc.document_id, dc.chunk_text,
       1 - (dc.embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM document_chunks dc
ORDER BY dc.embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

### 2. 전체 텍스트 검색 (Full-Text Search)

```sql
-- 상품명 + 설명 검색
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description)
      @@ to_tsquery('english', 'smartphone & android');
```

### 3. Materialized Views (실시간 분석)

```sql
-- 일일 매출 조회
SELECT * FROM mv_daily_sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY sale_date DESC;

-- 판매자 성과 조회
SELECT * FROM mv_vendor_performance
ORDER BY total_revenue DESC;

-- 인기 상품 순위
SELECT * FROM mv_product_popularity
ORDER BY popularity_score DESC
LIMIT 20;
```

### 4. 유지보수 함수

```sql
-- Materialized View 갱신 (매일 실행 권장)
SELECT refresh_all_materialized_views();

-- 만료된 포인트 정리 (매일 실행 권장)
SELECT cleanup_expired_points();

-- 오래된 채팅 메시지 삭제 (선택적, 90일 기준)
SELECT cleanup_old_chat_messages(90);
```

## 성능 최적화

### 인덱스 전략

1. **기본 인덱스**: 모든 외래 키, 상태 컬럼
2. **복합 인덱스**: 자주 함께 쿼리되는 컬럼
3. **부분 인덱스**: 필터링된 데이터 (활성 상품, 미결제 주문 등)
4. **벡터 인덱스**: IVFFlat 알고리즘 (lists=100)
5. **전체 텍스트 인덱스**: GIN 인덱스

### PostgreSQL 설정 권장사항

```ini
# postgresql.conf
shared_buffers = 4GB              # RAM의 25%
effective_cache_size = 12GB       # RAM의 75%
work_mem = 50MB
maintenance_work_mem = 1GB
random_page_cost = 1.1            # SSD 사용 시
effective_io_concurrency = 200
max_worker_processes = 8          # CPU 코어 수
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
wal_buffers = 16MB

# pgvector 설정
ivfflat.probes = 10               # 정확도 vs 속도 조정
```

## 보안 고려사항

1. **Row Level Security (RLS)**: Supabase 사용 시 RLS 정책 추가 권장
2. **민감 정보 암호화**:
   - 결제 정보는 토큰화
   - 비밀번호는 bcrypt/argon2로 해싱
3. **접근 제어**:
   - 애플리케이션 전용 DB 사용자 생성
   - 최소 권한 원칙 적용

```sql
-- 애플리케이션 DB 사용자 생성 예시
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE your_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

## 모니터링

### 주요 메트릭 확인

```sql
-- 테이블 크기 확인
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률 확인
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 슬로우 쿼리 확인 (pg_stat_statements 필요)
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🛠️ 문제 해결

### 마이그레이션 실패 시

1. **확장 프로그램 설치 권한 부족**:
   ```sql
   -- superuser 권한으로 실행
   CREATE EXTENSION vector;
   ```

2. **외래 키 제약 조건 위반**:
   - 마이그레이션 순서 확인 (001 → 008)
   - 기존 데이터와 충돌 확인

3. **벡터 인덱스 생성 실패**:
   ```sql
   -- 데이터 없이 인덱스 생성 시도
   CREATE INDEX CONCURRENTLY ...;
   ```

### 롤백 방법

```sql
-- 특정 테이블 삭제 (역순으로)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ai_search_logs CASCADE;
-- ... (역순으로 계속)

-- 확장 프로그램 제거
DROP EXTENSION IF EXISTS vector CASCADE;
DROP EXTENSION IF EXISTS citext CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
```

##  참고 자료

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Supabase 문서](https://supabase.com/docs)
- [CLIP 모델](https://github.com/openai/CLIP)
- [ERD 다이어그램](../docs/database-erd.dbml)

## 팁

1. **개발 환경에서 테스트**: 프로덕션 적용 전 로컬/스테이징에서 먼저 테스트
2. **백업 필수**: 마이그레이션 전 반드시 데이터베이스 백업
3. **점진적 적용**: 대용량 데이터가 있는 경우 인덱스는 `CONCURRENTLY` 옵션 사용
4. **정기 유지보수**: Materialized View 갱신, VACUUM ANALYZE 주기적 실행

```bash
# 크론잡 예시 (매일 새벽 3시)
0 3 * * * psql -d your_db -c "SELECT refresh_all_materialized_views();"
0 3 * * * psql -d your_db -c "SELECT cleanup_expired_points();"
0 3 * * * psql -d your_db -c "VACUUM ANALYZE;"
```
