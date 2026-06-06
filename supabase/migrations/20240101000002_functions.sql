-- =============================================================
-- Migration 002: Functions and triggers
-- Depends on: 001_tables
-- =============================================================

-- -----------------------------------------------------------
-- updated_at: generic trigger function
-- Attached to every table that has an updated_at column.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_followup_templates_updated_at
  BEFORE UPDATE ON public.followup_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_followup_tasks_updated_at
  BEFORE UPDATE ON public.followup_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------
-- handle_new_user: auto-create a profile row on signup
-- Fired AFTER INSERT on auth.users by Supabase Auth.
-- ON CONFLICT DO NOTHING guards against any duplicate calls.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------
-- RLS helper functions
-- SECURITY DEFINER so they can read public.profiles without
-- being blocked by the profiles RLS policy (which itself calls
-- these functions). Fixed search_path prevents schema injection.
-- -----------------------------------------------------------

-- Returns the role of the currently authenticated user.
-- Returns NULL if the user is unauthenticated or has no profile.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Returns the clinic_id of the currently authenticated user.
-- Returns NULL if the user is unauthenticated or not assigned to a clinic.
CREATE OR REPLACE FUNCTION public.get_current_user_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Returns true if the current user has the platform_owner role.
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'platform_owner' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Returns true if the current user has the clinic_admin role (or platform_owner).
CREATE OR REPLACE FUNCTION public.is_clinic_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('clinic_admin', 'platform_owner') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------
-- Lead lifecycle triggers
-- -----------------------------------------------------------

-- BEFORE UPDATE on leads:
-- Sets booked_at / archived_at timestamps when status changes.
-- Modifying NEW here (BEFORE trigger) rewrites the row safely.
CREATE OR REPLACE FUNCTION public.set_lead_lifecycle_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'consultation_booked' AND OLD.status <> 'consultation_booked' THEN
    NEW.booked_at = COALESCE(NEW.booked_at, now());
  END IF;

  IF NEW.status = 'archived' AND OLD.status <> 'archived' THEN
    NEW.archived_at = COALESCE(NEW.archived_at, now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_set_lifecycle_timestamps
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.set_lead_lifecycle_timestamps();

-- AFTER UPDATE on leads:
-- Cancels all pending follow-up tasks when the lead is closed.
-- Runs AFTER so the leads row is committed before we query it.
-- SECURITY DEFINER bypasses the followup_tasks RLS UPDATE policy
-- (which otherwise blocks clinic_staff), because this trigger
-- is acting on behalf of the system.
CREATE OR REPLACE FUNCTION public.cancel_pending_followup_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('consultation_booked', 'treatment_started', 'lost', 'archived') THEN
    UPDATE public.followup_tasks
    SET
      status        = 'cancelled',
      cancelled_at  = now(),
      cancel_reason = 'lead_closed:' || NEW.status::text,
      updated_at    = now()
    WHERE lead_id = NEW.id
      AND status   = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_cancel_followup_tasks
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.cancel_pending_followup_tasks();

-- BEFORE UPDATE on leads:
-- When anonymised_at is first set, overwrites all PII columns
-- with placeholder values. Runs BEFORE so it can mutate NEW.
-- Also cancels pending tasks via a direct UPDATE (safe in BEFORE trigger).
CREATE OR REPLACE FUNCTION public.anonymise_lead_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.anonymised_at IS NOT NULL AND OLD.anonymised_at IS NULL THEN
    NEW.full_name         := 'Anonymised';
    NEW.email             := 'anonymised-' || OLD.id::text || '@invalid';
    NEW.phone             := NULL;
    NEW.message           := NULL;
    NEW.marketing_consent := false;

    -- Cancel any pending follow-up tasks immediately
    UPDATE public.followup_tasks
    SET
      status        = 'cancelled',
      cancelled_at  = now(),
      cancel_reason = 'lead_anonymised',
      updated_at    = now()
    WHERE lead_id = OLD.id
      AND status   = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_anonymise_pii
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  WHEN (NEW.anonymised_at IS NOT NULL AND OLD.anonymised_at IS NULL)
  EXECUTE FUNCTION public.anonymise_lead_pii();
