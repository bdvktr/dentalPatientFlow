import type { LeadStatus } from "@/types/database";

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  contacted: {
    label: "Contacted",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  consultation_booked: {
    label: "Booked",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  treatment_started: {
    label: "In Treatment",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  lost: {
    label: "Lost",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function statusLabel(status: LeadStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}
