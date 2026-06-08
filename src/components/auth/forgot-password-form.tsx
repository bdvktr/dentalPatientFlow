"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    await createClient().auth.resetPasswordForEmail(email, {
      // Routes through /auth/callback which exchanges the code/token,
      // then redirects to /auth/update-password.
      // This origin must be on the Supabase allowed redirect URLs list.
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    // Always show success regardless of whether the email exists.
    // This prevents user enumeration (revealing which emails are registered).
    setPending(false);
    setSubmitted(true);
  }

  const wrapper = (children: React.ReactNode) => (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="mb-8 text-center">
        <span className="text-xl font-semibold tracking-tight">Dental PatientFlow AI</span>
      </div>
      {children}
    </div>
  );

  if (submitted) {
    return wrapper(
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a password reset
          link. Check your inbox and spam folder.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          The link expires after one hour.
        </p>
        <div className="mt-8 border-t border-border pt-6">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return wrapper(
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@yourclinic.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
