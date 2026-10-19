// FILE: src/lib/supabase/middleware.ts
// Refreshes the Supabase auth session on every request and reports who is signed in.
// The route rules themselves live in src/middleware.ts.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

export type SessionResult = {
  response: NextResponse;
  userId: string | null;
};

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({ request });

  // Without a configured project there is nobody signed in; the login page explains
  // what is missing instead of the app crashing.
  if (!isSupabaseConfigured()) {
    return { response, userId: null };
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Validates the token with the auth server. Do not replace this with getSession(),
  // which trusts whatever is in the cookie.
  const { data } = await supabase.auth.getUser();

  return { response, userId: data.user?.id ?? null };
}
