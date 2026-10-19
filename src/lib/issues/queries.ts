// FILE: src/lib/issues/queries.ts
import { createClient } from "@/lib/supabase/server";

export interface IssueRow {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  department: string;
  raised_by: string;
  current_level: "member" | "team_lead" | "management_head" | "president_vp" | "faculty";
  status: "open" | "escalated" | "resolved";
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  raiser?: { full_name: string | null; email: string | null } | null;
}

export async function getIssues(): Promise<IssueRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("issues")
    .select(`
      *,
      raiser:profiles!issues_raised_by_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false });

  return (data as unknown as IssueRow[]) || [];
}
