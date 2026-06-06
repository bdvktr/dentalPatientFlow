"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="clinic-name" className="text-sm font-medium">
          Clinic name
        </label>
        <input
          id="clinic-name"
          name="clinicName"
          type="text"
          autoComplete="organization"
          required
          placeholder="Bright Smiles Dental"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          disabled={isPending}
        />
      </div>

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
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
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
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
      </div>

      <SubmitButton pending={isPending}>Create account</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const isLoading = pending || formPending;

  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Creating account…" : children}
    </button>
  );
}
