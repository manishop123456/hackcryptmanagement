// FILE: src/app/auth/callback/route.ts
// Supabase sends the browser back here with a PKCE code (e.g. for password recovery links).
// We exchange it for a session cookie, then decide where the member may go:
//   - recovery flow (/reset-password) -> /reset-password
//   - an active profile                -> the target page asked for
//   - anything else                    -> /pending (approved email missing, or access revoked)

import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = safeNextPath(nextParam);

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=not_configured", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", origin));
  }

  // If the flow is specifically heading to password reset, proceed directly to /reset-password
  if (nextParam && nextParam.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/pending", origin));
  }

  // A profile only exists for pre-approved emails, and it must still be active.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_active) {
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/pending", origin));
}
