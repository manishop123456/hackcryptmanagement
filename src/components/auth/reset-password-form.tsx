"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [hasSession, setHasSession] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function verifySession() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setHasSession(true);
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setChecking(false);
      }
    }

    verifySession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.");
        setPending(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setPending(false);
    }
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Loader2 className="size-6 animate-spin text-accent mb-2" />
        <p className="text-xs text-muted-foreground">Verifying recovery link…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-4 text-center">
        <Alert variant="destructive" role="alert">
          <AlertTriangle />
          <div>
            <AlertTitle>Invalid or Expired Link</AlertTitle>
            <AlertDescription>
              This password reset link is invalid or has expired. Please request a new recovery link.
            </AlertDescription>
          </div>
        </Alert>

        <div className="pt-2">
          <Button asChild variant="default" className="w-full">
            <Link href="/forgot-password">
              Request New Recovery Link
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <Alert variant="success" role="status">
          <CheckCircle2 />
          <div>
            <AlertTitle>Password Reset Complete</AlertTitle>
            <AlertDescription>
              Your password has been updated successfully. Redirecting to sign in page…
            </AlertDescription>
          </div>
        </Alert>
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
        <Label htmlFor="reset-password">New Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className="px-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={pending}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={pending}
            className="px-9"
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
        {pending ? "Updating Password…" : "Update Password"}
      </Button>
    </form>
  );
}
