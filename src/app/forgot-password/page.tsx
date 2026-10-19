import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FadeIn } from "@/components/motion-fade";
import { Starfield } from "@/components/starfield";
import { isSupabaseConfigured } from "@/lib/env";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <Starfield density={120} opacity={0.85} />

      <div className="relative z-10 w-full max-w-sm">
        <FadeIn className="flex flex-col items-center gap-5 text-center">
          <BrandLogo size={80} />

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-strong">Reset Your Password</h1>
            <p className="text-xs text-muted-foreground">
              Enter your email to receive password reset instructions
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.08} className="mt-6">
          <div className="rounded-2xl border border-border bg-surface/85 p-5 backdrop-blur-sm">
            {configured ? (
              <ForgotPasswordForm />
            ) : (
              <Alert variant="warning" role="alert">
                <AlertTriangle />
                <div>
                  <AlertTitle>Supabase is not configured yet</AlertTitle>
                  <AlertDescription>
                    Supabase connection settings must be provided in .env.local to send recovery emails.
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
