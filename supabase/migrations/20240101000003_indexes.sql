-- =============================================================
-- Migration 003: Indexes
-- Depends on: 001_tables
-- =============================================================

-- -----------------------------------------------------------
-- clinics
-- -----------------------------------------------------------
CREATE INDEX idx_clinics_slug      ON public.clinics (slug);
CREATE INDEX idx_clinics_is_active ON public.clinics (is_active);

-- -----------------------------------------------------------
-- profiles
-- -----------------------------------------------------------
CREATE INDEX idx_profiles_clinic_id ON public.profiles (clinic_id);
CREATE INDEX idx_profiles_role      ON public.profiles (role);

-- -----------------------------------------------------------
-- treatments
-- -----------------------------------------------------------
CREATE INDEX idx_treatments_clinic_id   ON public.treatments (clinic_id);
CREATE INDEX idx_treatments_clinic_type ON public.treatments (clinic_id, type);

-- -----------------------------------------------------------
-- leads
-- -----------------------------------------------------------
-- Primary dashboard query: all leads for a clinic ordered by recency
CREATE INDEX idx_leads_clinic_created   ON public.leads (clinic_id, created_at DESC);

-- Filter by status within a clinic (the most common dashboard filter)
CREATE INDEX idx_leads_clinic_status    ON public.leads (clinic_id, status);

-- Assignment lookup
CREATE INDEX idx_leads_assigned_to      ON public.leads (assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Duplicate detection on incoming enquiries (case-insensitive)
CREATE INDEX idx_leads_email_lower      ON public.leads (clinic_id, lower(email));

-- -----------------------------------------------------------
-- followup_templates
-- -----------------------------------------------------------
CREATE INDEX idx_templates_clinic_id    ON public.followup_templates (clinic_id);
CREATE INDEX idx_templates_clinic_seq   ON public.followup_templates (clinic_id, treatment_type, step_order);

-- -----------------------------------------------------------
-- followup_tasks
-- Partial index on pending tasks is the key cron performance index:
-- the cron job only ever needs rows WHERE status = 'pending'.
-- -----------------------------------------------------------
CREATE INDEX idx_tasks_lead_id          ON public.followup_tasks (lead_id);
CREATE INDEX idx_tasks_clinic_id        ON public.followup_tasks (clinic_id);
CREATE INDEX idx_tasks_pending_due      ON public.followup_tasks (scheduled_for)
  WHERE status = 'pending';

-- -----------------------------------------------------------
-- message_events
-- -----------------------------------------------------------
CREATE INDEX idx_msg_events_lead_id     ON public.message_events (lead_id);
CREATE INDEX idx_msg_events_clinic_id   ON public.message_events (clinic_id);
CREATE INDEX idx_msg_events_occurred_at ON public.message_events (occurred_at DESC);

-- -----------------------------------------------------------
-- lead_activity
-- -----------------------------------------------------------
CREATE INDEX idx_activity_lead_id       ON public.lead_activity (lead_id, created_at DESC);
CREATE INDEX idx_activity_clinic_id     ON public.lead_activity (clinic_id);

-- -----------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------
CREATE INDEX idx_audit_clinic_id        ON public.audit_logs (clinic_id);
CREATE INDEX idx_audit_resource_id      ON public.audit_logs (resource_id)
  WHERE resource_id IS NOT NULL;
CREATE INDEX idx_audit_created_at       ON public.audit_logs (created_at DESC);
