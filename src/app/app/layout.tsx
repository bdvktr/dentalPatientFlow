import { requireAuth } from "@/lib/auth";

// Authentication-only shell for all /app routes.
// Does NOT render the sidebar — that lives in (dashboard)/layout.tsx.
// This layout exists so that /app/onboarding and /app/admin are still
// protected by auth without being caught by the clinic-access guard.
export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
