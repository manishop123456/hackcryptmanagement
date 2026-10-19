import { createClient } from "@/lib/supabase/server";
import { getTasks, type TaskWithDetails } from "@/lib/tasks/queries";
import { getLeadershipDailyDigest } from "@/lib/daily-reports/queries";
import { getSocialMediaPosts, type SocialMediaPostWithDetails } from "@/lib/social-media/queries";
import type { Department } from "@/lib/constants";
import type { ProfileRow } from "@/types/database";

export type RadarOverviewData = {
  overdueTasks: TaskWithDetails[];
  missingDailyReports: ProfileRow[];
  pendingSocialPosts: SocialMediaPostWithDetails[];
  todayStr: string;
};

export async function getDeadlineRadarOverview(
  department?: Department | "all"
): Promise<RadarOverviewData> {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  // Sync past deadline tasks
  try {
    await supabase.rpc("sync_delayed_tasks");
  } catch (err) {
    console.error("Radar sync_delayed_tasks error:", err);
  }

  const isSpecificDept = department && department !== "all";

  const [overdueTasksRaw, dailyDigest, socialPosts] = await Promise.all([
    getTasks({
      overdue_only: true,
      department: isSpecificDept ? department : undefined,
    }),
    getLeadershipDailyDigest(todayStr),
    getSocialMediaPosts(),
  ]);

  const overdueTasks = isSpecificDept
    ? overdueTasksRaw.filter((t) => t.department === department)
    : overdueTasksRaw;

  const missingDailyReports = isSpecificDept
    ? dailyDigest.missingList.filter((m) => m.department === department)
    : dailyDigest.missingList;

  const now = new Date();
  const pendingSocialPosts = socialPosts.filter((p) => {
    if (p.status === "published") return false;
    const deadline = new Date(p.publishing_deadline);
    return deadline <= now || p.status === "revisions_requested" || p.status === "in_review";
  });

  return {
    overdueTasks,
    missingDailyReports,
    pendingSocialPosts,
    todayStr,
  };
}
