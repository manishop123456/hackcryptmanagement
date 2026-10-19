// FILE: src/app/(app)/radar/page.tsx
import Link from "next/link";
import { AlertTriangle, Clock, ShieldAlert, ArrowRight, UserX, Share2, CheckCircle2 } from "lucide-react";

import { requireActiveProfile } from "@/lib/auth";
import { getDeadlineRadarOverview } from "@/lib/radar/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlainDate } from "@/lib/utils";

import { DEPARTMENTS, DEPARTMENT_LABELS, type Department } from "@/lib/constants";

export const metadata = {
  title: "Deadline Radar & Escalation Chain | DevClub Management",
};

export default async function DeadlineRadarPage({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string }>;
}) {
  await requireActiveProfile();
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedDept = (resolvedParams.department as Department) || "all";
  const radarData = await getDeadlineRadarOverview(selectedDept);

  const totalAlerts =
    radarData.overdueTasks.length +
    radarData.missingDailyReports.length +
    radarData.pendingSocialPosts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-strong flex items-center gap-2">
            <ShieldAlert className="size-6 text-danger" /> Deadline Radar & Escalation Chain
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time radar for overdue deliverables, missing work logs, and high-priority bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form method="get" action="/radar" className="flex items-center gap-1.5">
            <select
              name="department"
              defaultValue={selectedDept}
              className="rounded-xl border border-border bg-surface-1 px-3 py-1 text-xs text-foreground font-mono focus:border-accent focus:outline-none"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {DEPARTMENT_LABELS[d]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
              Filter
            </Button>
          </form>

          <Badge variant={totalAlerts > 0 ? "danger" : "success"} className="px-3 py-1 text-xs">
            {totalAlerts > 0 ? `${totalAlerts} Active Operational Alerts` : "All Operations Clear"}
          </Badge>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-danger/30 bg-danger/5">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-danger flex items-center gap-1.5">
              <AlertTriangle className="size-4" /> Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-danger font-mono">{radarData.overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Past deadline & uncompleted</p>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-warning flex items-center gap-1.5">
              <UserX className="size-4" /> Unsubmitted Work Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-warning font-mono">{radarData.missingDailyReports.length}</div>
            <p className="text-xs text-muted-foreground">Pending daily report for today</p>
          </CardContent>
        </Card>

        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-accent flex items-center gap-1.5">
              <Share2 className="size-4" /> Urgent Social Media Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-accent font-mono">{radarData.pendingSocialPosts.length}</div>
            <p className="text-xs text-muted-foreground">Pending review or past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* 1. Overdue Tasks Radar Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-strong flex items-center gap-2">
            <Clock className="size-5 text-danger" /> Overdue Tasks ({radarData.overdueTasks.length})
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link href="/tasks">
              View All Tasks <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {radarData.overdueTasks.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> No overdue tasks! All assignments are on track.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {radarData.overdueTasks.map((t) => (
              <Card key={t.id} className="border-danger/40 bg-surface-1">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-danger font-semibold uppercase">
                      {t.department} • {t.priority} priority
                    </span>
                    <Badge variant="danger" className="text-[10px]">
                      Overdue
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-strong mt-1">
                    <Link href={`/tasks?task=${t.id}`} className="hover:underline">
                      {t.title}
                    </Link>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Assignee:</span>
                    <span className="font-semibold text-foreground">{t.owner?.full_name ?? "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Deadline:</span>
                    <span className="font-mono font-semibold text-danger">
                      {formatPlainDate(t.deadline.split("T")[0])}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 2. Missing Work Logs Matrix */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-strong flex items-center gap-2">
            <UserX className="size-5 text-warning" /> Missing Daily Reports Today ({radarData.missingDailyReports.length})
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link href="/daily-reports/digest">
              Leadership Digest <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {radarData.missingDailyReports.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> 100% daily report submission completed today!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {radarData.missingDailyReports.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-strong">{member.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {member.role} • {member.department || "No Dept"}
                  </p>
                </div>
                <Badge variant="warning" className="text-[10px]">
                  Log Missing
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Pending Social Media Deadlines */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-strong flex items-center gap-2">
            <Share2 className="size-5 text-accent" /> Urgent Social Media Deliverables ({radarData.pendingSocialPosts.length})
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link href="/social-media">
              Control Room <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {radarData.pendingSocialPosts.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> All social media post schedules are up to date!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {radarData.pendingSocialPosts.map((post) => (
              <Card key={post.id} className="border-accent/40 bg-surface-1">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-accent font-semibold capitalize">
                      {post.platform}
                    </span>
                    <Badge variant="accent" className="text-[10px]">
                      {post.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-strong mt-1">
                    {post.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Target Date:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatPlainDate(post.publishing_deadline.split("T")[0])}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
