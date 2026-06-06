-- =============================================================
-- Migration 001: Tables
-- Depends on: 000_enums
-- =============================================================

-- -----------------------------------------------------------
-- clinics
-- One row per dental practice. The slug is used in the public
-- enquiry form URL: /enquiry/[clinicSlug]
-- -----------------------------------------------------------
CREATE TABLE public.clinics (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  website    TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- profiles
-- Extends auth.users with application-level fields.
-- Created automatically by handle_new_user trigger (migration 002).
-- -----------------------------------------------------------
CREATE TABLE public.profiles (
  id         UUID           PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id  UUID           REFERENCES public.clinics(id) ON DELETE SET NULL,
  role       public.user_role NOT NULL DEFAULT 'clinic_staff',
  full_name  TEXT,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- treatments
-- Clinic-specific catalogue of offered treatments.
-- Used to customise which options appear in the enquiry form.
-- -----------------------------------------------------------
CREATE TABLE public.treatments (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID              NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name        TEXT              NOT NULL,
  type        public.treatment_type NOT NULL,
  description TEXT,
  is_active   BOOLEAN           NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- leads
-- A patient enquiry captured via the public enquiry form or
-- manually entered by staff.
-- IMPORTANT: direct INSERT is blocked by RLS for non-service-role.
-- All public form submissions go through a server action that
-- uses the admin client.
-- -----------------------------------------------------------
CREATE TABLE public.leads (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID              NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  treatment_type    public.treatment_type,
  status            public.lead_status NOT NULL DEFAULT 'new',
  full_name         TEXT              NOT NULL,
  email             TEXT              NOT NULL,
  phone             TEXT,
  message           TEXT,
  gdpr_consent      BOOLEAN           NOT NULL DEFAULT false,
  marketing_consent BOOLEAN           NOT NULL DEFAULT false,
  assigned_to       UUID              REFERENCES public.profiles(id) ON DELETE SET NULL,
  source            TEXT              NOT NULL DEFAULT 'enquiry_form',
  booked_at         TIMESTAMPTZ,      -- set automatically when status → consultation_booked
  archived_at       TIMESTAMPTZ,      -- set automatically when status → archived
  anonymised_at     TIMESTAMPTZ,      -- set by GDPR erasure; triggers PII wipe
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- followup_templates
-- Email sequences configured per clinic (and optionally per
-- treatment type). step_order controls the sequence position.
-- delay_days is relative to the previous step (or lead created_at
-- for step 1).
-- -----------------------------------------------------------
CREATE TABLE public.followup_templates (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID              NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  treatment_type public.treatment_type,          -- NULL = applies to all treatments
  name           TEXT              NOT NULL,
  subject        TEXT              NOT NULL,
  body_html      TEXT              NOT NULL,      -- supports {{lead_name}} placeholder
  delay_days     INTEGER           NOT NULL DEFAULT 1 CHECK (delay_days >= 0),
  step_order     INTEGER           NOT NULL DEFAULT 1 CHECK (step_order >= 1),
  is_active      BOOLEAN           NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- followup_tasks
-- One row per scheduled email for a specific lead.
-- Created when a lead is submitted; cancelled automatically
-- when the lead is closed (booked / lost / archived / anonymised).
-- Written only by the service role (cron system).
-- -----------------------------------------------------------
CREATE TABLE public.followup_tasks (
  id            UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID                      NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  clinic_id     UUID                      NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  template_id   UUID                      REFERENCES public.followup_templates(id) ON DELETE SET NULL,
  status        public.followup_task_status NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ               NOT NULL,
  sent_at       TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ               NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- message_events
-- Delivery and engagement events received from Resend webhooks.
-- Append-only — no updates, no deletes.
-- -----------------------------------------------------------
CREATE TABLE public.message_events (
  id               UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_task_id UUID                     REFERENCES public.followup_tasks(id) ON DELETE SET NULL,
  lead_id          UUID                     NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  clinic_id        UUID                     NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  event_type       public.message_event_type NOT NULL,
  resend_email_id  TEXT,                    -- Resend's internal email ID
  metadata         JSONB,
  occurred_at      TIMESTAMPTZ              NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- lead_activity
-- Immutable timeline of events for each lead (status changes,
-- staff notes, emails sent). Actor_id is NULL for system events.
-- -----------------------------------------------------------
CREATE TABLE public.lead_activity (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID              NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  clinic_id     UUID              NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  actor_id      UUID              REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type public.activity_type NOT NULL,
  description   TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- audit_logs
-- Platform-level audit trail. Written only via service role.
-- Clinic-scoped actions include clinic_id; platform actions
-- have clinic_id = NULL.
-- -----------------------------------------------------------
CREATE TABLE public.audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID        REFERENCES public.clinics(id) ON DELETE SET NULL,
  actor_id      UUID,                    -- auth.uid() at time of action
  actor_email   TEXT,                    -- denormalised for durability after user deletion
  action        TEXT        NOT NULL,    -- e.g. 'lead.status_changed', 'lead.anonymised'
  resource_type TEXT,                    -- e.g. 'lead', 'template'
  resource_id   UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
