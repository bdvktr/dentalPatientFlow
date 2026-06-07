import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setupClinicForNewUser } from "@/app/actions/auth";

/**
 * Handles the Supabase email confirmation redirect.
 * Supabase sends the user to /auth/callback?code=xxx after they
 * click the confirmation link in their inbox.
 *
 * After exchanging the code for a session, we check whether the
 * user's profile has a clinic_id. If not, we create one from the
 * clinic_name stored in user metadata during signup.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/leads";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Check if the profile already has a clinic assigned.
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("id", data.user.id)
    .single();

  if (!profile?.clinic_id) {
    const clinicName =
      (data.user.user_metadata?.clinic_name as string | undefined) ??
      "My Clinic";
    // Uses the admin client — the user has no clinic_id yet so the
    // RLS UPDATE policy on profiles would otherwise block this.
    await setupClinicForNewUser(clinicName);
  }

  const redirectUrl = next.startsWith("/") ? `${origin}${next}` : origin;
  return NextResponse.redirect(redirectUrl);
}
