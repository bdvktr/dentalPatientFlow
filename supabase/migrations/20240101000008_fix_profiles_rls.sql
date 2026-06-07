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
--   Drop and recreate the policy with a WITH CHECK clause that freezes
--   role and clinic_id for non-platform-owners. They may still update
--   safe profile fields (e.g. full_name) but cannot self-promote.
--   platform_owner retains full update capability for admin operations.
--
-- Non-destructive: this only TIGHTENS an existing policy. No data is
-- altered, no rows are deleted, no tables are dropped. The USING clause
-- (which row can be modified) is unchanged — only WITH CHECK (what new
-- values are permitted) is added. Any platform_owner reads/writes are
-- unaffected.
-- =============================================================

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Users can update their own profile (name, etc.).
-- platform_owner can update any profile (to set role or clinic_id).
-- Non-platform-owner users CANNOT change role or clinic_id — those
-- columns must only be changed via the service-role admin client
-- (i.e. the setupClinicForNewUser server action or platform admin UI).
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    public.is_platform_owner()
    OR id = auth.uid()
  )
  WITH CHECK (
    -- platform_owner: unrestricted writes on any row
    public.is_platform_owner()
    OR (
      -- Non-platform-owners: can only update their own row,
      -- and role + clinic_id must remain unchanged.
      -- IS NOT DISTINCT FROM handles NULL clinic_id correctly.
      id = auth.uid()
      AND role = (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      )
      AND clinic_id IS NOT DISTINCT FROM (
        SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );
