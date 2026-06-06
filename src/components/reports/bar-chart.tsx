import type { BarEntry, WeekEntry } from "@/lib/reports/queries";

export function BarChart({ data }: { data: BarEntry[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data for this period.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2.5">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span
            className="w-36 shrink-0 truncate text-right text-xs text-muted-foreground"
            title={label}
          >
            {label}
          </span>
          <div className="flex-1 overflow-hidden rounded bg-muted h-5">
            <div
              className="h-full rounded bg-primary/75 transition-all"
              style={{ width: `${Math.max(Math.round((value / max) * 100), 2)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function WeeklyBarChart({ data }: { data: WeekEntry[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data for this period.</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1" style={{ minWidth: `${data.length * 48}px`, height: "120px" }}>
        {data.map(({ isoWeek, weekLabel, count }) => (
          <div key={isoWeek} className="flex flex-1 flex-col items-center gap-1">
            {count > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
            )}
            <div
              className="w-full rounded-sm bg-primary/75 transition-all"
              style={{
                height: `${Math.max(Math.round((count / max) * 80), count > 0 ? 4 : 0)}px`,
              }}
              title={`${weekLabel}: ${count} lead${count === 1 ? "" : "s"}`}
            />
            <span
              className="text-center text-muted-foreground"
              style={{ fontSize: "10px", lineHeight: "1.2" }}
            >
              {weekLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
