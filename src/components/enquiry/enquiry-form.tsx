"use client";

import { useActionState } from "react";
import { submitEnquiryAction, type EnquiryState } from "@/app/actions/enquiry";
import {
  TREATMENT_OPTIONS,
  CONTACT_OPTIONS,
  TIMEFRAME_OPTIONS,
} from "@/lib/validations/enquiry";

interface EnquiryFormProps {
  clinicId: string;
  clinicName: string;
  bookingUrl?: string;
}

const INITIAL_STATE: EnquiryState = { status: "idle" };

export function EnquiryForm({ clinicId, clinicName, bookingUrl }: EnquiryFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitEnquiryAction.bind(null, clinicId),
    INITIAL_STATE
  );

  // ── Success state ────────────────────────────────────────────────────────────
  if (state.status === "success") {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
          ✓
        </div>
        <div>
          <h2 className="text-lg font-semibold">Enquiry received</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thank you for contacting {clinicName}. A member of our team will
            be in touch shortly to arrange a convenient time.
          </p>
        </div>
        {bookingUrl ? (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Book your consultation →
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            The clinic team will contact you soon.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          If you have an urgent query please call the clinic directly.
        </p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <form action={formAction} className="space-y-5 p-8">
      {/* Honeypot — hidden from real users; bots fill it in */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
      >
        <label htmlFor="hp_website">Leave this blank</label>
        <input
          type="text"
          id="hp_website"
          name="hp_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Error banner */}
      {state.status === "error" && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Full name */}
      <FormField id="fullName" label="Full name" required>
        <input
          type="text"
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          placeholder="Jane Smith"
          disabled={isPending}
          className={inputClass}
        />
      </FormField>

      {/* Email */}
      <FormField id="email" label="Email address" required>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          placeholder="jane@example.com"
          disabled={isPending}
          className={inputClass}
        />
      </FormField>

      {/* Phone */}
      <FormField id="phone" label="Phone number" hint="Optional">
        <input
          type="tel"
          id="phone"
          name="phone"
          autoComplete="tel"
          placeholder="+44 7700 000000"
          disabled={isPending}
          className={inputClass}
        />
      </FormField>

      {/* Treatment interest */}
      <FormField id="treatmentType" label="Treatment of interest" hint="Optional">
        <select
          id="treatmentType"
          name="treatmentType"
          disabled={isPending}
          className={inputClass}
          defaultValue=""
        >
          <option value="">Select a treatment…</option>
          {TREATMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Preferred contact method */}
      <FormField id="preferredContact" label="Preferred contact method" hint="Optional">
        <select
          id="preferredContact"
          name="preferredContact"
          disabled={isPending}
          className={inputClass}
          defaultValue=""
        >
          <option value="">No preference</option>
          {CONTACT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Preferred timeframe */}
      <FormField id="preferredTimeframe" label="Preferred timeframe" hint="Optional">
        <select
          id="preferredTimeframe"
          name="preferredTimeframe"
          disabled={isPending}
          className={inputClass}
          defaultValue=""
        >
          <option value="">No preference</option>
          {TIMEFRAME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Message */}
      <FormField id="message" label="Additional details" hint="Optional">
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="Anything you'd like us to know before we get in touch…"
          disabled={isPending}
          className={`${inputClass} resize-none`}
        />
      </FormField>

      {/* GDPR consent — required */}
      <div className="space-y-3 pt-1">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="gdprConsent"
            name="gdprConsent"
            required
            disabled={isPending}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
          />
          <label htmlFor="gdprConsent" className="text-sm text-muted-foreground leading-relaxed">
            I consent to this clinic storing my enquiry details and contacting
            me about my request in line with their privacy policy.{" "}
            <span className="text-destructive" aria-hidden="true">*</span>
          </label>
        </div>

        {/* Marketing consent — optional */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="marketingConsent"
            name="marketingConsent"
            disabled={isPending}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
          />
          <label htmlFor="marketingConsent" className="text-sm text-muted-foreground leading-relaxed">
            I&apos;d like to receive occasional news and offers from this clinic.
          </label>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isPending ? "Sending…" : "Send enquiry"}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        <span className="text-destructive">*</span> Required field
      </p>
    </form>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            {" "}*
          </span>
        )}
        {hint && (
          <span className="ml-1 font-normal text-muted-foreground">
            ({hint})
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60";
