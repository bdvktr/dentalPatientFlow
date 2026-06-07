import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityType, MessageEventType } from "@/types/database";

// Resend webhook event types we handle.
// email.sent is intentionally omitted — the cron already records it.
const SUPPORTED_EVENTS = new Set([
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.complained",
  "email.opened",
  "email.clicked",
  "email.failed",
]);

const MESSAGE_EVENT_MAP: Record<string, MessageEventType> = {
  "email.delivered": "email_delivered",
  "email.delivery_delayed": "email_delivery_delayed",
  "email.bounced": "email_bounced",
  "email.complained": "email_complained",
  "email.opened": "email_opened",
  "email.clicked": "email_clicked",
  "email.failed": "email_failed",
};

const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  "email.delivered": "email_delivered",
  "email.delivery_delayed": "email_delivery_delayed",
  "email.bounced": "email_bounced",
  "email.complained": "email_complained",
  "email.opened": "email_opened",
  "email.clicked": "email_clicked",
  "email.failed": "email_failed",
};

const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  "email.delivered": "Email delivered",
  "email.delivery_delayed": "Email delivery delayed",
  "email.bounced": "Email bounced",
  "email.complained": "Email marked as spam complaint",
  "email.opened": "Email opened",
  "email.clicked": "Email link clicked",
  "email.failed": "Email failed",
};

// Maximum age of a webhook event (5 minutes) — matches Svix default tolerance.
const MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Verifies a Resend/Svix webhook signature using HMAC-SHA256.
 *
 * Svix signs the message as: "{svix-id}.{svix-timestamp}.{raw_body}"
 * The webhook secret has the format "whsec_<base64>" — the prefix is stripped
 * before use. Multiple signatures in svix-signature are checked in order
 * (Svix rotates keys by sending several).
 */
function verifySignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Reject stale or future-dated events to prevent replay attacks
  const timestampMs = parseInt(svixTimestamp, 10) * 1000;
  if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_AGE_MS) {
    return false;
  }

  // Strip the "whsec_" prefix and decode the secret
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const message = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedSig = createHmac("sha256", secretBytes).update(message).digest("base64");
  const expectedBuf = Buffer.from(expectedSig, "base64");

  // svix-signature may contain several space-separated "v1,<sig>" entries
  return svixSignature.split(" ").some((part) => {
    const [version, sigValue] = part.split(",");
    if (version !== "v1" || !sigValue) return false;
    try {
      return timingSafeEqual(Buffer.from(sigValue, "base64"), expectedBuf);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  // ── Env check ─────────────────────────────────────────────────────────────────
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      // Fail closed in production — webhook is unusable without a signing secret
      console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET is not set.");
      return Response.json({ error: "Webhook not configured." }, { status: 503 });
    }
    // Development: warn and continue without signature verification
    console.warn("[webhooks/resend] RESEND_WEBHOOK_SECRET not set — skipping signature verification.");
  }

  // ── Read raw body before any other parsing ───────────────────────────────────
  const rawBody = await request.text();

  // ── Verify Resend/Svix signature ─────────────────────────────────────────────
  let providerEventId: string | null = null;

  if (webhookSecret) {
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return Response.json({ error: "Missing webhook signature headers." }, { status: 400 });
    }

    const valid = verifySignature(rawBody, svixId, svixTimestamp, svixSignature, webhookSecret);
    if (!valid) {
      return Response.json({ error: "Invalid signature." }, { status: 401 });
    }

    providerEventId = svixId;
  } else {
    providerEventId = request.headers.get("svix-id");
  }

  // ── Parse verified payload ────────────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Invalid payload structure." }, { status: 400 });
  }

  const evt = payload as Record<string, unknown>;
  const eventType = typeof evt.type === "string" ? evt.type : null;
  const data =
    evt.data && typeof evt.data === "object"
      ? (evt.data as Record<string, unknown>)
      : null;

  if (!eventType || !data) {
    return Response.json({ error: "Missing event type or data." }, { status: 400 });
  }

  // Acknowledge unsupported event types (email.sent, unknown) without error
  if (!SUPPORTED_EVENTS.has(eventType)) {
    return Response.json({ received: true, eventType, matched: false, deduplicated: false });
  }

  // ── Extract safe fields — no PII (no recipient address, IP, or user-agent) ──
  const emailId = typeof data.email_id === "string" ? data.email_id : null;
  const occurredAt =
    typeof data.created_at === "string" ? data.created_at : new Date().toISOString();

  // Clicked URL — shown in the clinic UI for context (booking links, etc.)
  let clickedUrl: string | null = null;
  if (eventType === "email.clicked" && data.click && typeof data.click === "object") {
    const click = data.click as Record<string, unknown>;
    if (typeof click.link === "string") {
      clickedUrl = click.link;
    }
  }

  // Bounce subtype for diagnostics — contains no email addresses
  let bounceSubtype: string | null = null;
  if (
    (eventType === "email.bounced" || eventType === "email.failed") &&
    data.bounce &&
    typeof data.bounce === "object"
  ) {
    const bounce = data.bounce as Record<string, unknown>;
    if (typeof bounce.subtype === "string") bounceSubtype = bounce.subtype;
  }

  const safeMetadata: Record<string, string> = { provider_event_type: eventType };
  if (emailId) safeMetadata.email_id = emailId;
  if (bounceSubtype) safeMetadata.bounce_subtype = bounceSubtype;

  const messageEventType = MESSAGE_EVENT_MAP[eventType]!;
  const admin = createAdminClient();

  // ── Deduplication — check provider_event_id before inserting ─────────────────
  if (providerEventId) {
    const { data: existing } = await admin
      .from("message_events")
      .select("id")
      .eq("provider_event_id", providerEventId)
      .maybeSingle();

    if (existing) {
      return Response.json({ received: true, eventType, matched: true, deduplicated: true });
    }
  }

  // ── Match to an existing sent-email record ────────────────────────────────────
  // The cron stores resend_email_id when sending. Resend includes the same id in
  // all subsequent lifecycle events — use it to find the lead and clinic.
  if (!emailId) {
    return Response.json({ received: true, eventType, matched: false, deduplicated: false });
  }

  const { data: sentEvent } = await admin
    .from("message_events")
    .select("lead_id, clinic_id, followup_task_id")
    .eq("resend_email_id", emailId)
    .eq("event_type", "email_sent")
    .maybeSingle();

  if (!sentEvent) {
    // Email not sent through this system, or sent before this migration was applied
    return Response.json({ received: true, eventType, matched: false, deduplicated: false });
  }

  // GDPR: skip persistence for anonymised leads
  const { data: lead } = await admin
    .from("leads")
    .select("anonymised_at")
    .eq("id", sentEvent.lead_id)
    .maybeSingle();

  if (!lead || lead.anonymised_at) {
    return Response.json({ received: true, eventType, matched: false, deduplicated: false });
  }

  // ── Insert message_events row ─────────────────────────────────────────────────
  const { error: insertError } = await admin.from("message_events").insert({
    lead_id: sentEvent.lead_id,
    clinic_id: sentEvent.clinic_id,
    followup_task_id: sentEvent.followup_task_id ?? null,
    event_type: messageEventType,
    resend_email_id: emailId,
    provider_event_id: providerEventId,
    clicked_url: clickedUrl,
    metadata: safeMetadata,
    occurred_at: occurredAt,
  });

  if (insertError) {
    // 23505 = unique constraint — race condition duplicate
    if ((insertError as { code?: string }).code === "23505") {
      return Response.json({ received: true, eventType, matched: true, deduplicated: true });
    }
    console.error("[webhooks/resend] Failed to insert message_event:", insertError.message);
    return Response.json({ error: "Failed to record event." }, { status: 500 });
  }

  // ── Lead activity entry (non-critical) ───────────────────────────────────────
  const activityType = ACTIVITY_TYPE_MAP[eventType]!;
  const baseDescription = ACTIVITY_DESCRIPTIONS[eventType]!;
  const description =
    eventType === "email.clicked" && clickedUrl
      ? `${baseDescription} — ${clickedUrl}`
      : baseDescription;

  try {
    await admin.from("lead_activity").insert({
      lead_id: sentEvent.lead_id,
      clinic_id: sentEvent.clinic_id,
      actor_id: null,
      activity_type: activityType,
      description,
      metadata: safeMetadata,
    });
  } catch { /* non-critical — message_events row is already persisted */ }

  return Response.json({ received: true, eventType, matched: true, deduplicated: false });
}
