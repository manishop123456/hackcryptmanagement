// FILE: src/lib/supabase/client.ts
// Browser Supabase client. Uses the public anon key only, so it is safe to ship.
// Every query it makes is still filtered by Row Level Security.

import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
