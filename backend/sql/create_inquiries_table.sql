-- 1:1 문의 테이블 생성
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- '배송', '결제', '제품', '기타'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'answered', 'closed'
    admin_reply TEXT,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 문의만 조회 가능
CREATE POLICY "Users can view own inquiries"
    ON public.inquiries
    FOR SELECT
    USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 문의만 작성 가능
CREATE POLICY "Users can insert own inquiries"
    ON public.inquiries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 정책: 관리자는 모든 문의 조회 가능 (서비스 롤로 처리)
-- 서비스 롤을 사용하므로 별도 정책 불필요

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiries_updated_at();

-- 코멘트 추가
COMMENT ON TABLE public.inquiries IS '1:1 문의 테이블';
COMMENT ON COLUMN public.inquiries.id IS '문의 ID';
COMMENT ON COLUMN public.inquiries.user_id IS '문의 작성자 ID';
COMMENT ON COLUMN public.inquiries.title IS '문의 제목';
COMMENT ON COLUMN public.inquiries.content IS '문의 내용';
COMMENT ON COLUMN public.inquiries.category IS '문의 카테고리 (배송/결제/제품/기타)';
COMMENT ON COLUMN public.inquiries.status IS '문의 상태 (pending/answered/closed)';
COMMENT ON COLUMN public.inquiries.admin_reply IS '관리자 답변';
COMMENT ON COLUMN public.inquiries.admin_id IS '답변한 관리자 ID';
COMMENT ON COLUMN public.inquiries.replied_at IS '답변 일시';
COMMENT ON COLUMN public.inquiries.created_at IS '생성 일시';
COMMENT ON COLUMN public.inquiries.updated_at IS '수정 일시';
