-- =============================================================
-- Migration 008: Fix profiles UPDATE RLS — prevent role/clinic_id self-escalation
--
-- Problem (identified in pre-demo security audit):
--   The original profiles_update policy has no WITH CHECK clause.
--   PostgreSQL falls back to using the USING expression as the check,
--   which permits any authenticated user to execute:
--     UPDATE profiles SET role = 'platform_owner' WHERE id = auth.uid()
--   and have it succeed — because USING only checks that the row is
--   accessible, not that the new values being written are safe.
--
-- Fix:
--   Drop the single combined policy and replace it with two clearly-scoped
--   policies using the existing SECURITY DEFINER helper functions.
--   This matches the pattern used by every other policy in this codebase
--   and avoids raw subqueries inside RLS policy expressions.
--
--   Policy 1 — platform_owner: unrestricted update on any profile row.
--   Policy 2 — self-update: own row only; role and clinic_id are frozen.
--
-- Why SECURITY DEFINER helpers instead of raw subqueries:
--   get_current_user_role() and get_current_user_clinic_id() are declared
--   SECURITY DEFINER in migration 002. They read public.profiles bypassing
--   RLS, which avoids the non-obvious re-entry that a raw subquery inside
--   an RLS policy expression would cause. All other policies in this file
--   use the same helpers for this reason.
--
-- Why STABLE matters for correctness:
--   Both helpers are STABLE. PostgreSQL evaluates them against the
--   transaction snapshot (READ COMMITTED: start of the UPDATE statement).
--   The uncommitted modification is not visible to the snapshot, so the
--   helpers return the PRE-UPDATE stored values of role and clinic_id.
--   The WITH CHECK then compares NEW.role/clinic_id against the old values.
--   A mismatch → WITH CHECK returns FALSE → write is rejected by PostgreSQL.
--
-- Non-destructive: no data is altered, no tables are dropped, no indexes
--   are removed. Only the profiles UPDATE policy is dropped and replaced.
--   The USING clause (which rows can be selected for modification) is
--   semantically identical to the original policy.
-- =============================================================

-- Drop the original single policy (and any prior attempt at split policies).
DROP POLICY IF EXISTS "profiles_update"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_platform_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self"         ON public.profiles;

-- =============================================================
-- Policy 1: platform_owner profile management
-- =============================================================
-- Expected behavior:
--   Platform owners can update any profile row with any values,
--   including role and clinic_id. This is how the admin UI assigns
--   roles and links users to clinic workspaces.
--
-- USING  — selects which rows the platform_owner may target.
-- WITH CHECK — permits any new values to be written (no column restrictions).
CREATE POLICY "profiles_update_platform_owner"
  ON public.profiles FOR UPDATE
  USING  (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- =============================================================
-- Policy 2: self-update (non-privileged fields only)
-- =============================================================
-- Expected behavior:
--   An authenticated user may update their own profile row, but only
--   non-privileged fields such as full_name. The two privileged columns
--   are immutable for non-platform-owners:
--
--   • role      — must equal the user's current stored role.
--                 Prevents self-escalation (e.g. setting role = 'platform_owner').
--   • clinic_id — must equal the user's current stored clinic_id (NULL-safe).
--                 Prevents tenant-hopping (e.g. reassigning to another clinic).
--
-- How the immutability check works:
--   In a WITH CHECK expression, bare column references (role, clinic_id)
--   refer to the NEW row being written. The helper functions return the
--   PRE-UPDATE stored values (they are STABLE SECURITY DEFINER functions
--   that read public.profiles against the statement-start snapshot).
--   If the caller tries to change role or clinic_id, NEW.role ≠ stored role,
--   WITH CHECK returns FALSE, and PostgreSQL rejects the write.
--
-- IS NOT DISTINCT FROM on clinic_id:
--   Uses NULL-safe equality so a user whose clinic_id is NULL can update
--   other fields without the check failing (NULL = NULL is not TRUE in SQL).
--
-- USING  — restricts update target to the user's own row only.
-- WITH CHECK — enforces role and clinic_id are unchanged.
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING  (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role      = public.get_current_user_role()          -- immutable for non-owners
    AND clinic_id IS NOT DISTINCT FROM public.get_current_user_clinic_id()  -- immutable, NULL-safe
  );
