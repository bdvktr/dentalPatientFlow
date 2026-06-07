import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicAdmin } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";
import { ClinicSettingsForm } from "@/components/settings/clinic-settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await requireClinicAdmin();
  const clinicId = user.profile.clinic_id!; // guaranteed by layout redirect

  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .single();

  if (!clinic) redirect("/app");

  const enquiryUrl = `${getBaseUrl()}/c/${clinic.slug}/enquiry`;

  return (
    <ClinicSettingsForm clinic={clinic} enquiryUrl={enquiryUrl} />
  );
}
