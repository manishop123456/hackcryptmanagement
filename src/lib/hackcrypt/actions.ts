// FILE: src/lib/hackcrypt/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth";
import { canManageTasks } from "@/lib/permissions";
import { writeAudit } from "@/lib/audit";
import { type PSStatus, type TeamMember, type TeamStatus } from "./queries";

const createPSSchema = z.object({
  title: z.string().min(1, "Title is required"),
  source: z.string().min(1, "Source / Domain is required"),
  status: z.enum(["submitted", "under_review", "changes_requested", "finalised"]),
  document_url: z.string().optional(),
  notes: z.string().optional(),
});

export async function createProblemStatementAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to create problem statements.");
  }

  const parsed = createPSSchema.safeParse({
    title: formData.get("title"),
    source: formData.get("source"),
    status: formData.get("status") || "submitted",
    document_url: formData.get("document_url") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid problem statement data");
  }

  const { title, source, status, document_url, notes } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("problem_statements")
    .insert({
      title,
      source,
      status: status as PSStatus,
      document_url: document_url || null,
      notes: notes || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create problem statement");
  }

  await writeAudit(supabase, {
    action: "create_problem_statement",
    entity: "problem_statement",
    entityId: data.id,
    after: { title, source, status },
  });

  revalidatePath("/hackcrypt");
  redirect(`/hackcrypt/ps/${data.id}`);
}

export async function updatePSStatusAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to update problem statement status.");
  }

  const psId = formData.get("psId")?.toString();
  const nextStatus = formData.get("status")?.toString() as PSStatus;

  if (!psId || !nextStatus) {
    throw new Error("Missing problem statement ID or target status");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("problem_statements")
    .select("status")
    .eq("id", psId)
    .single();

  const { error } = await supabase
    .from("problem_statements")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", psId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "update_problem_statement_status",
    entity: "problem_statement",
    entityId: psId,
    before: { status: existing?.status },
    after: { status: nextStatus },
  });

  revalidatePath("/hackcrypt");
  revalidatePath(`/hackcrypt/ps/${psId}`);
}

export async function deletePSAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to delete problem statement.");
  }

  const psId = formData.get("psId")?.toString();
  if (!psId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("problem_statements").delete().eq("id", psId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "delete_problem_statement",
    entity: "problem_statement",
    entityId: psId,
  });

  revalidatePath("/hackcrypt");
  redirect("/hackcrypt");
}

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  college: z.string().min(1, "College name is required"),
  status: z.enum(["pending", "confirmed", "dropped"]),
  problem_statement_id: z.string().optional(),
  notes: z.string().optional(),
  members_raw: z.string().optional(),
});

export async function createTeamAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to register teams.");
  }

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    college: formData.get("college"),
    status: formData.get("status") || "pending",
    problem_statement_id: formData.get("problem_statement_id") || undefined,
    notes: formData.get("notes") || undefined,
    members_raw: formData.get("members_raw") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid team registration input");
  }

  const { name, college, status, problem_statement_id, notes, members_raw } = parsed.data;

  let members: TeamMember[] = [];
  if (members_raw) {
    try {
      members = JSON.parse(members_raw);
    } catch {
      // fallback to newline separated names
      members = members_raw
        .split("\n")
        .map((m) => m.trim())
        .filter(Boolean)
        .map((n) => ({ name: n }));
    }
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      college,
      members: JSON.parse(JSON.stringify(members)),
      status: status as TeamStatus,
      problem_statement_id: problem_statement_id || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to register team");
  }

  await writeAudit(supabase, {
    action: "create_team",
    entity: "team",
    entityId: data.id,
    after: { name, college, status, membersCount: members.length },
  });

  revalidatePath("/hackcrypt");
  redirect(`/hackcrypt/teams/${data.id}`);
}

export async function updateTeamStatusAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to update team status.");
  }

  const teamId = formData.get("teamId")?.toString();
  const nextStatus = formData.get("status")?.toString() as TeamStatus;

  if (!teamId || !nextStatus) {
    throw new Error("Missing team ID or target status");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("teams").select("status").eq("id", teamId).single();

  const { error } = await supabase
    .from("teams")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "update_team_status",
    entity: "team",
    entityId: teamId,
    before: { status: existing?.status },
    after: { status: nextStatus },
  });

  revalidatePath("/hackcrypt");
  revalidatePath(`/hackcrypt/teams/${teamId}`);
}

export async function assignTeamPSAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to associate problem statement.");
  }

  const teamId = formData.get("teamId")?.toString();
  const psId = formData.get("problem_statement_id")?.toString() || null;

  if (!teamId) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .update({
      problem_statement_id: psId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "assign_team_problem_statement",
    entity: "team",
    entityId: teamId,
    after: { problem_statement_id: psId },
  });

  revalidatePath("/hackcrypt");
  revalidatePath(`/hackcrypt/teams/${teamId}`);
}

export async function deleteTeamAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to delete team.");
  }

  const teamId = formData.get("teamId")?.toString();
  if (!teamId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "delete_team",
    entity: "team",
    entityId: teamId,
  });

  revalidatePath("/hackcrypt");
  redirect("/hackcrypt");
}
