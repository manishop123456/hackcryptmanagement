// FILE: src/app/(app)/layout.tsx
// The guard for every signed-in screen. requireActiveProfile() sends visitors with no
// session to /login and visitors without an active profile to /pending, so no page
// inside this group has to repeat that check.

import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireActiveProfile } from "@/lib/auth";

// Every screen behind this layout depends on the signed-in user's cookies, so it must be
// rendered per request and never prerendered into the build output.
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const profile = await requireActiveProfile();

  return (
    <AppShell
      fullName={profile.full_name}
      email={profile.email}
      role={profile.role}
      department={profile.department}
    >
      {children}
    </AppShell>
  );
}
