import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicAdmin } from "@/lib/auth";
import { TemplateForm } from "@/components/settings/template-form";

export const metadata: Metadata = {
  title: "Edit Template",
};

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const user = await requireClinicAdmin();
  const clinicId = user.profile.clinic_id!; // guaranteed by layout redirect

  const admin = createAdminClient();

  // Load the clinic for name/email used in preview
  const { data: clinic } = await admin
    .from("clinics")
    .select("name, email")
    .eq("id", clinicId)
    .single();

  if (!clinic) redirect("/app");

  if (templateId === "new") {
    return (
      <div className="space-y-4">
        <Breadcrumb label="New template" />
        <div className="rounded-lg border border-border bg-card p-6">
          <TemplateForm
            templateId="new"
            clinicName={clinic.name}
            clinicEmail={clinic.email}
          />
        </div>
      </div>
    );
  }

  const { data: template } = await admin
    .from("followup_templates")
    .select("*")
    .eq("id", templateId)
    .eq("clinic_id", clinicId) // IDOR: only load own clinic's templates
    .single();

  if (!template) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumb label={template.name} />
      <div className="rounded-lg border border-border bg-card p-6">
        <TemplateForm
          templateId={template.id}
          template={template}
          clinicName={clinic.name}
          clinicEmail={clinic.email}
        />
      </div>
    </div>
  );
}

function Breadcrumb({ label }: { label: string }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/app/settings/templates" className="hover:text-foreground transition-colors">
        Templates
      </Link>
      <span>/</span>
      <span className="text-foreground font-medium truncate max-w-xs">{label}</span>
    </nav>
  );
}
