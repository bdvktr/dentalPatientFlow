"use client";

import { useActionState, useState } from "react";
import {
  saveTemplateAction,
  type TemplateState,
} from "@/app/actions/settings";
import { buildFollowupEmailHtml } from "@/lib/email/followup-email";
import type { FollowupTemplate, TreatmentType } from "@/types/database";

const TREATMENT_LABELS: Record<TreatmentType, string> = {
  dental_implants: "Dental Implants",
  invisalign: "Invisalign",
  whitening: "Whitening",
  cosmetic: "Cosmetic Dentistry",
  smile_makeover: "Smile Makeover",
  other: "Other",
};

export function TemplateForm({
  templateId,
  template,
  clinicName,
  clinicEmail,
}: {
  templateId: string;
  template?: FollowupTemplate;
  clinicName: string;
  clinicEmail: string | null;
}) {
  const boundAction = saveTemplateAction.bind(null, templateId);
  const [state, action, pending] = useActionState<TemplateState, FormData>(
    boundAction,
    { error: null }
  );

  const [bodyHtml, setBodyHtml] = useState(
    template?.body_html ?? "<p>Dear {{lead_name}},</p>\n<p>Thank you for your enquiry. We would love to help you.</p>"
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const previewHtml = buildFollowupEmailHtml({
    clinicName,
    bodyHtml,
    patientFirstName: "Jane",
    clinicEmail,
  });

  const isNew = templateId === "new";

  return (
    <form action={action} className="space-y-6">
      {/* ── Basic fields ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium">
            Template name <span className="text-destructive">*</span>
          </label>
          <input
            name="name"
            type="text"
            defaultValue={template?.name ?? ""}
            required
            maxLength={100}
            placeholder="e.g. 3-day follow-up"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium">
            Email subject <span className="text-destructive">*</span>
          </label>
          <input
            name="subject"
            type="text"
            defaultValue={template?.subject ?? ""}
            required
            maxLength={200}
            placeholder="e.g. Following up on your dental enquiry"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Treatment type</label>
          <p className="text-xs text-muted-foreground">
            Leave blank to apply to all enquiries
          </p>
          <select
            name="treatment_type"
            defaultValue={template?.treatment_type ?? ""}
            className="input"
          >
            <option value="">All treatments</option>
            {(Object.keys(TREATMENT_LABELS) as TreatmentType[]).map((t) => (
              <option key={t} value={t}>
                {TREATMENT_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Delay (days after enquiry) <span className="text-destructive">*</span>
          </label>
          <input
            name="delay_days"
            type="number"
            defaultValue={template?.delay_days ?? 3}
            min={0}
            max={365}
            required
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Step order <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Controls the order in multi-step sequences
          </p>
          <input
            name="step_order"
            type="number"
            defaultValue={template?.step_order ?? 1}
            min={1}
            max={99}
            required
            className="input"
          />
        </div>

        <div className="flex items-start gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={template?.is_active ?? true}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium">Active</span>
            <span className="block text-muted-foreground text-xs mt-0.5">
              Inactive templates are skipped during send
            </span>
          </span>
        </div>
      </div>

      {/* ── Email body with live preview ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Email body (HTML) <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                activeTab === "edit"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Use <code className="rounded bg-muted px-1 font-mono text-xs">{"{{lead_name}}"}</code> to insert the patient&apos;s first name.
        </p>

        {activeTab === "edit" ? (
          <textarea
            name="body_html"
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={12}
            required
            minLength={10}
            maxLength={10000}
            className="input resize-y font-mono text-sm leading-relaxed"
          />
        ) : (
          <>
            {/* Hidden input so form data is always submitted */}
            <textarea
              name="body_html"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="sr-only"
              aria-hidden="true"
              readOnly
            />
            <div className="overflow-hidden rounded-md border border-border bg-muted/30">
              <p className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
                Preview — sample patient: Jane
              </p>
              <iframe
                srcDoc={previewHtml}
                title="Email preview"
                className="w-full border-0"
                style={{ height: "480px" }}
                sandbox="allow-same-origin"
              />
            </div>
          </>
        )}
      </div>

      {/* ── Feedback ────────────────────────────────────────────────────────── */}
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Template saved.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : isNew ? "Create template" : "Save template"}
        </button>
      </div>
    </form>
  );
}
