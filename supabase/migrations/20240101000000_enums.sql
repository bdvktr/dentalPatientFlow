-- =============================================================
-- Migration 000: Enum types
-- All enums live in the public schema alongside the tables
-- that reference them.
-- =============================================================

-- User roles within the platform
CREATE TYPE public.user_role AS ENUM (
  'platform_owner',   -- Dental PatientFlow AI staff (cross-clinic access)
  'clinic_admin',     -- Clinic owner / practice manager
  'clinic_staff'      -- Receptionist / treatment coordinator
);

-- Lifecycle status of a patient lead
CREATE TYPE public.lead_status AS ENUM (
  'new',                   -- Enquiry just received
  'contacted',             -- Clinic has made contact
  'consultation_booked',   -- Appointment confirmed
  'treatment_started',     -- Patient has begun treatment
  'lost',                  -- Lead went cold or chose another provider
  'archived'               -- Manually archived by staff
);

-- Treatment category — matches the enquiry form options
CREATE TYPE public.treatment_type AS ENUM (
  'dental_implants',
  'invisalign',
  'whitening',
  'cosmetic',
  'smile_makeover',
  'other'
);

-- Status of a scheduled follow-up email task
CREATE TYPE public.followup_task_status AS ENUM (
  'pending',    -- Waiting to be sent
  'sent',       -- Successfully dispatched via Resend
  'cancelled',  -- Cancelled (lead closed, or manually)
  'failed'      -- Resend error
);

-- Email delivery and engagement events from Resend webhooks
CREATE TYPE public.message_event_type AS ENUM (
  'email_sent',
  'email_opened',
  'email_clicked',
  'email_bounced',
  'email_complained'
);

-- Types of entries in the per-lead activity timeline
CREATE TYPE public.activity_type AS ENUM (
  'lead_created',
  'status_changed',
  'note_added',
  'email_sent',
  'email_failed',
  'lead_archived',
  'lead_anonymised',
  'followup_cancelled',
  'assignment_changed'
);
