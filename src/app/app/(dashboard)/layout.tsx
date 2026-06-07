import { requireClinicAccess, isPlatformOwner } from "@/lib/auth";
import { AppShell } from "./app-shell";

// Clinic dashboard guard + sidebar.
// Only reached by users with a clinic assigned (or platform_owner).
// Users without a clinic are redirected to /app/onboarding by requireClinicAccess().
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireClinicAccess();
  const { email, profile } = currentUser;

  const displayName = profile.full_name?.trim() || email;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <AppShell
      displayName={displayName}
      initials={initials}
      role={profile.role}
      showAdminLink={isPlatformOwner(currentUser)}
    >
      {children}
    </AppShell>
  );
}
