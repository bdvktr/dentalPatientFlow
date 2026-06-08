import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setupClinicForNewUser } from "@/app/actions/auth";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Supabase auth callback handler — covers two flows:
 *
 * 1. token_hash + type (recovery, magic link, email OTP):
 *    Supabase embeds token_hash and type in the recovery email link.
 *    We call verifyOtp to establish the session, then redirect.
 *    For type=recovery we default to /auth/update-password.
 *
 * 2. code (PKCE — signup email confirmation):
 *    Supabase sends code after the user clicks the confirmation link.
 *    We call exchangeCodeForSession, set up the clinic if needed,
 *    and redirect to /app (or an explicit next param).
 *    Recovery emails that include next=/auth/update-password also use
 *    this branch when the Supabase Recovery URL includes that next param.
 *
 * Open-redirect protection: next is only used if it starts with "/".
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  // Reject next values that are not relative paths to prevent open redirects.
  const safeNext = (fallback: string) =>
    next?.startsWith("/") ? next : fallback;

  const supabase = await createClient();

  // ── token_hash flow (password recovery, email OTP) ──────────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
    const defaultPath = type === "recovery" ? "/auth/update-password" : "/app";
    return NextResponse.redirect(`${origin}${safeNext(defaultPath)}`);
  }

  // ── PKCE code flow (signup confirmation + recovery via forgot-password) ──
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // If an explicit next was provided (e.g. next=/auth/update-password from
    // the forgot-password page), honour it without running clinic setup.
    if (next?.startsWith("/")) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // No next param — assume signup confirmation. Set up clinic if needed.
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", data.user.id)
      .single();

    if (!profile?.clinic_id) {
      const clinicName =
        (data.user.user_metadata?.clinic_name as string | undefined) ??
        "My Clinic";
      await setupClinicForNewUser(clinicName);
    }

    return NextResponse.redirect(`${origin}/app`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
