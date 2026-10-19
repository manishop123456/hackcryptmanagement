// FILE: src/components/layout/app-shell.tsx
import * as React from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Starfield } from "@/components/starfield";
import type { AppRole, Department } from "@/lib/constants";

// The shared frame for every signed-in screen: sticky top bar, desktop sidebar,
// bottom navigation on phones and a very faint starfield behind everything.
export function AppShell({
  fullName,
  email,
  role,
  department,
  children,
}: {
  fullName: string;
  email: string;
  role: AppRole;
  department: Department | null;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <Starfield density={60} opacity={0.3} />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <TopBar fullName={fullName} email={email} role={role} department={department} />

        <div className="mx-auto flex w-full max-w-[1400px] flex-1">
          <Sidebar role={role} />
          <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-8">{children}</main>
        </div>

        <BottomNav role={role} />
      </div>
    </div>
  );
}
