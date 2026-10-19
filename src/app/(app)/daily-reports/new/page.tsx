// FILE: src/app/(app)/daily-reports/new/page.tsx
import { requireActiveProfile } from "@/lib/auth";
import { getDailyReportForDate } from "@/lib/daily-reports/queries";
import { getTasksForUser } from "@/lib/tasks/queries";
import { DailyReportFormClient } from "./report-form-client";

export const metadata = {
  title: "Log Daily Work | DevClub Management",
};

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function NewDailyReportPage(props: PageProps) {
  const currentUser = await requireActiveProfile();

  const searchParams = await props.searchParams;
  const targetDate = searchParams?.date || new Date().toISOString().split("T")[0];

  const [existingReport, userTasks] = await Promise.all([
    getDailyReportForDate(currentUser.id, targetDate),
    getTasksForUser(currentUser.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strong">
          {existingReport ? "Edit Daily Work Log" : "New Daily Work Log"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Record your progress, hours, proof links, and blockers for <span className="font-mono text-accent">{targetDate}</span>.
        </p>
      </div>

      <DailyReportFormClient
        targetDate={targetDate}
        existingReport={existingReport}
        userTasks={userTasks}
      />
    </div>
  );
}
