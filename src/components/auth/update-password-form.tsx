"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  // null = checking session, true = valid session, false = no session
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => setHasSession(!!session));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError("Failed to update your password. Please request a new reset link.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace("/app"), 2000);
  }

  if (hasSession === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold tracking-tight">Dental PatientFlow AI</span>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold">Link expired</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This password reset link has expired or has already been used.
          </p>
          <Link
            href="/auth/forgot-password"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Request a new reset link
          </Link>
          <div className="mt-6 border-t border-border pt-4">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold tracking-tight">Dental PatientFlow AI</span>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold">Password updated</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your password has been updated successfully. Redirecting to your
            dashboard&hellip;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="mb-8 text-center">
        <span className="text-xl font-semibold tracking-tight">Dental PatientFlow AI</span>
      </div>
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm" className="text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={pending}
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
