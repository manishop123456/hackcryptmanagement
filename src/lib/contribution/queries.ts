// FILE: src/lib/contribution/queries.ts
import { createClient } from "@/lib/supabase/server";
import { getMemberAttendanceStats } from "@/lib/attendance/queries";

export interface MemberContributionScore {
  memberId: string;
  fullName: string;
  email: string;
  department: string | null;
  role: string;
  taskScore: number;
  attendanceScore: number;
  leadRating: number;
  overallScore: number;
  assignedTasks: number;
  completedTasks: number;
  delayedTasks: number;
  majorContribution?: string | null;
}

export async function calculateMemberContribution(memberId: string): Promise<MemberContributionScore> {
  const supabase = await createClient();

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department")
    .eq("id", memberId)
    .single();

  if (!profile) {
    throw new Error("Member profile not found");
  }

  // 2. Task Score Calculation (50% weight)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("owner_id", memberId);

  const taskList = tasks || [];
  const assignedTasks = taskList.length;
  const completedTasks = taskList.filter((t) => t.status === "completed").length;
  const delayedTasks = taskList.filter((t) => t.status === "delayed").length;

  const taskCompletionRate = assignedTasks > 0 ? (completedTasks / assignedTasks) * 100 : 100;
  // Apply minor penalty for delayed tasks
  const delayedPenalty = assignedTasks > 0 ? (delayedTasks / assignedTasks) * 20 : 0;
  const taskScore = Math.max(0, Math.min(100, Math.round(taskCompletionRate - delayedPenalty)));

  // 3. Attendance Score Calculation (30% weight)
  const attStats = await getMemberAttendanceStats(memberId);
  const attendanceScore = attStats.percentage;

  // 4. Lead Rating Calculation (20% weight)
  const { data: ratingRow } = await supabase
    .from("contribution_ratings")
    .select("rating, major_contribution")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const leadRating = ratingRow?.rating ?? 85; // Default 85 if not manually rated yet
  const majorContribution = ratingRow?.major_contribution || null;

  // Overall Score Formula: 50% Task Score + 30% Attendance Score + 20% Lead Rating
  const overallScore = Math.round(taskScore * 0.5 + attendanceScore * 0.3 + leadRating * 0.2);

  return {
    memberId: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    department: profile.department,
    role: profile.role,
    taskScore,
    attendanceScore,
    leadRating,
    overallScore,
    assignedTasks,
    completedTasks,
    delayedTasks,
    majorContribution,
  };
}

export async function getAllMembersContributions(): Promise<MemberContributionScore[]> {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true);

  if (!profiles) return [];

  const scores = await Promise.all(
    profiles.map((p) => calculateMemberContribution(p.id))
  );

  return scores.sort((a, b) => b.overallScore - a.overallScore);
}
