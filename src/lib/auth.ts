// FILE: src/lib/auth.ts
// Server-only access helpers. Every protected page starts from one of these.
//
// The rule for this app: a signed-in account only has data access if a profile row exists
// for it AND that profile is active. The profile row is created by the database trigger
// in 0002_core_profiles.sql, and only for pre-approved emails.

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Actor } from "@/lib/permissions";
import type { ProfileRow } from "@/types/database";

export type AuthUser = {
  id: string;
  email: string | null;
};

/** The signed-in auth user, or null. Deduplicated per request. */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // A fresh clone has no Supabase project yet. Returning null sends the visitor to
  // /login, which explains what is missing, instead of throwing a 500 from here.
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
});

/**
 * The caller's profile. Returns the row even when it is inactive, because the /pending
 * page needs to tell "waiting for approval" apart from "access revoked".
 */
export const getCurrentProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
});

/**
 * Guard for every page inside the authenticated layout.
 * No session -> /login. Signed in but no active profile -> /pending.
 */
export async function requireActiveProfile(): Promise<ProfileRow> {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/pending");

  return profile;
}

/** Narrow a profile to the permission helpers' Actor shape. */
export function toActor(profile: Pick<ProfileRow, "role" | "department">): Actor {
  return { role: profile.role, department: profile.department };
}

/** A user's own display name, used in the shell and dashboards. */
export function displayName(profile: Pick<ProfileRow, "full_name">): string {
  return profile.full_name;
}
