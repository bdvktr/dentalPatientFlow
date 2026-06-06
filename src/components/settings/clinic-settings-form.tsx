"use client";

import { useActionState, useRef } from "react";
import {
  saveClinicSettingsAction,
  type SettingsState,
} from "@/app/actions/settings";
import type { Clinic } from "@/types/database";

const TIMEZONES = [
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Europe/Dublin (GMT/IST)" },
];

export function ClinicSettingsForm({
  clinic,
  enquiryUrl,
}: {
  clinic: Clinic;
  enquiryUrl: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveClinicSettingsAction,
    { error: null, success: false }
  );

  const urlRef = useRef<HTMLInputElement>(null);

  function copyUrl() {
    navigator.clipboard.writeText(enquiryUrl).catch(() => {
      urlRef.current?.select();
      document.execCommand("copy");
    });
  }

  return (
    <form action={action} className="space-y-8">
      {/* ── Clinic details ──────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Clinic details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Clinic name" required>
            <input
              name="name"
              type="text"
              defaultValue={clinic.name}
              required
              maxLength={200}
              className="input"
            />
          </FormField>

          <FormField
            label="URL slug"
            hint="Used in your public enquiry form URL"
            required
          >
            <input
              name="slug"
              type="text"
              defaultValue={clinic.slug}
              required
              maxLength={60}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="input font-mono text-sm"
            />
          </FormField>

          <FormField label="Notification email" hint="Where enquiry alerts are sent">
            <input
              name="email"
              type="email"
              defaultValue={clinic.email ?? ""}
              className="input"
            />
          </FormField>

          <FormField label="Website">
            <input
              name="website"
              type="url"
              defaultValue={clinic.website ?? ""}
              placeholder="https://"
              className="input"
            />
          </FormField>

          <FormField label="Booking URL" hint="Direct booking link shown on enquiry success">
            <input
              name="booking_url"
              type="url"
              defaultValue={clinic.booking_url ?? ""}
              placeholder="https://"
              className="input"
            />
          </FormField>

          <FormField label="Privacy notice URL" hint="Linked from follow-up email footers">
            <input
              name="privacy_url"
              type="url"
              defaultValue={clinic.privacy_url ?? ""}
              placeholder="https://"
              className="input"
            />
          </FormField>

          <FormField label="Timezone">
            <select name="timezone" defaultValue={clinic.timezone} className="input">
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {/* ── Follow-up settings ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Automated follow-up</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="followup_enabled"
                type="checkbox"
                defaultChecked={clinic.followup_enabled}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">Enable automated follow-up emails</span>
                <span className="block text-muted-foreground mt-0.5">
                  When disabled, no follow-up emails will be sent to new enquiries.
                </span>
              </span>
            </label>
          </div>

          <FormField
            label="Data retention (days)"
            hint="Leads older than this become eligible for anonymisation"
          >
            <input
              name="retention_days"
              type="number"
              defaultValue={clinic.retention_days}
              min={30}
              max={3650}
              required
              className="input"
            />
          </FormField>
        </div>
      </section>

      {/* ── Public enquiry URL ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-1">Public enquiry form</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Share this URL with patients to receive consultation enquiries.
        </p>
        <div className="flex gap-2">
          <input
            ref={urlRef}
            type="text"
            readOnly
            value={enquiryUrl}
            className="input flex-1 font-mono text-xs bg-muted"
          />
          <button
            type="button"
            onClick={copyUrl}
            className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Copy
          </button>
        </div>
      </section>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Settings saved successfully.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
