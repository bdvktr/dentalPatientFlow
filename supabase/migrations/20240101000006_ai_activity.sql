-- =============================================================
-- Migration 006: Add ai_draft_generated to activity_type enum
-- =============================================================

ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'ai_draft_generated';
