// Pure metric computation — no server-only imports.

export const TREATMENT_LABELS: Record<string, string> = {
  dental_implants: "Dental Implants",
  invisalign: "Invisalign",
  whitening: "Whitening",
  cosmetic: "Cosmetic Dentistry",
  smile_makeover: "Smile Makeover",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  consultation_booked: "Booked",
  treatment_started: "In Treatment",
  lost: "Lost",
  archived: "Archived",
};

export interface BarEntry {
  label: string;
  value: number;
}

export interface WeekEntry {
  isoWeek: string;   // "2024-W23"
  weekLabel: string; // "Jun 2"
  count: number;
}

export interface ReportMetrics {
  totalLeads: number;
  booked: number;
  lost: number;
  conversionRate: number;
  emailsSent: number;
  byTreatment: BarEntry[];
  byStatus: BarEntry[];
  bySource: BarEntry[];
  weeklyTrend: WeekEntry[];
}

type LeadRow = {
  status: string;
  treatment_type: string | null;
  source: string;
  created_at: string;
};

// Returns the ISO week key, e.g. "2024-W23".
function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Returns the Monday of the week containing dateStr (YYYY-MM-DD).
function mondayOf(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function computeMetrics(
  leads: LeadRow[],
  emailsSent: number,
  fromDate: string,
  toDate: string
): ReportMetrics {
  const totalLeads = leads.length;

  const booked = leads.filter(
    (l) => l.status === "consultation_booked" || l.status === "treatment_started"
  ).length;

  const lost = leads.filter((l) => l.status === "lost").length;
  const conversionRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0;

  // ── Group by treatment ───────────────────────────────────────────────────────
  const tMap: Record<string, number> = {};
  for (const l of leads) {
    const k = l.treatment_type ?? "unknown";
    tMap[k] = (tMap[k] ?? 0) + 1;
  }
  const byTreatment = Object.entries(tMap)
    .map(([k, v]) => ({ label: TREATMENT_LABELS[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  // ── Group by status ──────────────────────────────────────────────────────────
  const sMap: Record<string, number> = {};
  for (const l of leads) {
    sMap[l.status] = (sMap[l.status] ?? 0) + 1;
  }
  const byStatus = Object.entries(sMap)
    .map(([k, v]) => ({ label: STATUS_LABELS[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  // ── Group by source ──────────────────────────────────────────────────────────
  const srcMap: Record<string, number> = {};
  for (const l of leads) {
    srcMap[l.source] = (srcMap[l.source] ?? 0) + 1;
  }
  const bySource = Object.entries(srcMap)
    .map(([k, v]) => ({ label: k, value: v }))
    .sort((a, b) => b.value - a.value);

  // ── Weekly trend (one entry per calendar week in range) ──────────────────────
  const weekMap = new Map<string, WeekEntry>();
  const cursor = mondayOf(fromDate);
  const endMonday = mondayOf(toDate);

  while (cursor <= endMonday) {
    const key = isoWeekKey(cursor.toISOString().slice(0, 10));
    weekMap.set(key, { isoWeek: key, weekLabel: formatShortDate(cursor), count: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  for (const l of leads) {
    const key = isoWeekKey(l.created_at);
    const entry = weekMap.get(key);
    if (entry) entry.count++;
  }

  return {
    totalLeads,
    booked,
    lost,
    conversionRate,
    emailsSent,
    byTreatment,
    byStatus,
    bySource,
    weeklyTrend: Array.from(weekMap.values()),
  };
}
