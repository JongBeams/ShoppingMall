-- 재고 감소 함수 (Row-Level Lock)
CREATE OR REPLACE FUNCTION decrement_stock_with_lock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    remaining_stock INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    -- Row-Level Lock (FOR UPDATE)으로 동시성 제어
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    -- 상품이 존재하지 않음
    IF v_current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, '상품을 찾을 수 없습니다.', 0;
        RETURN;
    END IF;

    -- 재고 부족
    IF v_current_stock < p_quantity THEN
        RETURN QUERY SELECT FALSE, '재고가 부족합니다.', v_current_stock;
        RETURN;
    END IF;

    -- 재고 감소
    UPDATE products
    SET stock = stock - p_quantity,
        sale_count = sale_count + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- 성공 반환
    RETURN QUERY SELECT TRUE, '재고가 차감되었습니다.', v_current_stock - p_quantity;
END;
$$;


-- 재고 복구 함수 (주문 취소 시)
CREATE OR REPLACE FUNCTION restore_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    remaining_stock INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    -- Row-Level Lock
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    -- 상품이 존재하지 않음
    IF v_current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, '상품을 찾을 수 없습니다.', 0;
        RETURN;
    END IF;

    -- 재고 복구
    UPDATE products
    SET stock = stock + p_quantity,
        sale_count = GREATEST(0, sale_count - p_quantity),
        updated_at = NOW()
    WHERE id = p_product_id;

    -- 성공 반환
    RETURN QUERY SELECT TRUE, '재고가 복구되었습니다.', v_current_stock + p_quantity;
END;
$$;

-- 사용 예시:
-- SELECT * FROM decrement_stock_with_lock('product-uuid', 2);
-- SELECT * FROM restore_stock('product-uuid', 2);
