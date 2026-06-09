import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicAdmin } from "@/lib/auth";
import type { TreatmentType } from "@/types/database";

export const metadata: Metadata = {
  title: "Follow-up Templates",
};

const TREATMENT_LABELS: Record<TreatmentType, string> = {
  dental_implants: "Dental Implants",
  invisalign: "Invisalign",
  whitening: "Whitening",
  cosmetic: "Cosmetic Dentistry",
  smile_makeover: "Smile Makeover",
  other: "Other",
};

export default async function TemplatesPage() {
  const user = await requireClinicAdmin();
  const clinicId = user.profile.clinic_id!; // guaranteed by layout redirect

  const admin = createAdminClient();
  const { data: templates } = await admin
    .from("followup_templates")
    .select("id, name, subject, treatment_type, delay_days, step_order, is_active")
    .eq("clinic_id", clinicId)
    .order("step_order")
    .order("delay_days");

  if (!templates) redirect("/app");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length === 0
            ? "No templates yet"
            : `${templates.length} template${templates.length === 1 ? "" : "s"}`}
        </p>
        <Link
          href="/app/settings/templates/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          New template
        </Link>
      </div>

      {templates.length === 0 && (
        <div className="rounded-lg border border-border bg-card px-6 py-14 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">No follow-up templates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a template to start sending automated follow-up emails to new
            enquiries.
          </p>
          <Link
            href="/app/settings/templates/new"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Create your first template &rarr;
          </Link>
        </div>
      )}

      {templates.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Treatment</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden md:table-cell">Subject</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Delay</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Step</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {t.treatment_type
                      ? TREATMENT_LABELS[t.treatment_type]
                      : <span className="text-muted-foreground/60">All</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                    {t.subject}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {t.delay_days}d
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                    #{t.step_order}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/settings/templates/${t.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
