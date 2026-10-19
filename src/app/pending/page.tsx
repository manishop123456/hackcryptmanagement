// FILE: src/app/pending/page.tsx
// What an account sees when it is not (or no longer) approved.
// The account has a session but no profile row, so every table in the database is
// closed to it by Row Level Security. This page exposes nothing.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock3, LogOut, ShieldOff } from "lucide-react";

import { BrandLogo, BrandWordmark } from "@/components/brand/logo";
import { SubmitButton } from "@/components/submit-button";
import { Starfield } from "@/components/starfield";
import { getAuthUser, getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Waiting for approval",
};

// Shows per-account state (who is signed in, and whether they are approved), so it must
// never be prerendered into the build output.
export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();

  // Someone who is active has no business here.
  if (profile?.is_active) redirect("/");

  const revoked = profile !== null && !profile.is_active;

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <Starfield density={100} opacity={0.6} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5">
          <BrandLogo size={40} />
          <BrandWordmark />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface/90 p-6 text-center backdrop-blur-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-warning/40 bg-warning/10 text-warning">
            {revoked ? <ShieldOff className="size-6" /> : <Clock3 className="size-6" />}
          </span>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-strong">
            {revoked ? "Your access has been paused" : "Your account is waiting for approval"}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {revoked
              ? "A manager has turned off access for this email. Speak to a Management or Development Head if you think this is a mistake."
              : "A manager needs to add this email with a role and department before you can use the system. You will not see any club data until then."}
          </p>

          <p className="mt-4 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs break-all text-muted-foreground">
            {user.email ?? "No email on this account"}
          </p>

          <form action="/auth/signout" method="post" className="mt-5">
            <SubmitButton variant="secondary" className="w-full" pendingLabel="Signing out…">
              <LogOut />
              Sign out
            </SubmitButton>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Signed in with the wrong account? Sign out and try another one.
        </p>

        {profile ? null : (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Already approved? Sign out and sign in again to refresh your access.
          </p>
        )}
      </div>
    </div>
  );
}
