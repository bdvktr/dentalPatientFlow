import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in to your clinic</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and password below.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
