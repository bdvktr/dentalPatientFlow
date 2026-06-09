import { redirect } from "next/navigation";
import { requireClinicAdmin } from "@/lib/auth";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClinicAdmin();

  // platform_owner has no clinic to manage — send to admin area
  if (!user.profile.clinic_id) {
    redirect("/app/admin");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your clinic account and follow-up templates.
        </p>
      </div>
      <SettingsNav />
      <div>{children}</div>
    </div>
  );
}
