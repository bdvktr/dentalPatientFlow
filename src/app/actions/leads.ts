"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicAccess, isClinicAdmin, isPlatformOwner } from "@/lib/auth";
import type { LeadStatus } from "@/types/database";

export type LeadActionState = { error: string | null };
export type NoteActionState = { error: string | null; success: boolean };

const VALID_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "consultation_booked",
  "treatment_started",
  "lost",
  "archived",
];

const noteSchema = z.object({
  note: z
    .string()
    .min(1, "Note cannot be empty")
    .max(2000, "Note is too long (max 2,000 characters)")
    .trim(),
});

// ── Shared helper ─────────────────────────────────────────────────────────────

async function getAuthorizedLead(leadId: string) {
  const user = await requireClinicAccess();
  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads")
    .select("id, clinic_id, status, anonymised_at")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return { user, lead: null, error: "Lead not found." };
  }

  const authorized =
    isPlatformOwner(user) || user.profile.clinic_id === lead.clinic_id;

  if (!authorized) {
    return { user, lead: null, error: "You do not have access to this lead." };
  }

  return { user, lead, error: null };
}

// ── Update lead status ────────────────────────────────────────────────────────

export async function updateLeadStatusAction(
  leadId: string,
  _prevState: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  const newStatus = formData.get("newStatus")?.toString() as LeadStatus | undefined;

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return { error: "Invalid status value." };
  }

  const { user, lead, error } = await getAuthorizedLead(leadId);
  if (!lead) return { error: error ?? "Lead not found." };
  if (lead.status === newStatus) return { error: null };

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId);

  if (updateErr) return { error: "Failed to update status. Please try again." };

  try {
    await admin.from("lead_activity").insert({
      lead_id: leadId,
      clinic_id: lead.clinic_id,
      actor_id: user.id,
      activity_type: "status_changed",
      description: `Status changed from ${lead.status} to ${newStatus}`,
      metadata: { old_status: lead.status, new_status: newStatus },
    });
  } catch { /* non-critical */ }

  revalidatePath(`/app/leads/${leadId}`);
  revalidatePath("/app/leads");
  revalidatePath("/app");

  return { error: null };
}

// ── Add internal note ─────────────────────────────────────────────────────────

export async function addLeadNoteAction(
  leadId: string,
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const parsed = noteSchema.safeParse({ note: formData.get("note") });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid note.",
      success: false,
    };
  }

  const { user, lead, error } = await getAuthorizedLead(leadId);
  if (!lead) return { error: error ?? "Lead not found.", success: false };

  const admin = createAdminClient();
  const { error: insertErr } = await admin.from("lead_activity").insert({
    lead_id: leadId,
    clinic_id: lead.clinic_id,
    actor_id: user.id,
    activity_type: "note_added",
    description: parsed.data.note,
  });

  if (insertErr) {
    return { error: "Failed to save note. Please try again.", success: false };
  }

  revalidatePath(`/app/leads/${leadId}`);

  return { error: null, success: true };
}

// ── Anonymise lead ────────────────────────────────────────────────────────────

export async function anonymizeLeadAction(
  leadId: string,
  _prevState: LeadActionState,
  _formData: FormData
): Promise<LeadActionState> {
  const { user, lead, error } = await getAuthorizedLead(leadId);
  if (!lead) return { error: error ?? "Lead not found." };

  if (!isClinicAdmin(user) && !isPlatformOwner(user)) {
    return { error: "Only clinic admins can anonymise leads." };
  }

  if (lead.anonymised_at !== null) {
    return { error: "This lead has already been anonymised." };
  }

  const admin = createAdminClient();

  // Create the activity log before the DB trigger wipes PII
  try {
    await admin.from("lead_activity").insert({
      lead_id: leadId,
      clinic_id: lead.clinic_id,
      actor_id: user.id,
      activity_type: "lead_anonymised",
      description:
        "Lead anonymised — all personally identifiable information has been removed.",
    });
  } catch { /* non-critical */ }

  const { error: updateErr } = await admin
    .from("leads")
    .update({ anonymised_at: new Date().toISOString() })
    .eq("id", leadId);

  if (updateErr) return { error: "Failed to anonymise lead. Please try again." };

  revalidatePath("/app/leads");
  revalidatePath("/app");
  redirect("/app/leads");
}
