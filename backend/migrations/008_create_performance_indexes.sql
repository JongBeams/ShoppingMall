-- Migration: Create performance indexes and optimizations
-- Description: Additional indexes, materialized views, and performance tuning
-- Created: 2025-12-09

-- ====================
-- Composite Indexes for Common Queries
-- ====================

-- User orders lookup (user_id + created_at for pagination)
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Product search with filters (category + active + price)
CREATE INDEX IF NOT EXISTS idx_products_category_active_price ON products(category_id, is_active, price);

-- Vendor product lookup
CREATE INDEX IF NOT EXISTS idx_products_vendor_active ON products(vendor_id, is_active, created_at DESC);

-- Order items by vendor (for vendor dashboard)
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_status ON order_items(vendor_id, status, created_at DESC);

-- Point transaction history
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_created ON point_transactions(user_id, created_at DESC);

-- User coupon availability
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_unused ON user_coupons(user_id, is_used);

-- Review visibility filter
CREATE INDEX IF NOT EXISTS idx_reviews_product_visible ON reviews(product_id, is_visible, created_at DESC);

-- Inquiry management
CREATE INDEX IF NOT EXISTS idx_inquiries_status_priority ON inquiries(status, priority, created_at DESC);

-- Chat message pagination
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- ====================
-- Vector Similarity Search Indexes
-- ====================

-- CLIP image similarity search on products (already created in 003, adding comment)
-- Uses IVFFlat algorithm for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_products_image_embedding ON products
USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON INDEX idx_products_image_embedding IS 'IVFFlat index for CLIP image similarity search';

-- ====================
-- Full-Text Search Indexes (additional)
-- ====================

-- Product description full-text search
CREATE INDEX IF NOT EXISTS idx_products_description_fts ON products
USING gin(to_tsvector('english', description));

-- Review content search
CREATE INDEX IF NOT EXISTS idx_reviews_content_fts ON reviews
USING gin(to_tsvector('english', content));

-- Inquiry search
CREATE INDEX IF NOT EXISTS idx_inquiries_subject_content_fts ON inquiries
USING gin(to_tsvector('english', subject || ' ' || content));

-- ====================
-- Partial Indexes (for commonly filtered data)
-- ====================

-- Active products only
CREATE INDEX IF NOT EXISTS idx_products_active_only ON products(category_id, created_at DESC)
WHERE is_active = TRUE;

-- Featured products
CREATE INDEX IF NOT EXISTS idx_products_featured_only ON products(display_order, rating_avg DESC)
WHERE is_featured = TRUE AND is_active = TRUE;

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC)
WHERE is_read = FALSE;

-- Pending orders
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(created_at DESC)
WHERE status = 'pending';

-- Unpaid orders
CREATE INDEX IF NOT EXISTS idx_orders_unpaid ON orders(user_id, created_at DESC)
WHERE payment_status = 'pending';

-- Unanswered questions
CREATE INDEX IF NOT EXISTS idx_product_questions_unanswered ON product_questions(product_id, created_at DESC)
WHERE is_answered = FALSE AND is_visible = TRUE;

-- Active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, end_date)
WHERE status = 'active';

-- ====================
-- Statistics and Analytics Indexes
-- ====================

-- Sales analytics by date
CREATE INDEX IF NOT EXISTS idx_orders_completed_date ON orders(created_at::date, final_amount)
WHERE status = 'delivered' AND payment_status = 'paid';

-- Vendor sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_completed ON order_items(vendor_id, created_at::date)
WHERE status = 'delivered';

-- Product popularity tracking
CREATE INDEX IF NOT EXISTS idx_products_popularity ON products(sale_count DESC, view_count DESC)
WHERE is_active = TRUE;

-- ====================
-- Materialized Views for Analytics
-- ====================

-- Daily sales summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales AS
SELECT
    created_at::date AS sale_date,
    COUNT(*) AS order_count,
    SUM(final_amount) AS total_revenue,
    SUM(point_used) AS total_points_used,
    SUM(discount_amount) AS total_discounts,
    AVG(final_amount) AS avg_order_value
FROM orders
WHERE status = 'delivered' AND payment_status = 'paid'
GROUP BY created_at::date
ORDER BY sale_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_date ON mv_daily_sales(sale_date);

COMMENT ON MATERIALIZED VIEW mv_daily_sales IS 'Daily sales aggregation for dashboard analytics';

-- Vendor performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vendor_performance AS
SELECT
    v.id AS vendor_id,
    v.store_name,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    COUNT(DISTINCT oi.product_id) AS products_sold,
    SUM(oi.total_price) AS total_revenue,
    AVG(r.rating) AS avg_rating,
    COUNT(r.id) AS review_count
FROM vendors v
LEFT JOIN order_items oi ON v.id = oi.vendor_id AND oi.status = 'delivered'
LEFT JOIN products p ON v.id = p.vendor_id
LEFT JOIN reviews r ON p.id = r.product_id
WHERE v.status = 'approved'
GROUP BY v.id, v.store_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vendor_performance_id ON mv_vendor_performance(vendor_id);

COMMENT ON MATERIALIZED VIEW mv_vendor_performance IS 'Vendor sales and rating aggregation';

-- Product popularity ranking
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_popularity AS
SELECT
    p.id AS product_id,
    p.name,
    p.vendor_id,
    p.category_id,
    p.sale_count,
    p.view_count,
    p.rating_avg,
    p.review_count,
    COUNT(DISTINCT w.user_id) AS wishlist_count,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue,
    (
        p.sale_count * 3 +
        p.view_count * 0.1 +
        p.rating_avg * 20 +
        COUNT(DISTINCT w.user_id) * 2
    ) AS popularity_score
FROM products p
LEFT JOIN wishlists w ON p.id = w.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id AND oi.status = 'delivered'
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.vendor_id, p.category_id, p.sale_count, p.view_count, p.rating_avg, p.review_count;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_popularity_id ON mv_product_popularity(product_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_popularity_score ON mv_product_popularity(popularity_score DESC);

COMMENT ON MATERIALIZED VIEW mv_product_popularity IS 'Product popularity ranking with weighted score';

-- ====================
-- Functions for Refreshing Materialized Views
-- ====================

-- Refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vendor_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_popularity;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_materialized_views IS 'Refresh all materialized views for analytics';

-- ====================
-- Database Maintenance Functions
-- ====================

-- Clean up expired points
CREATE OR REPLACE FUNCTION cleanup_expired_points()
RETURNS void AS $$
BEGIN
    -- Mark expired points as spent
    UPDATE user_points up
    SET balance = balance - COALESCE(
        (
            SELECT SUM(amount)
            FROM point_transactions pt
            WHERE pt.user_id = up.user_id
                AND pt.transaction_type = 'earn'
                AND pt.expires_at < CURRENT_TIMESTAMP
                AND NOT EXISTS (
                    SELECT 1 FROM point_transactions pt2
                    WHERE pt2.reference_id = pt.id
                        AND pt2.transaction_type = 'expire'
                )
        ), 0
    );

    -- Create expiration transactions
    INSERT INTO point_transactions (user_id, amount, transaction_type, balance_after, reason, reference_type)
    SELECT
        pt.user_id,
        -pt.amount AS amount,
        'expire' AS transaction_type,
        up.balance AS balance_after,
        'Points expired' AS reason,
        'point_expiration' AS reference_type
    FROM point_transactions pt
    JOIN user_points up ON pt.user_id = up.user_id
    WHERE pt.transaction_type = 'earn'
        AND pt.expires_at < CURRENT_TIMESTAMP
        AND NOT EXISTS (
            SELECT 1 FROM point_transactions pt2
            WHERE pt2.reference_id = pt.id
                AND pt2.transaction_type = 'expire'
        );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_points IS 'Automatically expire points past their expiration date';

-- Clean up old chat messages (optional, based on retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_messages
    WHERE created_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
        AND is_deleted = FALSE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_chat_messages IS 'Delete chat messages older than retention period';

-- ====================
-- Performance Statistics
-- ====================

-- Analyze all tables to update statistics
ANALYZE profiles;
ANALYZE admin_users;
ANALYZE vendors;
ANALYZE products;
ANALYZE categories;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE point_transactions;
ANALYZE coupons;
ANALYZE user_coupons;
ANALYZE subscriptions;
ANALYZE chat_messages;
ANALYZE documents;
ANALYZE document_chunks;
ANALYZE rag_metrics;
ANALYZE gift_wizard_metrics;
ANALYZE remote_control_metrics;

-- ====================
-- Database Configuration Recommendations
-- ====================

COMMENT ON DATABASE postgres IS 'Shopping mall database with AI/ML features

Recommended PostgreSQL settings:
- shared_buffers = 25% of RAM
- effective_cache_size = 75% of RAM
- work_mem = 50MB (adjust based on concurrent connections)
- maintenance_work_mem = 1GB
- random_page_cost = 1.1 (for SSD)
- effective_io_concurrency = 200
- max_worker_processes = CPU cores
- max_parallel_workers_per_gather = 4
- max_parallel_workers = CPU cores
- wal_buffers = 16MB

For pgvector:
- Consider increasing shared_buffers for vector operations
- ivfflat.probes = 10 (adjust for accuracy vs speed tradeoff)

Maintenance:
- Run VACUUM ANALYZE regularly
- Refresh materialized views daily: SELECT refresh_all_materialized_views();
- Run cleanup_expired_points() daily
- Monitor index usage: pg_stat_user_indexes
';
