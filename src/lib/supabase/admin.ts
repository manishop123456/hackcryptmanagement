// FILE: src/lib/supabase/admin.ts
// THE SERVICE ROLE CLIENT. It bypasses Row Level Security.
//
// `server-only` makes the build fail if anything shipped to the browser imports this
// module. Use it only for operations that no client role may perform - writing the
// self check-in in Stage 3 is the main one. Never log its key, and never return raw
// query results straight from it to a client component without a permission check.

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL.startsWith("https://") || serviceRoleKey.length < 20) {
    throw new Error(
      "Supabase admin credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local (server side only).",
    );
  }

  cached = createClient<Database>(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
