import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireClinicAccess, isPlatformOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/leads/status-badge";
import { TREATMENT_OPTIONS } from "@/lib/validations/enquiry";

const TREATMENT_LABELS = Object.fromEntries(
  TREATMENT_OPTIONS.map((o) => [o.value, o.label])
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default async function DashboardPage() {
  const user = await requireClinicAccess();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  // Parallel stat queries — all scoped by RLS
  const [
    totalThisMonthResult,
    newLeadsResult,
    bookedResult,
    lostResult,
    emailsSentResult,
    recentResult,
    actionResult,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "consultation_booked"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "lost"),
    supabase
      .from("message_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "email_sent")
      .gte("occurred_at", monthStart),
    supabase
      .from("leads")
      .select("id, full_name, treatment_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("leads")
      .select("id, full_name, treatment_type, status, created_at")
      .in("status", ["new", "contacted"])
      .order("created_at", { ascending: true })
      .limit(6),
  ]);

  const totalThisMonth = totalThisMonthResult.count ?? 0;
  const newLeads = newLeadsResult.count ?? 0;
  const booked = bookedResult.count ?? 0;
  const lost = lostResult.count ?? 0;
  const emailsSent = emailsSentResult.count ?? 0;
  const conversionRate =
    totalThisMonth > 0 ? Math.round((booked / totalThisMonth) * 100) : 0;

  const recentLeads = recentResult.data ?? [];
  const actionLeads = actionResult.data ?? [];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        {isPlatformOwner(user) && (
          <p className="mt-1 text-xs text-muted-foreground">
            Platform owner view — aggregate data across all clinics.
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Leads this month" value={totalThisMonth} />
        <StatCard label="New enquiries" value={newLeads} />
        <StatCard label="Consultations booked" value={booked} />
        <StatCard label="Lost" value={lost} />
        <StatCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          subtext="this month"
        />
        <StatCard label="Emails sent" value={emailsSent} subtext="this month" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent leads */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent enquiries</h2>
            <Link
              href="/app/leads"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <LeadMiniTable leads={recentLeads} emptyText="No leads yet." />
        </section>

        {/* Requires action */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Requires action</h2>
            <Link
              href="/app/leads?status=new"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
            >
              View new
            </Link>
          </div>
          <LeadMiniTable
            leads={actionLeads}
            emptyText="No leads awaiting action."
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {subtext && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}

function LeadMiniTable({
  leads,
  emptyText,
}: {
  leads: {
    id: string;
    full_name: string;
    treatment_type: string | null;
    status: string;
    created_at: string;
  }[];
  emptyText: string;
}) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
        <Inbox className="mx-auto h-7 w-7 text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-2.5">
                <Link
                  href={`/app/leads/${lead.id}`}
                  className="font-medium hover:underline underline-offset-4"
                >
                  {lead.full_name}
                </Link>
                {lead.treatment_type && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {TREATMENT_LABELS[lead.treatment_type] ?? lead.treatment_type}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StatusBadge status={lead.status as never} />
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
