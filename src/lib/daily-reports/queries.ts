// FILE: src/lib/daily-reports/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { DailyReportRow, ProfileRow } from "@/types/database";

export type DailyReportWithProfile = DailyReportRow & {
  profile?: ProfileRow;
  reviewer?: ProfileRow;
};

export async function getUserDailyReports(userId: string): Promise<DailyReportWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_reports")
    .select(`
      *,
      profile:profiles!daily_reports_user_id_fkey(id, full_name, email, role, department),
      reviewer:profiles!daily_reports_reviewer_id_fkey(id, full_name, role)
    `)
    .eq("user_id", userId)
    .order("report_date", { ascending: false });

  if (error) {
    console.error("Error fetching user daily reports:", error);
    return [];
  }

  return (data as unknown as DailyReportWithProfile[]) || [];
}

export async function getDailyReportForDate(userId: string, reportDate: string): Promise<DailyReportWithProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_reports")
    .select(`
      *,
      profile:profiles!daily_reports_user_id_fkey(id, full_name, email, role, department),
      reviewer:profiles!daily_reports_reviewer_id_fkey(id, full_name, role)
    `)
    .eq("user_id", userId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (error) {
    console.error("Error fetching report for date:", error);
    return null;
  }

  return (data as unknown as DailyReportWithProfile) || null;
}

export async function getLeadershipDailyDigest(reportDate: string) {
  const supabase = await createClient();

  // Fetch all active profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department")
    .eq("is_active", true)
    .neq("role", "faculty");

  // Fetch submitted reports for the date
  const { data: reports } = await supabase
    .from("daily_reports")
    .select(`
      *,
      profile:profiles!daily_reports_user_id_fkey(id, full_name, email, role, department),
      reviewer:profiles!daily_reports_reviewer_id_fkey(id, full_name, role)
    `)
    .eq("report_date", reportDate);

  const reportsMap = new Map<string, DailyReportWithProfile>();
  if (reports) {
    (reports as unknown as DailyReportWithProfile[]).forEach((r) => {
      reportsMap.set(r.user_id, r);
    });
  }

  const activeMembers = (profiles as unknown as ProfileRow[]) || [];
  const submittedList: { profile: ProfileRow; report: DailyReportWithProfile }[] = [];
  const missingList: ProfileRow[] = [];

  activeMembers.forEach((p) => {
    const report = reportsMap.get(p.id);
    if (report && report.status !== "draft") {
      submittedList.push({ profile: p, report });
    } else {
      missingList.push(p);
    }
  });

  return {
    reportDate,
    totalMembers: activeMembers.length,
    submittedCount: submittedList.length,
    missingCount: missingList.length,
    submittedList,
    missingList,
  };
}
