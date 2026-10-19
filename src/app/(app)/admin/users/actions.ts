// FILE: src/app/(app)/admin/users/actions.ts
"use server";

// Server Actions for user management.
//
// Each one follows the same five steps required by the security rules:
//   1. authenticate, 2. load role and department, 3. check the permission,
//   4. validate the input with Zod, 5. act (and audit-log the change).
//
// Row Level Security enforces the same rules again in Postgres, so a caller who somehow
// bypasses this file still cannot write.

import { revalidatePath } from "next/cache";

import { writeAudit } from "@/lib/audit";
import { getCurrentProfile } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  approvedEmailSchema,
  firstIssue,
  revokeApprovedEmailSchema,
  setProfileActiveSchema,
} from "@/lib/validations/admin";
import type { ProfileRow } from "@/types/database";
import type { AdminActionState } from "./constants";
export type { AdminActionState };

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Radix Select cannot submit an empty value, so "No department" is sent as the sentinel
 * "none". Both it and an empty string mean NULL.
 */
function readDepartment(formData: FormData): string | null {
  const value = readString(formData, "department");
  if (value === "" || value === "none") return null;
  return value;
}

type ManagerCheck = { ok: true; profile: ProfileRow } | { ok: false; message: string };

async function requireManager(): Promise<ManagerCheck> {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    return { ok: false, message: "Your session has ended. Sign in again." };
  }

  if (!canManageUsers(profile.role)) {
    return { ok: false, message: "Your role is not allowed to manage users." };
  }

  return { ok: true, profile };
}

/** Maps the two database errors a member could actually cause to plain sentences. */
function describeWriteError(code: string | undefined): string {
  if (code === "23505") return "That email is already on the approved list.";
  if (code === "42501") return "You do not have permission to make that change.";
  return "That change could not be saved. Please try again.";
}

export async function addApprovedEmail(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const check = await requireManager();
  if (!check.ok) return { status: "error", message: check.message };

  const parsed = approvedEmailSchema.safeParse({
    full_name: readString(formData, "full_name"),
    email: readString(formData, "email"),
    role: readString(formData, "role"),
    department: readDepartment(formData),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { full_name, email, role, department } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("approved_emails").insert({
    email,
    full_name,
    role,
    department,
    created_by: check.profile.id,
  });

  if (error) {
    console.error(`[admin] add approved email failed: ${error.code ?? "unknown"}`);
    return { status: "error", message: describeWriteError(error.code) };
  }

  await writeAudit(supabase, {
    action: "approved_email.added",
    entity: "approved_email",
    entityId: null,
    after: { email, full_name, role, department },
  });

  revalidatePath("/admin/users");
  return { status: "success", message: `${full_name} can now sign in with ${email}.` };
}

export async function updateApprovedEmail(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const check = await requireManager();
  if (!check.ok) return { status: "error", message: check.message };

  const parsed = approvedEmailSchema.safeParse({
    full_name: readString(formData, "full_name"),
    email: readString(formData, "email"),
    role: readString(formData, "role"),
    department: readDepartment(formData),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { full_name, email, role, department } = parsed.data;

  if (email === check.profile.email && role !== check.profile.role) {
    return { status: "error", message: "You cannot change your own role." };
  }

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("approved_emails")
    .select("full_name, role, department")
    .eq("email", email)
    .maybeSingle();

  if (!before) {
    return { status: "error", message: "That email is no longer on the approved list." };
  }

  // The database trigger copies role and department onto the member's profile.
  const { error } = await supabase
    .from("approved_emails")
    .update({ full_name, role, department })
    .eq("email", email);

  if (error) {
    console.error(`[admin] update approved email failed: ${error.code ?? "unknown"}`);
    return { status: "error", message: describeWriteError(error.code) };
  }

  await writeAudit(supabase, {
    action: "approved_email.updated",
    entity: "approved_email",
    entityId: null,
    before: {
      email,
      full_name: before.full_name,
      role: before.role,
      department: before.department,
    },
    after: { email, full_name, role, department },
  });

  revalidatePath("/admin/users");
  return { status: "success", message: `Updated access for ${email}.` };
}

export async function revokeApprovedEmail(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const check = await requireManager();
  if (!check.ok) return { status: "error", message: check.message };

  const parsed = revokeApprovedEmailSchema.safeParse({ email: readString(formData, "email") });
  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { email } = parsed.data;
  if (email === check.profile.email) {
    return { status: "error", message: "You cannot revoke your own access." };
  }

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("approved_emails")
    .select("full_name, role, department")
    .eq("email", email)
    .maybeSingle();

  const { error } = await supabase.from("approved_emails").delete().eq("email", email);

  if (error) {
    console.error(`[admin] revoke approved email failed: ${error.code ?? "unknown"}`);
    return { status: "error", message: describeWriteError(error.code) };
  }

  await writeAudit(supabase, {
    action: "approved_email.revoked",
    entity: "approved_email",
    entityId: null,
    before: before
      ? {
          email,
          full_name: before.full_name,
          role: before.role,
          department: before.department,
        }
      : { email },
  });

  revalidatePath("/admin/users");
  return { status: "success", message: `${email} can no longer sign in.` };
}

export async function setProfileActive(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const check = await requireManager();
  if (!check.ok) return { status: "error", message: check.message };

  const parsed = setProfileActiveSchema.safeParse({
    profile_id: readString(formData, "profile_id"),
    is_active: readString(formData, "is_active"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { profile_id, is_active } = parsed.data;

  if (profile_id === check.profile.id) {
    return { status: "error", message: "You cannot change your own access." };
  }

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("profiles")
    .select("full_name, email, is_active")
    .eq("id", profile_id)
    .maybeSingle();

  if (!before) {
    return { status: "error", message: "That member no longer has a profile." };
  }

  const { error } = await supabase.from("profiles").update({ is_active }).eq("id", profile_id);

  if (error) {
    console.error(`[admin] set profile active failed: ${error.code ?? "unknown"}`);
    return { status: "error", message: describeWriteError(error.code) };
  }

  await writeAudit(supabase, {
    action: is_active ? "profile.activated" : "profile.deactivated",
    entity: "profile",
    entityId: profile_id,
    before: { email: before.email, is_active: before.is_active },
    after: { email: before.email, is_active },
  });

  revalidatePath("/admin/users");
  return {
    status: "success",
    message: is_active
      ? `${before.full_name} can use the system again.`
      : `${before.full_name} has been paused.`,
  };
}
