import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildFollowupEmailHtml } from "@/lib/email/followup-email";

// Daily schedule (vercel.json: "0 9 * * *") is for Vercel Hobby/demo only.
// Use more frequent scheduling (hourly or every 15 min) before production.
// See README → "Vercel Cron on Hobby plan" for upgrade options.

// Number of tasks processed per cron invocation.
// Keeps each run well within Vercel's function timeout limits.
const BATCH_SIZE = 50;

// Lead statuses that should never receive further emails.
const TERMINAL_STATUSES = new Set([
  "consultation_booked",
  "treatment_started",
  "lost",
  "archived",
]);

export async function GET(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Resend config check ───────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    return NextResponse.json(
      {
        message: "Resend is not configured — no emails sent.",
        sent: 0,
        failed: 0,
        skipped: 0,
      },
      { status: 200 }
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // ── Fetch due tasks ───────────────────────────────────────────────────────────
  const { data: tasks, error: fetchError } = await admin
    .from("followup_tasks")
    .select("id, lead_id, clinic_id, template_id, scheduled_for")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for")
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("[cron/send-followups] fetch error:", fetchError.message);
    return NextResponse.json(
      { error: "Failed to fetch tasks from database." },
      { status: 500 }
    );
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: "No tasks due.", sent: 0, failed: 0, skipped: 0 });
  }

  // ── Batch-fetch related records ───────────────────────────────────────────────
  const leadIds = [...new Set(tasks.map((t) => t.lead_id))];
  const clinicIds = [...new Set(tasks.map((t) => t.clinic_id))];
  const templateIds = [
    ...new Set(tasks.filter((t) => t.template_id).map((t) => t.template_id!)),
  ];

  const [leadsResult, clinicsResult] = await Promise.all([
    admin
      .from("leads")
      .select("id, full_name, email, status, anonymised_at, clinic_id")
      .in("id", leadIds),
    admin
      .from("clinics")
      .select("id, name, email, is_active, followup_enabled")
      .in("id", clinicIds),
  ]);

  type TemplateRow = {
    id: string;
    name: string;
    subject: string;
    body_html: string;
    is_active: boolean;
  };

  let templatesMap: Record<string, TemplateRow> = {};

  if (templateIds.length > 0) {
    const { data: tplData } = await admin
      .from("followup_templates")
      .select("id, name, subject, body_html, is_active")
      .in("id", templateIds);

    if (tplData) {
      templatesMap = Object.fromEntries(tplData.map((t) => [t.id, t]));
    }
  }

  const leadsMap = Object.fromEntries(
    (leadsResult.data ?? []).map((l) => [l.id, l])
  );
  const clinicsMap = Object.fromEntries(
    (clinicsResult.data ?? []).map((c) => [c.id, c])
  );

  // ── Initialise Resend ─────────────────────────────────────────────────────────
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  // ── Process tasks ─────────────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const task of tasks) {
    const lead = leadsMap[task.lead_id];
    const clinic = clinicsMap[task.clinic_id];
    const template = task.template_id ? templatesMap[task.template_id] : null;

    // ── Skip / cancel conditions ─────────────────────────────────────────────

    if (!lead || !clinic) {
      await admin
        .from("followup_tasks")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: "lead_or_clinic_not_found",
        })
        .eq("id", task.id);
      skipped++;
      continue;
    }

    if (TERMINAL_STATUSES.has(lead.status) || lead.anonymised_at !== null) {
      // DB trigger should already have cancelled this — defence-in-depth
      await admin
        .from("followup_tasks")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: `lead_closed:${lead.status}`,
        })
        .eq("id", task.id);
      skipped++;
      continue;
    }

    if (!clinic.is_active || !clinic.followup_enabled) {
      skipped++;
      continue;
    }

    if (!template || !template.is_active) {
      await admin
        .from("followup_tasks")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: "template_missing_or_inactive",
        })
        .eq("id", task.id);
      skipped++;
      continue;
    }

    // ── Send email ────────────────────────────────────────────────────────────

    try {
      const patientFirstName =
        lead.full_name.split(/\s+/)[0] || lead.full_name;

      const html = buildFollowupEmailHtml({
        clinicName: clinic.name,
        bodyHtml: template.body_html,
        patientFirstName,
        clinicEmail: clinic.email,
      });

      const result = await resend.emails.send({
        from: fromEmail,
        to: lead.email,
        subject: template.subject,
        html,
      });

      if (result.error || !result.data) {
        throw new Error(
          result.error?.message ?? "Resend returned an empty response"
        );
      }

      const resendEmailId = result.data.id;

      // Atomic update: only marks sent if still pending (idempotency guard)
      const { data: updated } = await admin
        .from("followup_tasks")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", task.id)
        .eq("status", "pending")
        .select("id");

      if (!updated || updated.length === 0) {
        // Another process already handled this task — avoid duplicate records
        skipped++;
        continue;
      }

      // Record message event (non-critical)
      try {
        await admin.from("message_events").insert({
          followup_task_id: task.id,
          lead_id: lead.id,
          clinic_id: clinic.id,
          event_type: "email_sent",
          resend_email_id: resendEmailId,
          metadata: { template_name: template.name },
        });
      } catch { /* non-critical */ }

      // Record activity log (non-critical)
      try {
        await admin.from("lead_activity").insert({
          lead_id: lead.id,
          clinic_id: clinic.id,
          actor_id: null,
          activity_type: "email_sent",
          description: `Follow-up email sent: "${template.name}"`,
          metadata: {
            template_id: task.template_id,
            resend_email_id: resendEmailId,
          },
        });
      } catch { /* non-critical */ }

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`task ${task.id}: ${msg}`);

      // Mark failed — only if still pending (another process may have succeeded)
      await admin
        .from("followup_tasks")
        .update({ status: "failed" })
        .eq("id", task.id)
        .eq("status", "pending");

      // Record failure in activity log (non-critical)
      try {
        await admin.from("lead_activity").insert({
          lead_id: task.lead_id,
          clinic_id: task.clinic_id,
          actor_id: null,
          activity_type: "email_failed",
          description: `Follow-up email failed: "${template?.name ?? "unknown template"}"`,
          metadata: { task_id: task.id, error: msg },
        });
      } catch { /* non-critical */ }

      failed++;
    }
  }

  // ── Summary response ──────────────────────────────────────────────────────────
  return NextResponse.json({
    processed: tasks.length,
    sent,
    failed,
    skipped,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
