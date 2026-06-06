import { requirePlatformOwner } from "@/lib/auth";

/**
 * Guard layout for all /app/admin/* routes.
 * requirePlatformOwner() redirects to /app/leads for non-platform-owner users.
 * The parent /app layout already handles general authentication.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformOwner();
  return <>{children}</>;
}
