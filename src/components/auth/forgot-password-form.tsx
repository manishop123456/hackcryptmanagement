"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo }
      );

      if (resetError) {
        // Log silently for debugging, present generic message to avoid email enumeration
        console.error("Password reset error:", resetError);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Unexpected password reset error:", err);
      setSubmitted(true);
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <Alert variant="success" role="status">
          <CheckCircle2 />
          <div>
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>
              If an account exists for <strong className="font-mono">{email}</strong>, you will
              receive a link to reset your password shortly.
            </AlertDescription>
          </div>
        </Alert>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Be sure to check your spam or junk folder if you don&apos;t see the email within a few minutes.
        </p>

        <div className="pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="size-4 mr-2" />
              Return to Sign In
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="forgot-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className="pl-9 font-mono text-xs"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full mt-2"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? "Sending recovery link…" : "Send Recovery Link"}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3 mr-1" />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
