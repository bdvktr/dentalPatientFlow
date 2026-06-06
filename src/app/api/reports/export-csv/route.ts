import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TreatmentType, LeadStatus } from "@/types/database";

const TREATMENT_LABELS: Record<TreatmentType, string> = {
  dental_implants: "Dental Implants",
  invisalign: "Invisalign",
  whitening: "Whitening",
  cosmetic: "Cosmetic Dentistry",
  smile_makeover: "Smile Makeover",
  other: "Other",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  consultation_booked: "Consultation Booked",
  treatment_started: "Treatment Started",
  lost: "Lost",
  archived: "Archived",
};

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function GET(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clinicId = user.profile.clinic_id;
  if (!clinicId) {
    // platform_owner with no clinic cannot export (no clinic context)
    return new Response("No clinic associated with this account", { status: 403 });
  }

  // ── Parse filters ─────────────────────────────────────────────────────────────
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || monthStartStr();
  const to = url.searchParams.get("to") || todayStr();
  const treatment = url.searchParams.get("treatment") || "";
  const source = url.searchParams.get("source") || "";

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;

  // ── Query leads ───────────────────────────────────────────────────────────────
  const admin = createAdminClient();

  let query = admin
    .from("leads")
    .select("id, full_name, email, phone, treatment_type, status, source, booked_at, created_at")
    .eq("clinic_id", clinicId)           // clinic-level ownership
    .is("anonymised_at", null)           // never export anonymised PII
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false });

  if (treatment) query = query.eq("treatment_type", treatment as import("@/types/database").TreatmentType);
  if (source) query = query.eq("source", source);

  const { data: leads, error } = await query;

  if (error) {
    return new Response("Failed to fetch leads", { status: 500 });
  }

  // ── Build CSV ─────────────────────────────────────────────────────────────────
  const header = csvRow([
    "ID",
    "Full Name",
    "Email",
    "Phone",
    "Treatment",
    "Status",
    "Source",
    "Booked At",
    "Created At",
  ]);

  const rows = (leads ?? []).map((l) =>
    csvRow([
      l.id,
      l.full_name,
      l.email,
      l.phone,
      l.treatment_type ? (TREATMENT_LABELS[l.treatment_type] ?? l.treatment_type) : "",
      l.status ? (STATUS_LABELS[l.status] ?? l.status) : "",
      l.source,
      l.booked_at ? l.booked_at.slice(0, 16).replace("T", " ") : "",
      l.created_at ? l.created_at.slice(0, 16).replace("T", " ") : "",
    ])
  );

  const csv = [header, ...rows].join("\r\n");
  const filename = `leads-${from}-to-${to}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
