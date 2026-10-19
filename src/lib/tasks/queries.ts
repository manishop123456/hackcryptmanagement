// FILE: src/lib/tasks/queries.ts
// Data access functions for the Tasks module.

import { createClient } from "@/lib/supabase/server";
import type { Department, Priority, TaskStatus } from "@/lib/constants";
import type { PhaseRow, ProfileRow, TaskCommentRow, TaskHistoryRow, TaskRow } from "@/types/database";

export type TaskWithDetails = TaskRow & {
  owner: ProfileRow;
  assigned_by_profile: ProfileRow | null;
  phase: PhaseRow | null;
};

export type TaskCommentWithAuthor = TaskCommentRow & {
  author: ProfileRow;
};

export type TaskHistoryWithActor = TaskHistoryRow & {
  actor: ProfileRow | null;
};

export type TaskFilters = {
  department?: Department | "all";
  status?: TaskStatus | "all";
  priority?: Priority | "all";
  owner_id?: string | "all";
  phase_id?: string | "all";
  search?: string;
  my_tasks_only?: boolean;
  overdue_only?: boolean;
};

export async function getTasks(filters: TaskFilters = {}) {
  const supabase = await createClient();

  // Ensure any past-deadline tasks are marked as delayed in the database
  try {
    await supabase.rpc("sync_delayed_tasks");
  } catch (err) {
    console.error("[tasks] sync_delayed_tasks failed", err);
  }

  let query = supabase
    .from("tasks")
    .select(`
      *,
      owner:profiles!tasks_owner_id_fkey(*),
      assigned_by_profile:profiles!tasks_assigned_by_fkey(*),
      phase:phases!tasks_phase_id_fkey(*)
    `)
    .order("deadline", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.department && filters.department !== "all") {
    query = query.eq("department", filters.department);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  if (filters.owner_id && filters.owner_id !== "all") {
    query = query.eq("owner_id", filters.owner_id);
  }

  if (filters.phase_id && filters.phase_id !== "all") {
    query = query.eq("phase_id", filters.phase_id);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  if (filters.overdue_only) {
    const now = new Date().toISOString();
    query = query.neq("status", "completed").neq("status", "cancelled").lt("deadline", now);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[tasks] getTasks error:", error);
    return [];
  }

  return (data ?? []) as unknown as TaskWithDetails[];
}

export async function getTasksForUser(userId: string): Promise<TaskWithDetails[]> {
  return getTasks({ owner_id: userId });
}

export async function getTaskById(id: string): Promise<TaskWithDetails | null> {
  const supabase = await createClient();

  try {
    await supabase.rpc("sync_delayed_tasks");
  } catch (err) {
    console.error("[tasks] sync_delayed_tasks in getTaskById failed", err);
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      owner:profiles!tasks_owner_id_fkey(*),
      assigned_by_profile:profiles!tasks_assigned_by_fkey(*),
      phase:phases!tasks_phase_id_fkey(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[tasks] getTaskById error:", error);
    return null;
  }

  return data as unknown as TaskWithDetails;
}

export async function getTaskComments(taskId: string): Promise<TaskCommentWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_comments")
    .select(`
      *,
      author:profiles!task_comments_author_id_fkey(*)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[tasks] getTaskComments error:", error);
    return [];
  }

  return (data ?? []) as unknown as TaskCommentWithAuthor[];
}

export async function getTaskHistory(taskId: string): Promise<TaskHistoryWithActor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_history")
    .select(`
      *,
      actor:profiles!task_history_changed_by_fkey(*)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getTaskHistory error:", error);
    return [];
  }

  return (data ?? []) as unknown as TaskHistoryWithActor[];
}

export async function getAssignableProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("[tasks] getAssignableProfiles error:", error);
    return [];
  }

  return data ?? [];
}

export async function getPhases(): Promise<PhaseRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("phases")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[tasks] getPhases error:", error);
    return [];
  }

  return data ?? [];
}
