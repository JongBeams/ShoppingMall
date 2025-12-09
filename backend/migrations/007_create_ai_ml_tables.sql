-- Migration: Create AI/ML tables
-- Description: RAG document system, CLIP metrics, AI features with pgvector
-- Created: 2025-12-09

-- Documents (for RAG system)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('product_manual', 'faq', 'policy', 'guide', 'other')),
    source_url TEXT,
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_is_active ON documents(is_active);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_title ON documents USING gin(to_tsvector('english', title));
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('english', content));

COMMENT ON TABLE documents IS 'Source documents for RAG (Retrieval-Augmented Generation)';
COMMENT ON COLUMN documents.metadata IS 'Additional document metadata as JSON';

-- Document Chunks (for RAG vector search)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1024),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_chunk_index ON document_chunks(chunk_index);

COMMENT ON TABLE document_chunks IS 'Text chunks with vector embeddings for semantic search';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding (1024 dimensions) for semantic similarity search';
COMMENT ON COLUMN document_chunks.chunk_index IS 'Position of chunk within parent document';

-- Vector similarity search index for document chunks
CREATE INDEX idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON INDEX idx_document_chunks_embedding IS 'IVFFlat index for fast vector similarity search';

-- RAG Metrics (usage analytics)
CREATE TABLE IF NOT EXISTS rag_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    response TEXT,
    chunks_retrieved INTEGER,
    retrieval_time_ms INTEGER,
    generation_time_ms INTEGER,
    total_time_ms INTEGER,
    model_name VARCHAR(100),
    temperature DECIMAL(3, 2),
    top_k INTEGER,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    feedback_comment TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rag_metrics_user_id ON rag_metrics(user_id);
CREATE INDEX idx_rag_metrics_session_id ON rag_metrics(session_id);
CREATE INDEX idx_rag_metrics_created_at ON rag_metrics(created_at DESC);
CREATE INDEX idx_rag_metrics_feedback_score ON rag_metrics(feedback_score);

COMMENT ON TABLE rag_metrics IS 'RAG system performance and usage metrics';
COMMENT ON COLUMN rag_metrics.chunks_retrieved IS 'Number of document chunks retrieved';
COMMENT ON COLUMN rag_metrics.feedback_score IS 'User rating of response quality (1-5)';

-- Gift Wizard Metrics (AI recommendation system)
CREATE TABLE IF NOT EXISTS gift_wizard_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient_age INTEGER,
    recipient_gender VARCHAR(20),
    recipient_interests TEXT[],
    occasion VARCHAR(100),
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    recommended_products JSONB,
    products_clicked UUID[],
    products_purchased UUID[],
    session_duration_seconds INTEGER,
    conversion_rate DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gift_wizard_metrics_user_id ON gift_wizard_metrics(user_id);
CREATE INDEX idx_gift_wizard_metrics_occasion ON gift_wizard_metrics(occasion);
CREATE INDEX idx_gift_wizard_metrics_created_at ON gift_wizard_metrics(created_at DESC);

COMMENT ON TABLE gift_wizard_metrics IS 'AI gift recommendation system usage and performance';
COMMENT ON COLUMN gift_wizard_metrics.recommended_products IS 'JSON array of recommended product IDs and scores';
COMMENT ON COLUMN gift_wizard_metrics.conversion_rate IS 'Percentage of recommendations that led to purchase';

-- Remote Control Metrics (WebRTC feature analytics)
CREATE TABLE IF NOT EXISTS remote_control_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    session_duration_seconds INTEGER,
    connection_quality VARCHAR(20) CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
    actions_performed INTEGER DEFAULT 0,
    products_viewed UUID[],
    products_added_to_cart UUID[],
    order_completed BOOLEAN DEFAULT FALSE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_remote_control_metrics_user_id ON remote_control_metrics(user_id);
CREATE INDEX idx_remote_control_metrics_session_id ON remote_control_metrics(session_id);
CREATE INDEX idx_remote_control_metrics_created_at ON remote_control_metrics(created_at DESC);
CREATE INDEX idx_remote_control_metrics_order_completed ON remote_control_metrics(order_completed);

COMMENT ON TABLE remote_control_metrics IS 'WebRTC remote shopping assistance metrics';
COMMENT ON COLUMN remote_control_metrics.connection_quality IS 'WebRTC connection quality rating';
COMMENT ON COLUMN remote_control_metrics.actions_performed IS 'Number of actions taken during session';

-- AI Search Logs (CLIP image search analytics)
CREATE TABLE IF NOT EXISTS ai_search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('image', 'text', 'hybrid')),
    query_text TEXT,
    query_image_url TEXT,
    results_count INTEGER,
    top_result_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    click_position INTEGER,
    session_id VARCHAR(100),
    search_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_search_logs_user_id ON ai_search_logs(user_id);
CREATE INDEX idx_ai_search_logs_search_type ON ai_search_logs(search_type);
CREATE INDEX idx_ai_search_logs_session_id ON ai_search_logs(session_id);
CREATE INDEX idx_ai_search_logs_created_at ON ai_search_logs(created_at DESC);

COMMENT ON TABLE ai_search_logs IS 'CLIP image search and AI search analytics';
COMMENT ON COLUMN ai_search_logs.click_position IS 'Position of clicked result in search results';

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('order', 'promotion', 'review', 'inquiry', 'system', 'other')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE notifications IS 'Push notifications and in-app alerts';

-- Update timestamp triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
