"use client";

import { useRef } from "react";
import Link from "next/link";
import { TREATMENT_OPTIONS } from "@/lib/validations/enquiry";
import type { LeadStatus } from "@/types/database";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "consultation_booked", label: "Booked" },
  { value: "treatment_started", label: "In Treatment" },
  { value: "lost", label: "Lost" },
  { value: "archived", label: "Archived" },
];

interface LeadFiltersProps {
  q: string;
  status: string;
  treatment: string;
}

export function LeadFilters({ q, status, treatment }: LeadFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => formRef.current?.requestSubmit();

  const hasFilters = q || status || treatment;

  return (
    <form
      ref={formRef}
      method="get"
      className="flex flex-wrap items-center gap-3"
    >
      {/* Search */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted transition-colors"
        >
          Search
        </button>
      </div>

      {/* Status filter */}
      <select
        name="status"
        defaultValue={status}
        onChange={submit}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Treatment filter */}
      <select
        name="treatment"
        defaultValue={treatment}
        onChange={submit}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All treatments</option>
        {TREATMENT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Clear */}
      {hasFilters && (
        <Link
          href="/app/leads"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Clear filters
        </Link>
      )}
    </form>
  );
}
