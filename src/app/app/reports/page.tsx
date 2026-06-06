import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicAccess } from "@/lib/auth";
import { computeMetrics } from "@/lib/reports/queries";
import { BarChart, WeeklyBarChart } from "@/components/reports/bar-chart";
import { ReportFilters } from "@/components/reports/report-filters";

export const metadata: Metadata = {
  title: "Reports",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireClinicAccess();
  const clinicId = user.profile.clinic_id;
  if (!clinicId) redirect("/app/admin");

  const sp = await searchParams;
  const from = typeof sp.from === "string" && sp.from ? sp.from : monthStartStr();
  const to = typeof sp.to === "string" && sp.to ? sp.to : todayStr();
  const treatment = typeof sp.treatment === "string" ? sp.treatment : "";
  const source = typeof sp.source === "string" ? sp.source : "";

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;

  const admin = createAdminClient();

  // Parallel: leads (for grouping) + email count + distinct sources
  let leadQuery = admin
    .from("leads")
    .select("status, treatment_type, source, created_at")
    .eq("clinic_id", clinicId)
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  if (treatment) leadQuery = leadQuery.eq("treatment_type", treatment as import("@/types/database").TreatmentType);
  if (source) leadQuery = leadQuery.eq("source", source);

  const [leadsResult, emailsResult, sourcesResult] = await Promise.all([
    leadQuery,
    admin
      .from("message_events")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("event_type", "email_sent")
      .gte("occurred_at", fromIso)
      .lte("occurred_at", toIso),
    admin
      .from("leads")
      .select("source")
      .eq("clinic_id", clinicId),
  ]);

  const leads = leadsResult.data ?? [];
  const emailsSent = emailsResult.count ?? 0;
  const sources = [
    ...new Set((sourcesResult.data ?? []).map((r) => r.source).filter(Boolean)),
  ].sort();

  const metrics = computeMetrics(leads, emailsSent, from, to);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Lead and follow-up performance for your clinic.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <ReportFilters
          from={from}
          to={to}
          treatment={treatment}
          source={source}
          sources={sources}
        />
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total leads" value={metrics.totalLeads} />
        <StatCard label="Booked" value={metrics.booked} />
        <StatCard
          label="Conversion rate"
          value={`${metrics.conversionRate}%`}
        />
        <StatCard label="Lost" value={metrics.lost} />
        <StatCard label="Emails sent" value={metrics.emailsSent} />
      </div>

      {/* Charts — two columns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Leads by treatment">
          <BarChart data={metrics.byTreatment} />
        </ChartCard>

        <ChartCard title="Leads by status">
          <BarChart data={metrics.byStatus} />
        </ChartCard>

        {metrics.bySource.length > 0 && (
          <ChartCard title="Leads by source">
            <BarChart data={metrics.bySource} />
          </ChartCard>
        )}
      </div>

      {/* Weekly trend — full width */}
      <ChartCard title="Weekly new leads">
        <WeeklyBarChart data={metrics.weeklyTrend} />
      </ChartCard>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
