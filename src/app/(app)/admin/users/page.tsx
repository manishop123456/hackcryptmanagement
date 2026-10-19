// FILE: src/app/(app)/admin/users/page.tsx
// Adding and editing approved emails, and activating or pausing members.
// Loads the data, checks the permission, and hands plain serializable rows to the client.

import type { Metadata } from "next";

import { NoAccess } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { requireActiveProfile } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  AdminUsersClient,
  type ApprovedEmailItem,
  type ProfileItem,
} from "@/app/(app)/admin/users/admin-users-client";

export const metadata: Metadata = {
  title: "Users",
};

export default async function AdminUsersPage() {
  const profile = await requireActiveProfile();

  if (!canManageUsers(profile.role)) {
    return (
      <NoAccess message="Only the Management Head and the Development Head can add or edit users and roles." />
    );
  }

  const supabase = await createClient();

  const [approvedResult, profilesResult] = await Promise.all([
    supabase.from("approved_emails").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  const loadError = approvedResult.error ?? profilesResult.error;

  const signedInEmails = new Set((profilesResult.data ?? []).map((row) => row.email));

  const approved: ApprovedEmailItem[] = (approvedResult.data ?? []).map((row) => ({
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    department: row.department,
    created_at: row.created_at,
    hasSignedIn: signedInEmails.has(row.email),
  }));

  const profiles: ProfileItem[] = (profilesResult.data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    department: row.department,
    is_active: row.is_active,
    created_at: row.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users and roles"
        description="Only an email on this list can sign in. Adding someone here gives them a role and a department straight away."
      />

      {loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger"
        >
          The user lists could not be loaded. Refresh the page, and if it keeps failing check
          that the migrations have been applied to this Supabase project.
        </div>
      ) : null}

      <AdminUsersClient approved={approved} profiles={profiles} signedInViewerEmail={profile.email} />
    </div>
  );
}
