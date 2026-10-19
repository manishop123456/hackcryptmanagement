// FILE: src/app/(app)/tasks/actions.ts
"use server";

import { revalidatePath } from "next/cache";

import { writeAudit } from "@/lib/audit";
import { getCurrentProfile, toActor } from "@/lib/auth";
import { canWriteDepartment, isPlainMember } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  createTaskCommentSchema,
  createTaskSchema,
  deleteTaskCommentSchema,
  deleteTaskSchema,
  firstIssue,
  quickStatusUpdateSchema,
  updateTaskSchema,
} from "@/lib/validations/tasks";
import { type Department } from "@/lib/constants";
import type { Database, ProfileRow } from "@/types/database";

type TaskUpdatePayload = Database["public"]["Tables"]["tasks"]["Update"];
import type { TaskActionState } from "@/lib/tasks/constants";
export type { TaskActionState };

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readNullableString(formData: FormData, key: string): string | null {
  const value = readString(formData, key);
  if (!value || value.trim() === "" || value === "none") return null;
  return value.trim();
}

function readArrayString(formData: FormData, key: string): string[] {
  const value = formData.getAll(key);
  return value.map((v) => (typeof v === "string" ? v : "")).filter(Boolean);
}

async function requireUser(): Promise<
  { ok: true; profile: ProfileRow } | { ok: false; message: string }
> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    return { ok: false, message: "Your session has ended. Sign in again." };
  }
  return { ok: true, profile };
}

function describeTaskError(code: string | undefined): string {
  if (code === "42501") return "You do not have permission to perform this task action.";
  if (code === "23503") return "Referenced user or phase does not exist.";
  if (code === "23514") return "A completed task requires an output link or note.";
  return "Could not save task changes. Please try again.";
}

export async function createTask(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const auth = await requireUser();
  if (!auth.ok) return { status: "error", message: auth.message };

  const actor = toActor(auth.profile);
  const department = readString(formData, "department") as Department;

  if (!canWriteDepartment(actor, department)) {
    return { status: "error", message: "You do not have permission to create tasks for this department." };
  }

  const parsed = createTaskSchema.safeParse({
    title: readString(formData, "title"),
    description: readNullableString(formData, "description"),
    department,
    owner_id: readString(formData, "owner_id"),
    deadline: readString(formData, "deadline"),
    priority: readString(formData, "priority") || "medium",
    status: readString(formData, "status") || "not_started",
    output: readNullableString(formData, "output"),
    remarks: readNullableString(formData, "remarks"),
    phase_id: readNullableString(formData, "phase_id"),
    blocked_by: readArrayString(formData, "blocked_by"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const taskData = parsed.data;
  const supabase = await createClient();

  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      title: taskData.title,
      description: taskData.description,
      department: taskData.department,
      owner_id: taskData.owner_id,
      assigned_by: auth.profile.id,
      deadline: new Date(taskData.deadline).toISOString(),
      priority: taskData.priority,
      status: taskData.status,
      output: taskData.output,
      remarks: taskData.remarks,
      phase_id: taskData.phase_id,
      blocked_by: taskData.blocked_by,
    })
    .select("id")
    .single();

  if (error || !newTask) {
    console.error("[tasks] createTask failed:", error);
    return { status: "error", message: describeTaskError(error?.code) };
  }

  await writeAudit(supabase, {
    action: "task.created",
    entity: "task",
    entityId: newTask.id,
    after: { title: taskData.title, owner_id: taskData.owner_id, deadline: taskData.deadline },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { status: "success", message: `Task "${taskData.title}" created successfully.`, taskId: newTask.id };
}

export async function updateTask(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const auth = await requireUser();
  if (!auth.ok) return { status: "error", message: auth.message };

  const id = readString(formData, "id");
  const supabase = await createClient();

  // Fetch current task state
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { status: "error", message: "Task not found." };
  }

  const actor = toActor(auth.profile);
  const isOwner = auth.profile.id === existing.owner_id;
  const isLeadOrCore = canWriteDepartment(actor, existing.department);

  if (!isLeadOrCore && !isOwner) {
    return { status: "error", message: "You are not authorized to update this task." };
  }

  // Parse inputs
  const parsed = updateTaskSchema.safeParse({
    id,
    title: readString(formData, "title") || existing.title,
    description: readNullableString(formData, "description"),
    department: readString(formData, "department") || existing.department,
    owner_id: readString(formData, "owner_id") || existing.owner_id,
    deadline: readString(formData, "deadline") || existing.deadline,
    priority: readString(formData, "priority") || existing.priority,
    status: readString(formData, "status") || existing.status,
    output: readNullableString(formData, "output"),
    remarks: readNullableString(formData, "remarks"),
    phase_id: readNullableString(formData, "phase_id"),
    blocked_by: readArrayString(formData, "blocked_by"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const updateData = parsed.data;

  // Plain members can ONLY change status, output, and remarks
  if (isPlainMember(auth.profile.role) && !isLeadOrCore) {
    if (
      updateData.title !== existing.title ||
      updateData.description !== existing.description ||
      updateData.department !== existing.department ||
      updateData.owner_id !== existing.owner_id ||
      updateData.deadline !== existing.deadline ||
      updateData.priority !== existing.priority ||
      updateData.phase_id !== existing.phase_id
    ) {
      return {
        status: "error",
        message: "Members can only update status, output, and remarks for their assigned tasks.",
      };
    }
  }

  const payload: TaskUpdatePayload = isLeadOrCore
    ? {
        title: updateData.title,
        description: updateData.description,
        department: updateData.department,
        owner_id: updateData.owner_id,
        deadline: new Date(updateData.deadline).toISOString(),
        priority: updateData.priority,
        status: updateData.status,
        output: updateData.output,
        remarks: updateData.remarks,
        phase_id: updateData.phase_id,
        blocked_by: updateData.blocked_by,
      }
    : {
        status: updateData.status,
        output: updateData.output,
        remarks: updateData.remarks,
      };

  const { error: updateError } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id);

  if (updateError) {
    console.error("[tasks] updateTask failed:", updateError);
    return { status: "error", message: describeTaskError(updateError.code) };
  }

  await writeAudit(supabase, {
    action: "task.updated",
    entity: "task",
    entityId: id,
    before: { status: existing.status, owner_id: existing.owner_id },
    after: { status: updateData.status, owner_id: updateData.owner_id },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/");

  return { status: "success", message: "Task updated successfully.", taskId: id };
}

export async function quickUpdateTaskStatus(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const auth = await requireUser();
  if (!auth.ok) return { status: "error", message: auth.message };

  const id = readString(formData, "id");
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { status: "error", message: "Task not found." };
  }

  const actor = toActor(auth.profile);
  const isOwner = auth.profile.id === existing.owner_id;
  const isLeadOrCore = canWriteDepartment(actor, existing.department);

  if (!isLeadOrCore && !isOwner) {
    return { status: "error", message: "You are not authorized to update this task status." };
  }

  const parsed = quickStatusUpdateSchema.safeParse({
    id,
    status: readString(formData, "status"),
    output: readNullableString(formData, "output") || existing.output,
    remarks: readNullableString(formData, "remarks") || existing.remarks,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { status, output, remarks } = parsed.data;

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ status, output, remarks })
    .eq("id", id);

  if (updateError) {
    console.error("[tasks] quickUpdateTaskStatus failed:", updateError);
    return { status: "error", message: describeTaskError(updateError.code) };
  }

  await writeAudit(supabase, {
    action: "task.status_changed",
    entity: "task",
    entityId: id,
    before: { status: existing.status },
    after: { status },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/");

  return { status: "success", message: `Task status moved to ${status}.`, taskId: id };
}

export async function deleteTask(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const auth = await requireUser();
  if (!auth.ok) return { status: "error", message: auth.message };

  const parsed = deleteTaskSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { id } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  if (!existing) {
    return { status: "error", message: "Task not found." };
  }

  const actor = toActor(auth.profile);
  if (!canWriteDepartment(actor, existing.department)) {
    return { status: "error", message: "You do not have permission to delete tasks in this department." };
  }

  const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);

  if (deleteError) {
    console.error("[tasks] deleteTask failed:", deleteError);
    return { status: "error", message: describeTaskError(deleteError.code) };
  }

  await writeAudit(supabase, {
    action: "task.deleted",
    entity: "task",
    entityId: id,
    before: { title: existing.title, department: existing.department },
  });

  revalidatePath("/tasks");
  revalidatePath("/");

  return { status: "success", message: `Task "${existing.title}" deleted.` };
}

export async function addTaskComment(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const auth = await requireUser();
  if (!auth.ok) return { status: "error", message: auth.message };

  const parsed = createTaskCommentSchema.safeParse({
    task_id: readString(formData, "task_id"),
    body: readString(formData, "body"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { task_id, body } = parsed.data;
  const supabase = await createClient();

  const { error: commentError } = await supabase.from("task_comments").insert({
    task_id,
    author_id: auth.profile.id,
    body,
  });

  if (commentError) {
    console.error("[tasks] addTaskComment failed:", commentError);
    return { status: "error", message: describeTaskError(commentError.code) };
  }

  revalidatePath(`/tasks/${task_id}`);
  return { status: "success", message: "Comment added." };
}

export async function deleteTaskComment(
  _previous: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const auth = await requireUser();
  if (!auth.ok) return { status: "error", message: auth.message };

  const parsed = deleteTaskCommentSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { id } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("task_comments")
    .select("id, task_id, author_id, tasks!inner(department)")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return { status: "error", message: "Comment not found." };
  }

  const actor = toActor(auth.profile);
  const isAuthor = existing.author_id === auth.profile.id;
  const taskDept = (existing.tasks as unknown as { department: Department } | null)?.department ?? null;
  const isLead = canWriteDepartment(actor, taskDept);

  if (!isAuthor && !isLead) {
    return { status: "error", message: "You are not authorized to delete this comment." };
  }

  const { error: deleteError } = await supabase.from("task_comments").delete().eq("id", id);

  if (deleteError) {
    console.error("[tasks] deleteTaskComment failed:", deleteError);
    return { status: "error", message: describeTaskError(deleteError.code) };
  }

  revalidatePath(`/tasks/${existing.task_id}`);
  return { status: "success", message: "Comment deleted." };
}
