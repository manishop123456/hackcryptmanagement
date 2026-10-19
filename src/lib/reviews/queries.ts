// FILE: src/lib/reviews/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Department } from "@/lib/constants";

export interface WeeklyReportRow {
  id: string;
  author_id: string;
  department: string;
  week_start: string;
  assigned: number;
  completed: number;
  pending: number;
  delayed: number;
  participation: string | null;
  attendance_rate: number;
  problems: string | null;
  support_needed: string | null;
  next_tasks: string | null;
  status_rag: "green" | "yellow" | "red";
  submitted_at: string;
  author?: { full_name: string | null; email: string | null } | null;
}

export async function getWeeklyReports(department?: string): Promise<WeeklyReportRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("weekly_reports")
    .select(`
      *,
      author:profiles!weekly_reports_author_id_fkey(full_name, email)
    `)
    .order("week_start", { ascending: false });

  if (department) {
    query = query.eq("department", department as unknown as Department);
  }

  const { data } = await query;
  return (data as unknown as WeeklyReportRow[]) || [];
}

export async function getWeeklyReportById(id: string): Promise<WeeklyReportRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_reports")
    .select(`
      *,
      author:profiles!weekly_reports_author_id_fkey(full_name, email)
    `)
    .eq("id", id)
    .single();

  return (data as unknown as WeeklyReportRow) || null;
}
