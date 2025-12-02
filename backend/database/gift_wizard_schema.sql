-- 선물 히스토리 테이블
CREATE TABLE IF NOT EXISTS gift_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_relationship VARCHAR(50) NOT NULL,
    occasion VARCHAR(50) NOT NULL,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    price DECIMAL(10, 2) NOT NULL,
    given_date TIMESTAMP WITH TIME ZONE NOT NULL,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기념일 테이블
CREATE TABLE IF NOT EXISTS anniversaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    auto_remind BOOLEAN DEFAULT TRUE,
    remind_days_before INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 선물 추천 로그 테이블 (분석용)
CREATE TABLE IF NOT EXISTS gift_recommendation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    relationship VARCHAR(50) NOT NULL,
    age_range VARCHAR(20) NOT NULL,
    style VARCHAR(50) NOT NULL,
    interests JSONB,
    occasion VARCHAR(50) NOT NULL,
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    special_request TEXT,
    recommended_products JSONB NOT NULL, -- [product_id1, product_id2, product_id3]
    purchased_product_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_gift_history_user_id ON gift_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_history_given_date ON gift_history(given_date DESC);
CREATE INDEX IF NOT EXISTS idx_anniversaries_user_id ON anniversaries(user_id);
CREATE INDEX IF NOT EXISTS idx_anniversaries_date ON anniversaries(date);
CREATE INDEX IF NOT EXISTS idx_gift_recommendation_logs_user_id ON gift_recommendation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_recommendation_logs_created_at ON gift_recommendation_logs(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE gift_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_recommendation_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY gift_history_user_policy ON gift_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY anniversaries_user_policy ON anniversaries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY gift_recommendation_logs_user_policy ON gift_recommendation_logs
    FOR ALL USING (auth.uid() = user_id);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_gift_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_history_updated_at_trigger
    BEFORE UPDATE ON gift_history
    FOR EACH ROW
    EXECUTE FUNCTION update_gift_history_updated_at();

CREATE TRIGGER anniversaries_updated_at_trigger
    BEFORE UPDATE ON anniversaries
    FOR EACH ROW
    EXECUTE FUNCTION update_gift_history_updated_at();
