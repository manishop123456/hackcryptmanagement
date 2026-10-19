// FILE: src/app/(app)/daily-reports/page.tsx
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, FileText, Plus, ShieldQuestion, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserDailyReports } from "@/lib/daily-reports/queries";
import { requireActiveProfile } from "@/lib/auth";
import { formatPlainDate } from "@/lib/utils";

export const metadata = {
  title: "Daily Work Reports | DevClub Management",
};

export default async function DailyReportsPage() {
  const currentUser = await requireActiveProfile();

  const reports = await getUserDailyReports(currentUser.id);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayReport = reports.find((r) => r.report_date === todayStr);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-strong">Daily Work Reports</h1>
          <p className="text-sm text-muted-foreground">
            Log your work daily. Transparency and accountability keep DevClub thriving.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.role !== "member" ? (
            <Button variant="outline" asChild className="gap-2">
              <Link href="/daily-reports/digest">
                <FileText className="size-4" />
                Leadership Digest
              </Link>
            </Button>
          ) : null}

          <Button variant="default" asChild className="gap-2">
            <Link href="/daily-reports/new">
              <Plus className="size-4" />
              {todayReport ? "Update Today's Log" : "Log Today's Work"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Today's Status Banner */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider">Today&apos;s Status ({todayStr})</p>
              <h2 className="text-base font-semibold text-strong">
                {todayReport
                  ? todayReport.status === "draft"
                    ? "Draft Saved (Not Submitted)"
                    : `Report ${todayReport.status.replace("_", " ")}`
                  : "No report submitted yet for today"}
              </h2>
            </div>
          </div>

          <Button variant={todayReport ? "outline" : "default"} asChild size="sm">
            <Link href={`/daily-reports/new?date=${todayStr}`}>
              {todayReport ? "Edit Report" : "Submit Log Now"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-strong">Submission History</h2>

        {reports.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-xs text-muted-foreground">
            You haven&apos;t submitted a daily work log for today yet.
          </p></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-accent">{formatPlainDate(report.report_date)}</span>
                    <StatusBadge status={report.status} isExcused={report.is_excused} />
                  </div>
                  <CardTitle className="text-sm font-semibold text-strong line-clamp-2 mt-2">
                    {report.summary}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {report.is_excused ? (
                    <div className="rounded-lg bg-accent/10 p-2 text-xs text-accent">
                      <span className="font-semibold">Excused Leave: </span>
                      {report.excused_reason || "Authorized no-work day"}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total Duration:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {Math.floor(report.total_time_minutes / 60)}h {report.total_time_minutes % 60}m
                      </span>
                    </div>
                  )}

                  {report.work_entries && report.work_entries.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">Work Entries ({report.work_entries.length})</p>
                      <ul className="text-xs space-y-1">
                        {report.work_entries.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="truncate text-muted-foreground">
                            • {item.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {report.review_comments ? (
                    <div className="rounded-lg bg-surface-2 p-2.5 text-xs">
                      <p className="font-semibold text-strong">Reviewer Remark ({report.reviewer?.full_name}):</p>
                      <p className="text-muted-foreground mt-0.5">{report.review_comments}</p>
                    </div>
                  ) : null}

                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                      <Link href={`/daily-reports/new?date=${report.report_date}`}>View / Edit</Link>
                    </Button>
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

function StatusBadge({ status, isExcused }: { status: string; isExcused?: boolean }) {
  if (isExcused) {
    return (
      <Badge variant="accent" className="gap-1 text-xs">
        <ShieldQuestion className="size-3" /> Excused
      </Badge>
    );
  }
  switch (status) {
    case "reviewed":
      return (
        <Badge variant="success" className="gap-1 text-xs">
          <CheckCircle2 className="size-3" /> Reviewed
        </Badge>
      );
    case "changes_requested":
      return (
        <Badge variant="warning" className="gap-1 text-xs">
          <AlertTriangle className="size-3" /> Corrections Needed
        </Badge>
      );
    case "submitted":
      return (
        <Badge variant="accent" className="gap-1 text-xs">
          <Clock className="size-3" /> Submitted
        </Badge>
      );
    default:
      return (
        <Badge variant="muted" className="gap-1 text-xs">
          Draft
        </Badge>
      );
  }
}
