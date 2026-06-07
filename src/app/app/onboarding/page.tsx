import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account setup",
};

/**
 * Shown when a clinic_admin or clinic_staff user has no clinic assigned.
 * This can happen if they were invited directly (not via the signup flow)
 * or if clinic creation failed. Clinic assignment is handled in Phase 9.
 */
export default async function OnboardingPage() {
  const user = await requireAuth();

  // Already set up — no reason to be on onboarding.
  // Platform owners manage clinics via /app/admin, not onboarding.
  if (user.profile.clinic_id || user.profile.role === "platform_owner") {
    redirect("/app");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold">Almost there</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is active but hasn&apos;t been linked to a clinic yet.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          If you were invited by a clinic, ask your clinic administrator to
          assign your account. If you signed up directly, please contact
          support.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          support@dentalpatientflow.com
        </p>
      </div>
    </div>
  );
}
