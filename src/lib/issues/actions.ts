// FILE: src/lib/issues/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile, toActor } from "@/lib/auth";
import { canWriteDepartment } from "@/lib/permissions";
import type { Department } from "@/lib/constants";

const createIssueSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  department: z.string().min(1),
});

export async function createIssueAction(formData: FormData) {
  const profile = await requireActiveProfile();

  const parsed = createIssueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    department: formData.get("department"),
  });

  if (!parsed.success) {
    throw new Error("Invalid issue parameters provided");
  }

  const { title, description, severity, department } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("issues").insert({
    title,
    description,
    severity,
    department: department as unknown as Department,
    raised_by: profile.id,
    current_level: "team_lead",
    status: "open",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/issues");
  redirect("/issues");
}

export async function escalateIssueAction(formData: FormData) {
  const profile = await requireActiveProfile();
  const issueId = formData.get("issueId")?.toString();
  const currentLevel = formData.get("currentLevel")?.toString();

  if (!issueId || !currentLevel) return;

  const supabase = await createClient();
  const { data: issue } = await supabase
    .from("issues")
    .select("id, raised_by, department, status")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) return;

  const actor = toActor(profile);
  const isAuthor = issue.raised_by === profile.id;
  const isLeadOrCore = canWriteDepartment(actor, issue.department);

  if (!isAuthor && !isLeadOrCore) {
    throw new Error("You are not authorized to escalate this issue.");
  }

  const levelMap: Record<string, "team_lead" | "management_head" | "president_vp" | "faculty"> = {
    member: "team_lead",
    team_lead: "management_head",
    management_head: "president_vp",
    president_vp: "faculty",
  };

  const nextLevel = levelMap[currentLevel] || "faculty";

  await supabase
    .from("issues")
    .update({
      current_level: nextLevel,
      status: "escalated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  revalidatePath("/issues");
}

export async function resolveIssueAction(formData: FormData) {
  const profile = await requireActiveProfile();
  const issueId = formData.get("issueId")?.toString();
  if (!issueId) return;

  const supabase = await createClient();
  const { data: issue } = await supabase
    .from("issues")
    .select("id, raised_by, department, status")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) return;

  const actor = toActor(profile);
  const isAuthor = issue.raised_by === profile.id;
  const isLeadOrCore = canWriteDepartment(actor, issue.department);

  if (!isAuthor && !isLeadOrCore) {
    throw new Error("You are not authorized to resolve this issue.");
  }

  await supabase
    .from("issues")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  revalidatePath("/issues");
}
