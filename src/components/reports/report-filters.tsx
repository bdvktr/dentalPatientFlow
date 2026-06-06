"use client";

import { useState } from "react";
import type { TreatmentType } from "@/types/database";
import { TREATMENT_LABELS } from "@/lib/reports/queries";

const TREATMENTS = Object.keys(TREATMENT_LABELS) as TreatmentType[];

export function ReportFilters({
  from,
  to,
  treatment,
  source,
  sources,
}: {
  from: string;
  to: string;
  treatment: string;
  source: string;
  sources: string[];
}) {
  const [vals, setVals] = useState({ from, to, treatment, source });

  const set = (key: keyof typeof vals) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setVals((prev) => ({ ...prev, [key]: e.target.value }));

  const exportParams = new URLSearchParams({
    from: vals.from,
    to: vals.to,
    ...(vals.treatment ? { treatment: vals.treatment } : {}),
    ...(vals.source ? { source: vals.source } : {}),
  });

  return (
    <form method="GET" action="/app/reports" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <input
          name="from"
          type="date"
          value={vals.from}
          onChange={set("from")}
          className="input w-36"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <input
          name="to"
          type="date"
          value={vals.to}
          onChange={set("to")}
          className="input w-36"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Treatment</label>
        <select name="treatment" value={vals.treatment} onChange={set("treatment")} className="input w-44">
          <option value="">All treatments</option>
          {TREATMENTS.map((t) => (
            <option key={t} value={t}>
              {TREATMENT_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {sources.length > 1 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <select name="source" value={vals.source} onChange={set("source")} className="input w-40">
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Apply
        </button>

        <a
          href={`/api/reports/export-csv?${exportParams.toString()}`}
          download
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Export CSV
        </a>
      </div>
    </form>
  );
}
