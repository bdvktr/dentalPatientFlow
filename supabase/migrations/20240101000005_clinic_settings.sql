-- =============================================================
-- Migration 005: Extend clinics with operational settings
-- Depends on: 001_tables
-- =============================================================

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS timezone          TEXT    NOT NULL DEFAULT 'Europe/London',
  ADD COLUMN IF NOT EXISTS booking_url       TEXT,
  ADD COLUMN IF NOT EXISTS privacy_url       TEXT,
  ADD COLUMN IF NOT EXISTS followup_enabled  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS retention_days    INTEGER NOT NULL DEFAULT 365
                                             CHECK (retention_days BETWEEN 30 AND 3650);

COMMENT ON COLUMN public.clinics.timezone         IS 'IANA timezone name, e.g. Europe/London';
COMMENT ON COLUMN public.clinics.booking_url      IS 'Direct booking link shown on the enquiry success page';
COMMENT ON COLUMN public.clinics.privacy_url      IS 'Link to the clinic''s privacy notice';
COMMENT ON COLUMN public.clinics.followup_enabled IS 'When false the cron skips pending tasks for this clinic';
COMMENT ON COLUMN public.clinics.retention_days   IS 'Days after which leads become eligible for anonymisation';
