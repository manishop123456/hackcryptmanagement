// FILE: src/lib/hackcrypt/queries.ts
import { createClient } from "@/lib/supabase/server";

export type PSStatus = "submitted" | "under_review" | "changes_requested" | "finalised";
export type TeamStatus = "pending" | "confirmed" | "dropped";

export interface TeamMember {
  name: string;
  email?: string;
  role?: string;
  phone?: string;
}

export interface ProblemStatementRow {
  id: string;
  title: string;
  source: string;
  status: PSStatus;
  document_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: { full_name: string | null; email: string | null } | null;
  teams_count?: number;
}

export interface TeamRow {
  id: string;
  name: string;
  college: string;
  members: TeamMember[];
  status: TeamStatus;
  notes: string | null;
  problem_statement_id: string | null;
  created_at: string;
  updated_at: string;
  problem_statement?: {
    id: string;
    title: string;
    status: PSStatus;
  } | null;
}

export interface HackCryptOverviewStats {
  totalPS: number;
  finalisedPS: number;
  totalTeams: number;
  confirmedTeams: number;
  totalParticipants: number;
}

export async function getProblemStatements(): Promise<ProblemStatementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_statements")
    .select(`
      *,
      creator:profiles!problem_statements_created_by_fkey(full_name, email),
      teams:teams(id)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[hackcrypt] Error fetching problem statements:", error.message);
    return [];
  }

  return (data || []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ...r,
      teams_count: Array.isArray(r.teams) ? r.teams.length : 0,
    };
  }) as ProblemStatementRow[];
}

export async function getProblemStatementById(id: string): Promise<ProblemStatementRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_statements")
    .select(`
      *,
      creator:profiles!problem_statements_created_by_fkey(full_name, email),
      teams:teams(id)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    teams_count: Array.isArray(raw.teams) ? raw.teams.length : 0,
  } as ProblemStatementRow;
}

export async function getTeams(): Promise<TeamRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      problem_statement:problem_statements!teams_problem_statement_id_fkey(id, title, status)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[hackcrypt] Error fetching teams:", error.message);
    return [];
  }

  return (data || []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ...r,
      members: Array.isArray(r.members) ? (r.members as unknown as TeamMember[]) : [],
    };
  }) as TeamRow[];
}

export async function getTeamById(id: string): Promise<TeamRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      problem_statement:problem_statements!teams_problem_statement_id_fkey(id, title, status)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    members: Array.isArray(raw.members) ? (raw.members as unknown as TeamMember[]) : [],
  } as TeamRow;
}

export async function getHackCryptStats(): Promise<HackCryptOverviewStats> {
  const [psList, teamsList] = await Promise.all([getProblemStatements(), getTeams()]);

  const totalPS = psList.length;
  const finalisedPS = psList.filter((p) => p.status === "finalised").length;
  const totalTeams = teamsList.length;
  const confirmedTeams = teamsList.filter((t) => t.status === "confirmed").length;
  const totalParticipants = teamsList.reduce((acc, team) => acc + (team.members?.length || 0), 0);

  return {
    totalPS,
    finalisedPS,
    totalTeams,
    confirmedTeams,
    totalParticipants,
  };
}
