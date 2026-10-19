import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { BrandLogo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { FadeIn } from "@/components/motion-fade";
import { Starfield } from "@/components/starfield";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const configured = isSupabaseConfigured();

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <Starfield density={120} opacity={0.85} />

      <div className="relative z-10 w-full max-w-sm">
        <FadeIn className="flex flex-col items-center gap-5 text-center">
          <BrandLogo size={96} />

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-strong">DevClub TRCAC</h1>
            <p className="font-mono text-[11px] tracking-[0.3em] text-accent">
              EXPLORE. CODE. INSPIRE.
            </p>
            <p className="pt-1 text-sm text-muted-foreground">HackCrypt Management System</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.08} className="mt-8">
          <div className="rounded-2xl border border-border bg-surface/85 p-5 backdrop-blur-sm">
            {configured ? (
              <>
                <LoginForm next={next} />

                {params.error ? (
                  <Alert variant="destructive" className="mt-4" role="alert">
                    <AlertTriangle />
                    <div>
                      <AlertTitle>Sign-in did not complete</AlertTitle>
                      <AlertDescription>
                        Please try again. If it keeps failing, ask a Management or Development
                        Head to check that your email is on the approved list.
                      </AlertDescription>
                    </div>
                  </Alert>
                ) : null}

                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  Only pre-approved club emails can sign in. If your account is not approved
                  yet, you will see a waiting screen and no data.
                </p>
              </>
            ) : (
              <Alert variant="warning" role="alert">
                <AlertTriangle />
                <div>
                  <AlertTitle>Supabase is not configured yet</AlertTitle>
                  <AlertDescription>
                    Copy <code className="font-mono text-xs">.env.example</code> to{" "}
                    <code className="font-mono text-xs">.env.local</code> and set{" "}
                    <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                    <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
                    then restart the dev server.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
