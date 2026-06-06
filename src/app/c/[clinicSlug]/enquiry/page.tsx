import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnquiryForm } from "@/components/enquiry/enquiry-form";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select("name")
    .eq("slug", clinicSlug)
    .eq("is_active", true)
    .single();

  return {
    title: clinic ? `Request a consultation — ${clinic.name}` : "Consultation enquiry",
    robots: { index: false }, // prevent indexing of per-clinic pages until clinic opts in
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EnquiryPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;

  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select("id, name, website, booking_url")
    .eq("slug", clinicSlug)
    .eq("is_active", true)
    .single();

  if (!clinic) notFound();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex flex-col items-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg">
          {/* Clinic header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold">{clinic.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Request a free consultation
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <EnquiryForm
              clinicId={clinic.id}
              bookingUrl={clinic.booking_url ?? clinic.website ?? undefined}
            />
          </div>

          {/* Safety copy — required per product guidelines */}
          <p className="mt-6 text-center text-xs text-muted-foreground px-2">
            This form is for consultation enquiries only. For dental emergencies
            please contact your clinic directly or call&nbsp;999.
            Dental PatientFlow AI supports administrative follow-up only —
            it does not provide dental advice, diagnosis, or treatment
            recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
