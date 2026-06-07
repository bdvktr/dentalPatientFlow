"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  // "exact" matches only the literal href; "prefix" matches the href and any sub-paths.
  match: "exact" | "prefix";
};

type AppShellProps = {
  displayName: string;
  initials: string;
  role: string;
  showAdminLink: boolean;
  children: React.ReactNode;
};

function NavItems({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active =
          item.match === "exact"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function UserFooter({
  displayName,
  initials,
  role,
}: {
  displayName: string;
  initials: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground capitalize">
          {role.replace(/_/g, " ")}
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}

export function AppShell({
  displayName,
  initials,
  role,
  showAdminLink,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/app",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
      match: "exact",
    },
    {
      href: "/app/leads",
      label: "Leads",
      icon: <Users size={16} />,
      match: "prefix",
    },
    {
      href: "/app/reports",
      label: "Reports",
      icon: <BarChart2 size={16} />,
      match: "prefix",
    },
    {
      href: "/app/settings",
      label: "Settings",
      icon: <Settings size={16} />,
      match: "prefix",
    },
    ...(showAdminLink
      ? [
          {
            href: "/app/admin",
            label: "Platform Admin",
            icon: <ShieldAlert size={16} />,
            match: "prefix" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link href="/app/leads" className="text-sm font-semibold leading-tight">
            Dental PatientFlow AI
          </Link>
        </div>
        <nav className="flex-1 p-3">
          <NavItems items={navItems} pathname={pathname} />
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <UserFooter displayName={displayName} initials={initials} role={role} />
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center border-b border-sidebar-border bg-sidebar px-4 gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-md p-1.5 text-sidebar-foreground hover:bg-accent transition-colors"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <Menu size={20} />
        </button>
        <Link href="/app/leads" className="text-sm font-semibold">
          Dental PatientFlow AI
        </Link>
      </div>

      {/* ── Mobile drawer backdrop ──────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer panel ─────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/app/leads"
            className="text-sm font-semibold"
            onClick={() => setDrawerOpen(false)}
          >
            Dental PatientFlow AI
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-accent transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-3">
          <NavItems
            items={navItems}
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
          />
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <UserFooter displayName={displayName} initials={initials} role={role} />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      {/* pt-14 on mobile offsets the fixed top bar; removed on md+ */}
      <main className="flex flex-1 flex-col overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
