"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Sign out"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut size={15} />
      </button>
    </form>
  );
}
