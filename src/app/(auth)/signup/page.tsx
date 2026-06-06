import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Create your clinic account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started with a free trial. No credit card required.
        </p>
        <SignupForm />
      </div>
    </div>
  );
}
