// FILE: src/lib/reviews/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile, toActor } from "@/lib/auth";
import { canWriteDepartment } from "@/lib/permissions";
import type { Department } from "@/lib/constants";

const submitWeeklyReportSchema = z.object({
  department: z.string().min(1),
  weekStart: z.string().min(1),
  assigned: z.number().min(0),
  completed: z.number().min(0),
  pending: z.number().min(0),
  delayed: z.number().min(0),
  participation: z.string().optional(),
  attendanceRate: z.number().min(0).max(100),
  problems: z.string().optional(),
  supportNeeded: z.string().optional(),
  nextTasks: z.string().optional(),
});

export async function submitWeeklyReportAction(formData: FormData) {
  const profile = await requireActiveProfile();

  const parsed = submitWeeklyReportSchema.safeParse({
    department: formData.get("department"),
    weekStart: formData.get("weekStart"),
    assigned: Number(formData.get("assigned") || 0),
    completed: Number(formData.get("completed") || 0),
    pending: Number(formData.get("pending") || 0),
    delayed: Number(formData.get("delayed") || 0),
    participation: formData.get("participation")?.toString() || "",
    attendanceRate: Number(formData.get("attendanceRate") || 100),
    problems: formData.get("problems")?.toString() || "",
    supportNeeded: formData.get("supportNeeded")?.toString() || "",
    nextTasks: formData.get("nextTasks")?.toString() || "",
  });

  if (!parsed.success) {
    throw new Error("Invalid form data provided");
  }

  const {
    department,
    weekStart,
    assigned,
    completed,
    pending,
    delayed,
    participation,
    attendanceRate,
    problems,
    supportNeeded,
    nextTasks,
  } = parsed.data;

  const actor = toActor(profile);
  if (
    profile.role === "member" ||
    profile.role === "faculty" ||
    !canWriteDepartment(actor, department as unknown as Department)
  ) {
    throw new Error("You are not authorized to submit weekly reports for this department.");
  }

  // Compute RAG Status: Red if delayed > 30% or high priority overdue; Yellow if delayed 10-30% or attendance < 70%; Green otherwise
  const delayedRatio = assigned > 0 ? (delayed / assigned) * 100 : 0;
  let statusRag: "green" | "yellow" | "red" = "green";
  if (delayedRatio > 30) {
    statusRag = "red";
  } else if (delayedRatio >= 10 || attendanceRate < 70) {
    statusRag = "yellow";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("weekly_reports").insert({
    author_id: profile.id,
    department: department as unknown as Department,
    week_start: weekStart,
    assigned,
    completed,
    pending,
    delayed,
    participation,
    attendance_rate: attendanceRate,
    problems,
    support_needed: supportNeeded,
    next_tasks: nextTasks,
    status_rag: statusRag,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reviews");
  revalidatePath("/");
  redirect("/reviews");
}
