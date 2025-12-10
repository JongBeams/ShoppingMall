-- Migration: 009_create_product_reports_table.sql
-- Description: 상품 신고 테이블 생성

-- 상품 신고 테이블
CREATE TABLE IF NOT EXISTS product_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('fake', 'illegal', 'inappropriate', 'fraud', 'defective', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
    admin_note TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_product_reports_product_id ON product_reports(product_id);
CREATE INDEX idx_product_reports_reporter_id ON product_reports(reporter_id);
CREATE INDEX idx_product_reports_status ON product_reports(status);
CREATE INDEX idx_product_reports_created_at ON product_reports(created_at DESC);

-- 테이블 설명
COMMENT ON TABLE product_reports IS '상품 신고 내역';
COMMENT ON COLUMN product_reports.reason IS '신고 사유: fake(위조품), illegal(불법), inappropriate(부적절), fraud(사기), defective(불량), other(기타)';
COMMENT ON COLUMN product_reports.status IS '처리 상태: pending(대기), reviewing(검토중), resolved(해결), rejected(반려)';

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_product_reports_updated_at
BEFORE UPDATE ON product_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
