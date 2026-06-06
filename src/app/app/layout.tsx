import Link from "next/link";
import { LayoutDashboard, Users, BarChart2, Settings, ShieldAlert } from "lucide-react";
import { requireClinicAccess, isPlatformOwner } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Requires authentication + profile.
  // Redirects non-platform-owners without a clinic to /app/onboarding.
  const currentUser = await requireClinicAccess();
  const { email, profile } = currentUser;

  const displayName = profile.full_name?.trim() || email;
  const initials = displayName.charAt(0).toUpperCase();
  const showAdminLink = isPlatformOwner(currentUser);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link href="/app/leads" className="text-sm font-semibold leading-tight">
            Dental PatientFlow AI
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <NavLink href="/app" icon={<LayoutDashboard size={16} />}>
            Dashboard
          </NavLink>
          <NavLink href="/app/leads" icon={<Users size={16} />}>
            Leads
          </NavLink>
          <NavLink href="/app/reports" icon={<BarChart2 size={16} />}>
            Reports
          </NavLink>
          <NavLink href="/app/settings" icon={<Settings size={16} />}>
            Settings
          </NavLink>
          {showAdminLink && (
            <NavLink href="/app/admin" icon={<ShieldAlert size={16} />}>
              Platform Admin
            </NavLink>
          )}
        </nav>

        {/* User info + sign out */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {profile.role.replace(/_/g, " ")}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
