// FILE: src/lib/supabase/server.ts
// Server-side Supabase client for Server Components, Server Actions and Route Handlers.
// It carries the signed-in user's cookies, so Row Level Security applies to it.

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The middleware refreshes the session
          // on every request, so ignoring this is safe and is the documented pattern.
        }
      },
    },
  });
}
