-- Migration: Initialize extensions
-- Description: Enable required PostgreSQL extensions for the application
-- Created: 2025-12-09

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for AI/ML vector embeddings (CLIP, RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable case-insensitive text matching
CREATE EXTENSION IF NOT EXISTS citext;

-- Enable PostGIS for location-based features (optional, for future use)
-- CREATE EXTENSION IF NOT EXISTS postgis;

COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
COMMENT ON EXTENSION vector IS 'Vector similarity search for AI/ML embeddings';
COMMENT ON EXTENSION citext IS 'Case-insensitive text type';
