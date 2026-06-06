"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { enquirySchema } from "@/lib/validations/enquiry";
import type { TreatmentType } from "@/types/database";

export type EnquiryState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: string };

/**
 * Processes a public patient enquiry.
 * Bound with clinicId before being passed to useActionState — the clinicId
 * comes from the server-rendered page and is re-validated against the DB inside
 * the action so a tampered value cannot write leads to the wrong clinic.
 *
 * Security: uses service-role admin client server-side only.
 * No PII is logged to the browser console.
 */
export async function submitEnquiryAction(
  clinicId: string,
  _prevState: EnquiryState,
  formData: FormData
): Promise<EnquiryState> {
  // Honeypot: bots fill the visually-hidden field; real users leave it blank.
  const honeypot = formData.get("hp_website");
  if (honeypot && String(honeypot).length > 0) {
    // Silently "succeed" so bots get no signal.
    return { status: "success" };
  }

  // Parse + validate
  const parsed = enquirySchema.safeParse({
    fullName:           formData.get("fullName")?.toString().trim()         || "",
    email:              formData.get("email")?.toString().trim()            || "",
    phone:              formData.get("phone")?.toString().trim()            || undefined,
    treatmentType:      formData.get("treatmentType")?.toString()          || undefined,
    preferredContact:   formData.get("preferredContact")?.toString()       || undefined,
    preferredTimeframe: formData.get("preferredTimeframe")?.toString()     || undefined,
    message:            formData.get("message")?.toString().trim()         || undefined,
    gdprConsent:        formData.get("gdprConsent") === "on",
    marketingConsent:   formData.get("marketingConsent") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Please check your answers and try again.",
    };
  }

  const {
    fullName,
    email,
    phone,
    treatmentType,
    preferredContact,
    preferredTimeframe,
    message,
    gdprConsent,
    marketingConsent,
  } = parsed.data;

  const admin = createAdminClient();

  // Re-validate the clinicId so a tampered bound argument can't write to the
  // wrong clinic.
  const { data: clinic } = await admin
    .from("clinics")
    .select("id, name, email")
    .eq("id", clinicId)
    .eq("is_active", true)
    .single();

  if (!clinic) {
    return { status: "error", error: "This clinic could not be found." };
  }

  // ── 1. Create the lead ────────────────────────────────────────────────────

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .insert({
      clinic_id:         clinic.id,
      full_name:         fullName,
      email,
      phone:             phone || null,
      treatment_type:    treatmentType as TreatmentType | undefined,
      message:           message || null,
      gdpr_consent:      gdprConsent,
      marketing_consent: marketingConsent,
      source:            "enquiry_form",
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    return {
      status: "error",
      error: "Could not submit your enquiry. Please try again.",
    };
  }

  // ── 2. Log lead_created activity (non-critical) ────────────────────────────

  try {
    await admin.from("lead_activity").insert({
      lead_id:       lead.id,
      clinic_id:     clinic.id,
      actor_id:      null,
      activity_type: "lead_created",
      description:   "Lead submitted via public enquiry form",
      metadata: {
        preferred_contact:   preferredContact   ?? null,
        preferred_timeframe: preferredTimeframe ?? null,
      },
    });
  } catch {
    // Non-critical — activity log failure must not block the submission.
  }

  // ── 3. Schedule follow-up tasks (non-critical) ─────────────────────────────

  try {
    const { data: allTemplates } = await admin
      .from("followup_templates")
      .select("id, delay_days, step_order, treatment_type")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("step_order");

    // Match templates that apply to this treatment OR apply to all treatments (NULL).
    const templates = (allTemplates ?? []).filter(
      (t) => t.treatment_type === null || t.treatment_type === treatmentType
    );

    if (templates.length > 0) {
      const now = new Date();
      let cumulativeDays = 0;
      const tasks = templates.map((t) => {
        cumulativeDays += t.delay_days;
        return {
          lead_id:       lead.id,
          clinic_id:     clinic.id,
          template_id:   t.id,
          scheduled_for: new Date(
            now.getTime() + cumulativeDays * 24 * 60 * 60 * 1000
          ).toISOString(),
        };
      });

      await admin.from("followup_tasks").insert(tasks);
    }
  } catch {
    // Non-critical — tasks will be picked up or rescheduled by the cron job.
  }

  // ── 4. Notify clinic via email (optional — requires RESEND_API_KEY) ────────

  try {
    await sendClinicNotification({
      clinicName:  clinic.name,
      clinicEmail: clinic.email,
      lead: { fullName, email, phone: phone ?? null, treatmentType: treatmentType ?? null, message: message ?? null },
    });
  } catch {
    // Non-critical — notification failure must not block the patient's submission.
  }

  return { status: "success" };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const TREATMENT_LABELS: Record<string, string> = {
  dental_implants: "Dental Implants",
  invisalign:      "Invisalign",
  whitening:       "Teeth Whitening",
  cosmetic:        "Cosmetic Dentistry",
  smile_makeover:  "Smile Makeover",
  other:           "Other",
};

async function sendClinicNotification({
  clinicName,
  clinicEmail,
  lead,
}: {
  clinicName: string;
  clinicEmail: string | null;
  lead: {
    fullName: string;
    email: string;
    phone: string | null;
    treatmentType: string | null;
    message: string | null;
  };
}) {
  const apiKey   = process.env.RESEND_API_KEY;
  const fromAddr = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromAddr || !clinicEmail) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const rows = [
    ["Name",      esc(lead.fullName)],
    ["Email",     esc(lead.email)],
    ["Phone",     lead.phone ? esc(lead.phone) : "Not provided"],
    ["Treatment", lead.treatmentType ? (TREATMENT_LABELS[lead.treatmentType] ?? lead.treatmentType) : "Not specified"],
    ...(lead.message ? [["Message", esc(lead.message)] as [string, string]] : []),
  ];

  const tableRows = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;white-space:nowrap">${k}</td><td style="padding:4px 0">${v}</td></tr>`)
    .join("\n");

  await resend.emails.send({
    from:    fromAddr,
    to:      clinicEmail,
    subject: `New enquiry from ${lead.fullName} — ${clinicName}`,
    html: `
<h2 style="margin:0 0 16px">New patient enquiry</h2>
<table style="border-collapse:collapse;font-size:14px">
${tableRows}
</table>
<p style="margin-top:24px;font-size:12px;color:#666;border-top:1px solid #eee;padding-top:12px">
  Sent by Dental PatientFlow AI &mdash; administrative notification only.<br>
  No clinical advice, diagnosis, or treatment recommendation has been provided to the patient.
</p>`.trim(),
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
