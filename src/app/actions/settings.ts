"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicAdmin, isPlatformOwner } from "@/lib/auth";
import { clinicSettingsSchema, templateSchema } from "@/lib/validations/settings";
import type { TreatmentType } from "@/types/database";

export type SettingsState = { error: string | null; success: boolean };
export type TemplateState = { error: string | null; success?: boolean };

// ── Clinic settings ───────────────────────────────────────────────────────────

export async function saveClinicSettingsAction(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireClinicAdmin();
  const clinicId = user.profile.clinic_id;

  if (!clinicId) {
    return { error: "No clinic is associated with your account.", success: false };
  }

  const parsed = clinicSettingsSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    slug: formData.get("slug")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    website: formData.get("website")?.toString() ?? "",
    booking_url: formData.get("booking_url")?.toString() ?? "",
    privacy_url: formData.get("privacy_url")?.toString() ?? "",
    timezone: formData.get("timezone")?.toString() ?? "Europe/London",
    followup_enabled: formData.get("followup_enabled") === "on",
    retention_days:
      parseInt(formData.get("retention_days")?.toString() ?? "365") || 365,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      success: false,
    };
  }

  const d = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from("clinics")
    .update({
      name: d.name,
      slug: d.slug,
      email: d.email || null,
      website: d.website || null,
      booking_url: d.booking_url || null,
      privacy_url: d.privacy_url || null,
      timezone: d.timezone,
      followup_enabled: d.followup_enabled,
      retention_days: d.retention_days,
    })
    .eq("id", clinicId);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "This URL slug is already in use. Please choose a different one.",
        success: false,
      };
    }
    return { error: "Failed to save settings. Please try again.", success: false };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");

  return { error: null, success: true };
}

// ── Follow-up templates ───────────────────────────────────────────────────────

export async function saveTemplateAction(
  templateId: string,
  _prevState: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  const user = await requireClinicAdmin();
  const clinicId = user.profile.clinic_id;

  if (!clinicId && !isPlatformOwner(user)) {
    return { error: "No clinic is associated with your account." };
  }

  const effectiveClinicId = clinicId ?? "";

  const parsed = templateSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    subject: formData.get("subject")?.toString() ?? "",
    body_html: formData.get("body_html")?.toString() ?? "",
    treatment_type: formData.get("treatment_type")?.toString() || undefined,
    delay_days: parseInt(formData.get("delay_days")?.toString() ?? "0") || 0,
    step_order: parseInt(formData.get("step_order")?.toString() ?? "1") || 1,
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const d = parsed.data;
  const admin = createAdminClient();
  const treatmentType = (d.treatment_type as TreatmentType | undefined) ?? null;

  // ── Create ──────────────────────────────────────────────────────────────────

  if (templateId === "new") {
    if (!effectiveClinicId) return { error: "No clinic associated with your account." };

    const { error } = await admin.from("followup_templates").insert({
      clinic_id: effectiveClinicId,
      name: d.name,
      subject: d.subject,
      body_html: d.body_html,
      treatment_type: treatmentType,
      delay_days: d.delay_days,
      step_order: d.step_order,
      is_active: d.is_active,
    });

    if (error) return { error: "Failed to create template. Please try again." };

    revalidatePath("/app/settings/templates");
    redirect("/app/settings/templates");
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  // Verify the template belongs to this clinic (prevents IDOR)
  const { data: existing } = await admin
    .from("followup_templates")
    .select("clinic_id")
    .eq("id", templateId)
    .single();

  if (!existing) return { error: "Template not found." };

  if (!isPlatformOwner(user) && existing.clinic_id !== effectiveClinicId) {
    return { error: "You do not have access to this template." };
  }

  const { error } = await admin
    .from("followup_templates")
    .update({
      name: d.name,
      subject: d.subject,
      body_html: d.body_html,
      treatment_type: treatmentType,
      delay_days: d.delay_days,
      step_order: d.step_order,
      is_active: d.is_active,
    })
    .eq("id", templateId);

  if (error) return { error: "Failed to save template. Please try again." };

  revalidatePath("/app/settings/templates");
  revalidatePath(`/app/settings/templates/${templateId}`);

  return { error: null, success: true };
}
