"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "General", href: "/app/settings" },
  { label: "Follow-up Templates", href: "/app/settings/templates" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1" aria-label="Settings navigation">
      {TABS.map((tab) => {
        const active =
          tab.href === "/app/settings"
            ? pathname === "/app/settings"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
