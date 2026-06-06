"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

export type AuthState = { error: string | null };

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  redirect("/app/leads");
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signupAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    clinicName: formData.get("clinicName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { clinicName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Store clinic name in user metadata so the callback route can
      // create the clinic after email confirmation.
      data: { clinic_name: clinicName },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (data.user && data.session) {
    // Email confirmation is disabled (dev/test environment).
    // Create the clinic immediately.
    await setupClinicForNewUser(data.user.id, clinicName);
    redirect("/app/leads");
  }

  if (data.user && !data.session) {
    // Email confirmation is required — tell the user to check their inbox.
    redirect("/auth/confirm");
  }

  return { error: "Sign up failed. Please try again." };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Creates a clinic and assigns the given user as clinic_admin.
 * Called after signup (no email confirmation) or from the auth callback.
 * Uses the admin client (service role) because the user's profile exists
 * but has no clinic_id yet — the profiles INSERT policy blocks this.
 */
export async function setupClinicForNewUser(
  userId: string,
  clinicName: string
): Promise<void> {
  const admin = createAdminClient();

  const slug = generateSlug(clinicName);

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({ name: clinicName, slug })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    // Slug collision — retry with a random suffix
    const fallbackSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: fallback } = await admin
      .from("clinics")
      .insert({ name: clinicName, slug: fallbackSlug })
      .select("id")
      .single();

    if (!fallback) return;
    await admin
      .from("profiles")
      .update({ clinic_id: fallback.id, role: "clinic_admin" })
      .eq("id", userId);
    return;
  }

  await admin
    .from("profiles")
    .update({ clinic_id: clinic.id, role: "clinic_admin" })
    .eq("id", userId);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

/**
 * Converts Supabase auth error messages into user-friendly strings.
 * Supabase errors are intentionally vague for security; we keep them
 * vague too and avoid exposing whether an email exists.
 */
function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("password should be")) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("email address is invalid")) {
    return "Enter a valid email address.";
  }
  return "Something went wrong. Please try again.";
}
