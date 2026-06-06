import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TreatmentType } from "@/types/database";

const SYSTEM_PROMPT =
  "You are an administrative assistant for a private dental clinic. " +
  "You help draft safe, non-clinical replies to patient enquiries. " +
  "Never diagnose. Never recommend treatment. Never discuss medical suitability. " +
  "Never provide pricing guarantees. Always encourage booking a consultation with the clinic team. " +
  "Keep replies warm, professional, and concise.";

const TREATMENT_LABELS: Record<TreatmentType, string> = {
  dental_implants: "dental implants",
  invisalign: "Invisalign",
  whitening: "teeth whitening",
  cosmetic: "cosmetic dentistry",
  smile_makeover: "a smile makeover",
  other: "a dental treatment",
};

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = user.profile.clinic_id;
  if (!clinicId) {
    return Response.json({ error: "No clinic associated with this account." }, { status: 403 });
  }

  // ── Config check ──────────────────────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI is not configured on this server." }, { status: 503 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const leadId =
    body !== null && typeof body === "object" && "leadId" in body
      ? String((body as Record<string, unknown>).leadId)
      : "";

  if (!leadId) {
    return Response.json({ error: "leadId is required." }, { status: 400 });
  }

  // ── Load lead + verify ownership ──────────────────────────────────────────────
  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("id, clinic_id, full_name, treatment_type, message, created_at, anonymised_at")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return Response.json({ error: "Lead not found." }, { status: 404 });
  }
  if (lead.clinic_id !== clinicId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  if (lead.anonymised_at) {
    return Response.json({ error: "This lead has been anonymised." }, { status: 400 });
  }

  // ── Build context (non-clinical, first name only) ─────────────────────────────
  const firstName = lead.full_name.split(/\s+/)[0] || "there";
  const daysSince = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const treatmentLabel = lead.treatment_type
    ? (TREATMENT_LABELS[lead.treatment_type] ?? "a dental treatment")
    : "a dental treatment";

  let userPrompt =
    `Write a short, warm reply to a patient enquiry (2–3 short paragraphs).\n\n` +
    `Patient first name: ${firstName}\n` +
    `Treatment interest: ${treatmentLabel}\n` +
    `Days since enquiry received: ${daysSince}\n`;

  if (lead.message && lead.message.trim()) {
    userPrompt += `\nPatient's enquiry message:\n"${lead.message.trim()}"\n`;
  }

  userPrompt +=
    "\nGuidelines: address the patient by first name, thank them for their enquiry, " +
    "encourage them to book a consultation, keep it brief and friendly. " +
    "Do not mention fees, diagnoses, or treatment suitability.";

  // ── Call OpenAI ───────────────────────────────────────────────────────────────
  let draft: string;
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 450,
      temperature: 0.7,
    });

    draft = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[ai/generate-reply] OpenAI error:", msg);
    return Response.json({ error: "Failed to generate draft. Please try again." }, { status: 502 });
  }

  if (!draft) {
    return Response.json({ error: "No draft was returned." }, { status: 500 });
  }

  // ── Log activity (non-critical) ───────────────────────────────────────────────
  try {
    await admin.from("lead_activity").insert({
      lead_id: leadId,
      clinic_id: clinicId,
      actor_id: user.id,
      activity_type: "ai_draft_generated",
      description: "AI reply draft generated",
    });
  } catch {
    // Non-critical — never block the response
  }

  return Response.json({ draft });
}
