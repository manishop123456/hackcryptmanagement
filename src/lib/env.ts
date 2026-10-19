// FILE: src/lib/env.ts
// Only NEXT_PUBLIC_ values may live in this module: it is imported by client components.
// The service role key is read exclusively in src/lib/supabase/admin.ts.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * True when the Supabase project settings are present. The login screen shows a setup
 * notice instead of a broken button when they are not, which is the common case for a
 * fresh clone before .env.local is filled in.
 */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;
}
