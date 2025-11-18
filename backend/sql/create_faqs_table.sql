-- FAQ 테이블 생성
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    is_published BOOLEAN DEFAULT TRUE,
    views INTEGER DEFAULT 0,
    author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_faqs_created_at ON faqs(created_at DESC);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_is_published ON faqs(is_published);
CREATE INDEX idx_faqs_author_id ON faqs(author_id);

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_faq_views(faq_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE faqs
    SET views = views + 1
    WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW
EXECUTE FUNCTION update_faqs_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 FAQ를 조회할 수 있음
CREATE POLICY "Anyone can view published faqs"
ON faqs FOR SELECT
USING (is_published = true);

-- 관리자는 모든 FAQ를 조회할 수 있음
CREATE POLICY "Admins can view all faqs"
ON faqs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() AND is_active = true
    )
);

-- 관리자만 FAQ를 생성할 수 있음
CREATE POLICY "Admins can create faqs"
ON faqs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() AND is_active = true
    )
);

-- 관리자만 FAQ를 수정할 수 있음
CREATE POLICY "Admins can update faqs"
ON faqs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() AND is_active = true
    )
);

-- 관리자만 FAQ를 삭제할 수 있음
CREATE POLICY "Admins can delete faqs"
ON faqs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() AND is_active = true
    )
);
