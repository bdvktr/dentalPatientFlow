import Link from "next/link";
import { requireClinicAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/leads/status-badge";
import { LeadFilters } from "@/components/leads/lead-filters";
import { TREATMENT_OPTIONS } from "@/lib/validations/enquiry";
import type { LeadStatus, TreatmentType } from "@/types/database";

const TREATMENT_LABELS = Object.fromEntries(
  TREATMENT_OPTIONS.map((o) => [o.value, o.label])
);

const VALID_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "consultation_booked",
  "treatment_started",
  "lost",
  "archived",
];

const VALID_TREATMENTS: TreatmentType[] = [
  "dental_implants",
  "invisalign",
  "whitening",
  "cosmetic",
  "smile_makeover",
  "other",
];

const PAGE_SIZE = 25;

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireClinicAccess();
  const supabase = await createClient();

  const sp = await searchParams;
  const q =
    typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status =
    typeof sp.status === "string" &&
    VALID_STATUSES.includes(sp.status as LeadStatus)
      ? (sp.status as LeadStatus)
      : "";
  const treatment =
    typeof sp.treatment === "string" &&
    VALID_TREATMENTS.includes(sp.treatment as TreatmentType)
      ? (sp.treatment as TreatmentType)
      : "";
  const page =
    typeof sp.page === "string"
      ? Math.max(1, parseInt(sp.page) || 1)
      : 1;

  // Build the query
  let query = supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, treatment_type, status, source, created_at, updated_at",
      { count: "exact" }
    );

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (treatment) {
    query = query.eq("treatment_type", treatment);
  }

  const { data: leads, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (treatment) params.set("treatment", treatment);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/app/leads${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <span className="text-sm text-muted-foreground">
          {total === 0
            ? "No leads"
            : `${total} ${total === 1 ? "lead" : "leads"}`}
        </span>
      </div>

      {/* Filters */}
      <LeadFilters q={q} status={status} treatment={treatment} />

      {/* Table or empty state */}
      {!leads || leads.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          {q || status || treatment
            ? "No leads match your filters."
            : "No leads yet. Share your enquiry form link to start capturing leads."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <Th>Name</Th>
                  <Th>Treatment</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Created</Th>
                  <Th>Last updated</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/app/leads/${lead.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {lead.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.treatment_type
                        ? (TREATMENT_LABELS[lead.treatment_type] ??
                          lead.treatment_type)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status as LeadStatus} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {lead.source.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lead.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="rounded-md border border-input bg-background px-3 py-1.5 hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="rounded-md border border-input bg-background px-3 py-1.5 hover:bg-muted transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
      {children}
    </th>
  );
}
