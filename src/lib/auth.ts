import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
};

const ROLE_PRIORITY: Record<UserRole, number> = {
  platform_owner: 3,
  clinic_admin: 2,
  clinic_staff: 1,
};

/**
 * Loads the authenticated user and their profile row.
 * Returns null for unauthenticated requests or missing profiles.
 * Never throws — safe to call anywhere server-side.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return { id: user.id, email: user.email ?? "", profile };
  } catch {
    return null;
  }
}

/**
 * Requires the request to be authenticated and have a profile.
 * Redirects to /login if not. Safe to use in layouts and pages.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Requires the user to have at least the given role.
 * Redirects to /app/leads for insufficient permissions.
 */
export async function requireRole(minimumRole: UserRole): Promise<CurrentUser> {
  const user = await requireAuth();
  if (ROLE_PRIORITY[user.profile.role] < ROLE_PRIORITY[minimumRole]) {
    redirect("/app/leads");
  }
  return user;
}

/**
 * Requires platform_owner. Redirects to /app/leads for all other roles.
 */
export async function requirePlatformOwner(): Promise<CurrentUser> {
  return requireRole("platform_owner");
}

/**
 * Requires clinic_admin or higher.
 */
export async function requireClinicAdmin(): Promise<CurrentUser> {
  return requireRole("clinic_admin");
}

/**
 * Requires the user to have a clinic assigned (clinic_admin/staff).
 * platform_owner is exempt — they operate across all clinics.
 * Redirects to /app/onboarding if the clinic is missing.
 */
export async function requireClinicAccess(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (
    user.profile.role !== "platform_owner" &&
    !user.profile.clinic_id
  ) {
    redirect("/app/onboarding");
  }
  return user;
}

/** Convenience: check without redirecting. */
export function isPlatformOwner(user: CurrentUser): boolean {
  return user.profile.role === "platform_owner";
}

export function isClinicAdmin(user: CurrentUser): boolean {
  return ROLE_PRIORITY[user.profile.role] >= ROLE_PRIORITY["clinic_admin"];
}

export function isClinicStaff(user: CurrentUser): boolean {
  return ROLE_PRIORITY[user.profile.role] >= ROLE_PRIORITY["clinic_staff"];
}
