import type { Metadata } from "next";
import { requirePlatformOwner } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Platform Admin",
};

export default async function AdminPage() {
  const { email, profile } = await requirePlatformOwner();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Platform Admin</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">{email}</span>{" "}
          &middot; {profile.role}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard title="Clinics" description="View and manage all clinic accounts." />
        <AdminCard title="Users" description="Manage user roles and clinic assignments." />
        <AdminCard title="Audit logs" description="Platform-wide audit trail." />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium">Full admin UI coming in a later phase.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the Supabase dashboard or SQL editor for platform-level operations
          during the MVP.
        </p>
      </div>
    </div>
  );
}

function AdminCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
