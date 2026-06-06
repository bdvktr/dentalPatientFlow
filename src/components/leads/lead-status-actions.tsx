"use client";

import { useActionState } from "react";
import {
  updateLeadStatusAction,
  anonymizeLeadAction,
  type LeadActionState,
} from "@/app/actions/leads";
import type { LeadStatus } from "@/types/database";

interface LeadStatusActionsProps {
  leadId: string;
  currentStatus: LeadStatus;
  anonymisedAt: string | null;
  canAnonymize: boolean;
}

export function LeadStatusActions({
  leadId,
  currentStatus,
  anonymisedAt,
  canAnonymize,
}: LeadStatusActionsProps) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateLeadStatusAction.bind(null, leadId),
    { error: null }
  );

  const [anonState, anonAction, anonPending] = useActionState(
    anonymizeLeadAction.bind(null, leadId),
    { error: null }
  );

  const isAnonymised = anonymisedAt !== null;
  const isTerminal = currentStatus === "archived" || isAnonymised;

  return (
    <div className="space-y-4">
      {/* Status change buttons */}
      {!isAnonymised && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Update status
          </p>

          {statusState.error && (
            <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {statusState.error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {currentStatus !== "contacted" && !isTerminal && (
              <StatusButton
                formAction={statusAction}
                newStatus="contacted"
                label="Mark Contacted"
                pending={statusPending}
                variant="secondary"
              />
            )}

            {currentStatus !== "consultation_booked" && !isTerminal && (
              <StatusButton
                formAction={statusAction}
                newStatus="consultation_booked"
                label="Mark Booked"
                pending={statusPending}
                variant="primary"
              />
            )}

            {currentStatus === "consultation_booked" && (
              <StatusButton
                formAction={statusAction}
                newStatus="treatment_started"
                label="Mark Treatment Started"
                pending={statusPending}
                variant="secondary"
              />
            )}

            {currentStatus !== "lost" && !isTerminal && (
              <StatusButton
                formAction={statusAction}
                newStatus="lost"
                label="Mark Lost"
                pending={statusPending}
                variant="destructive"
              />
            )}

            {currentStatus !== "archived" && (
              <StatusButton
                formAction={statusAction}
                newStatus="archived"
                label="Archive"
                pending={statusPending}
                variant="ghost"
              />
            )}
          </div>
        </div>
      )}

      {/* Anonymise */}
      {canAnonymize && !isAnonymised && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
          <p className="mb-1 text-xs font-medium text-destructive">Danger zone</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Permanently removes all patient PII from the database. This cannot
            be undone.
          </p>

          {anonState.error && (
            <p className="mb-2 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {anonState.error}
            </p>
          )}

          <form action={anonAction}>
            <button
              type="submit"
              disabled={anonPending}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {anonPending ? "Anonymising…" : "Anonymise lead"}
            </button>
          </form>
        </div>
      )}

      {isAnonymised && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          This lead has been anonymised. PII has been removed.
        </p>
      )}
    </div>
  );
}

function StatusButton({
  formAction,
  newStatus,
  label,
  pending,
  variant,
}: {
  formAction: (payload: FormData) => void;
  newStatus: LeadStatus;
  label: string;
  pending: boolean;
  variant: "primary" | "secondary" | "destructive" | "ghost";
}) {
  const classes = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90",
    secondary:
      "border border-input bg-background hover:bg-muted",
    destructive:
      "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
    ghost:
      "border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
  }[variant];

  return (
    <form action={formAction}>
      <input type="hidden" name="newStatus" value={newStatus} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${classes}`}
      >
        {label}
      </button>
    </form>
  );
}
