"use client";

import { useActionState, useRef, useEffect } from "react";
import { addLeadNoteAction } from "@/app/actions/leads";

export function NoteForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    addLeadNoteAction.bind(null, leadId),
    { error: null, success: false }
  );

  // Clear textarea after a successful note submission
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <label htmlFor="note" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Add internal note
      </label>

      <textarea
        id="note"
        name="note"
        rows={3}
        placeholder="Add a note visible only to your team…"
        disabled={isPending}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 resize-none"
      />

      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      {state.success && (
        <p className="text-xs text-green-600">Note saved.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isPending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
