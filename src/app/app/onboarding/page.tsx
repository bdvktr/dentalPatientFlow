import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account setup",
};

/**
 * Shown when a clinic_admin or clinic_staff user has no clinic assigned.
 * This can happen if they were invited directly (not via the signup flow)
 * or if clinic creation failed.
 */
export default async function OnboardingPage() {
  const user = await requireAuth();

  // Already set up — no reason to be on onboarding.
  // Platform owners manage clinics via /app/admin, not onboarding.
  if (user.profile.clinic_id || user.profile.role === "platform_owner") {
    redirect("/app");
  }

  const supportEmail = "support@dentalpatientflow.com";
  const mailtoHref = `mailto:${supportEmail}?subject=Dental+PatientFlow+AI+onboarding+request`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-blue-50 p-3">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-xl font-semibold">Almost there</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is active but hasn&apos;t been linked to a clinic
          workspace yet.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          If you were invited by a clinic, ask your clinic administrator to
          assign your account.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          If you signed up directly, contact us and we&apos;ll connect your
          account and send you the next setup steps.
        </p>
        <a
          href={mailtoHref}
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          {supportEmail}
        </a>
        <p className="mt-1 text-xs text-muted-foreground">
          We typically respond within one business day.
        </p>
        <div className="mt-8 border-t border-border pt-6">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
