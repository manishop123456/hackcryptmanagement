// FILE: src/components/layout/user-menu.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEPARTMENT_LABELS, ROLE_LABELS, type AppRole, type Department } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

export function UserMenu({
  fullName,
  email,
  role,
  department,
}: {
  fullName: string;
  email: string;
  role: AppRole;
  department: Department | null;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const roleLabel = ROLE_LABELS[role];
  const departmentLabel = department ? DEPARTMENT_LABELS[department] : null;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      // 1. Clear client-side Supabase session (localStorage and cookies)
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Client signOut warning:", err);
    }

    try {
      // 2. Call server route handler to clear server-side cookies
      await fetch("/auth/signout", { method: "POST" });
    } catch (err) {
      console.warn("Server signOut warning:", err);
    }

    // 3. Navigate to /login to flush React state and cache
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pr-2.5 pl-1 text-left transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span className="grid size-7 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
          {initials(fullName)}
        </span>
        <span className="hidden max-w-36 truncate text-sm text-foreground sm:block">
          {fullName}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
        <div className="px-2.5 pb-2">
          <p className="text-sm font-medium text-strong">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-accent">
            {roleLabel}
            {departmentLabel ? ` · ${departmentLabel}` : ""}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
          disabled={signingOut}
          className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
        >
          {signingOut ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing out…
            </>
          ) : (
            <>
              <LogOut className="size-4" />
              Sign out
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
