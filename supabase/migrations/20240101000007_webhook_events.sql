-- =============================================================
-- Migration 007: Resend webhook ingestion support
--
-- Extends message_event_type and activity_type enums with email
-- lifecycle events received from Resend webhooks.
-- Adds provider_event_id (Svix delivery ID) for idempotent
-- deduplication and clicked_url for email.clicked events.
-- =============================================================

-- ── New message_event_type values ────────────────────────────────────────────
ALTER TYPE public.message_event_type ADD VALUE IF NOT EXISTS 'email_delivered';
ALTER TYPE public.message_event_type ADD VALUE IF NOT EXISTS 'email_delivery_delayed';
ALTER TYPE public.message_event_type ADD VALUE IF NOT EXISTS 'email_failed';

-- ── New activity_type values ─────────────────────────────────────────────────
-- email_sent and email_failed already exist; only add the missing ones.
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'email_delivered';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'email_opened';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'email_clicked';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'email_bounced';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'email_complained';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'email_delivery_delayed';

-- ── New columns on message_events ───────────────────────────────────────────
-- provider_event_id: the Svix delivery ID from the svix-id header.
-- Used to deduplicate webhook retries.
ALTER TABLE public.message_events
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS clicked_url        TEXT;

-- ── Unique index for deduplication ──────────────────────────────────────────
-- Partial index — only rows where provider_event_id is set are constrained.
-- Existing rows (from cron) have provider_event_id = NULL and are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_events_provider_event_id
  ON public.message_events (provider_event_id)
  WHERE provider_event_id IS NOT NULL;
