-- =============================================================
-- Migration 004: Row Level Security
-- Depends on: 001_tables, 002_functions
--
-- Security model summary:
--   platform_owner  → full access across all clinics
--   clinic_admin    → full access within own clinic
--   clinic_staff    → read leads + add activity within own clinic
--   unauthenticated → no access to any sensitive table
--
-- The service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
-- entirely and is used server-side for:
--   • Public enquiry form lead creation
--   • Cron follow-up task management
--   • Audit log writes
-- =============================================================

-- -----------------------------------------------------------
-- Enable RLS on every sensitive table
-- -----------------------------------------------------------
ALTER TABLE public.clinics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- CLINICS
-- =============================================================

-- platform_owner sees all; authenticated clinic users see only
-- their own clinic row.
CREATE POLICY "clinics_select"
  ON public.clinics FOR SELECT
  USING (
    public.is_platform_owner()
    OR id = public.get_current_user_clinic_id()
  );

-- Only platform_owner can create clinics (via admin UI or service role).
CREATE POLICY "clinics_insert"
  ON public.clinics FOR INSERT
  WITH CHECK (public.is_platform_owner());

-- platform_owner can update any clinic.
-- clinic_admin can update their own clinic's settings.
CREATE POLICY "clinics_update"
  ON public.clinics FOR UPDATE
  USING (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND id = public.get_current_user_clinic_id())
  );

-- Hard deletes only by platform_owner.
CREATE POLICY "clinics_delete"
  ON public.clinics FOR DELETE
  USING (public.is_platform_owner());

-- =============================================================
-- PROFILES
-- =============================================================

-- Users can read their own profile and profiles in the same clinic.
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    public.is_platform_owner()
    OR id = auth.uid()
    OR clinic_id = public.get_current_user_clinic_id()
  );

-- Profile rows are created automatically by the handle_new_user trigger
-- (which runs as service role). platform_owner can insert manually.
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_platform_owner());

-- Users can update their own profile (name, etc.).
-- platform_owner can update any profile (to set role or clinic_id).
-- NOTE: A server action should validate that clinic staff cannot
-- self-elevate their role; the RLS here trusts that logic.
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    public.is_platform_owner()
    OR id = auth.uid()
  );

CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  USING (public.is_platform_owner());

-- =============================================================
-- TREATMENTS
-- =============================================================

CREATE POLICY "treatments_select"
  ON public.treatments FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

CREATE POLICY "treatments_insert"
  ON public.treatments FOR INSERT
  WITH CHECK (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND clinic_id = public.get_current_user_clinic_id())
  );

CREATE POLICY "treatments_update"
  ON public.treatments FOR UPDATE
  USING (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND clinic_id = public.get_current_user_clinic_id())
  );

CREATE POLICY "treatments_delete"
  ON public.treatments FOR DELETE
  USING (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND clinic_id = public.get_current_user_clinic_id())
  );

-- =============================================================
-- LEADS
-- Important: public users have NO access whatsoever.
-- All public enquiry form submissions are routed through a
-- server action using the admin client (service role), which
-- bypasses RLS entirely.
-- =============================================================

-- Clinic users see only their clinic's leads.
-- Unauthenticated requests see nothing.
CREATE POLICY "leads_select"
  ON public.leads FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

-- Direct authenticated INSERT is intentionally blocked for all
-- clinic roles. The enquiry form server action uses service role.
-- platform_owner exception retained for admin tooling.
CREATE POLICY "leads_insert"
  ON public.leads FOR INSERT
  WITH CHECK (public.is_platform_owner());

-- clinic_admin and clinic_staff can update leads in their clinic
-- (status changes, assignment, notes field).
CREATE POLICY "leads_update"
  ON public.leads FOR UPDATE
  USING (
    public.is_platform_owner()
    OR (
      clinic_id = public.get_current_user_clinic_id()
      AND public.get_current_user_role() IN ('clinic_admin'::public.user_role, 'clinic_staff'::public.user_role)
    )
  );

-- Hard delete disabled. Use status = 'archived' for soft delete.
-- platform_owner only as a last resort.
CREATE POLICY "leads_delete"
  ON public.leads FOR DELETE
  USING (public.is_platform_owner());

-- =============================================================
-- FOLLOWUP_TEMPLATES
-- =============================================================

CREATE POLICY "followup_templates_select"
  ON public.followup_templates FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

CREATE POLICY "followup_templates_insert"
  ON public.followup_templates FOR INSERT
  WITH CHECK (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND clinic_id = public.get_current_user_clinic_id())
  );

CREATE POLICY "followup_templates_update"
  ON public.followup_templates FOR UPDATE
  USING (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND clinic_id = public.get_current_user_clinic_id())
  );

CREATE POLICY "followup_templates_delete"
  ON public.followup_templates FOR DELETE
  USING (
    public.is_platform_owner()
    OR (public.is_clinic_admin() AND clinic_id = public.get_current_user_clinic_id())
  );

-- =============================================================
-- FOLLOWUP_TASKS
-- Tasks are written exclusively by the cron system (service role).
-- Clinic users can read them (for the dashboard task list).
-- =============================================================

CREATE POLICY "followup_tasks_select"
  ON public.followup_tasks FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

-- All writes go through service role (cron). platform_owner exception
-- retained for admin/debug tooling.
CREATE POLICY "followup_tasks_insert"
  ON public.followup_tasks FOR INSERT
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "followup_tasks_update"
  ON public.followup_tasks FOR UPDATE
  USING (public.is_platform_owner());

CREATE POLICY "followup_tasks_delete"
  ON public.followup_tasks FOR DELETE
  USING (public.is_platform_owner());

-- =============================================================
-- MESSAGE_EVENTS
-- Append-only. Written by Resend webhook handler (service role).
-- =============================================================

CREATE POLICY "message_events_select"
  ON public.message_events FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

-- Webhook handler uses service role, so this policy covers only
-- the platform_owner for manual inserts.
CREATE POLICY "message_events_insert"
  ON public.message_events FOR INSERT
  WITH CHECK (public.is_platform_owner());

-- No UPDATE or DELETE — message events are immutable.

-- =============================================================
-- LEAD_ACTIVITY
-- Clinic staff can read and add activity entries.
-- Entries are immutable once written (no UPDATE/DELETE).
-- =============================================================

CREATE POLICY "lead_activity_select"
  ON public.lead_activity FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

-- clinic_staff and clinic_admin can add notes / activity for their leads.
CREATE POLICY "lead_activity_insert"
  ON public.lead_activity FOR INSERT
  WITH CHECK (
    public.is_platform_owner()
    OR (
      clinic_id = public.get_current_user_clinic_id()
      AND public.get_current_user_role() IN ('clinic_admin'::public.user_role, 'clinic_staff'::public.user_role)
    )
  );

-- No UPDATE or DELETE — activity log is append-only.

-- =============================================================
-- AUDIT_LOGS
-- Read-only for authenticated users (own clinic only).
-- Written exclusively via service role.
-- =============================================================

CREATE POLICY "audit_logs_select"
  ON public.audit_logs FOR SELECT
  USING (
    public.is_platform_owner()
    OR clinic_id = public.get_current_user_clinic_id()
  );

-- Service role bypasses RLS for all writes. platform_owner
-- exception retained for admin tooling.
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_platform_owner());

-- No UPDATE or DELETE — audit log is immutable.
