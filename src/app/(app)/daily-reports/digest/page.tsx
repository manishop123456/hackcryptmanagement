import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, ShieldQuestion, UserX, ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireActiveProfile } from "@/lib/auth";
import { getLeadershipDailyDigest } from "@/lib/daily-reports/queries";
import { ReviewReportDialog } from "./review-report-dialog";
import { formatPlainDate } from "@/lib/utils";

export const metadata = {
  title: "Leadership Daily Digest | DevClub Management",
};

export default async function DailyDigestPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const currentUser = await requireActiveProfile();

  if (currentUser.role === "member") {
    redirect("/daily-reports");
  }

  const resolvedParams = await searchParams;
  const targetDate = resolvedParams.date || new Date().toISOString().split("T")[0];

  const digest = await getLeadershipDailyDigest(targetDate);

  const submissionRate = digest.totalMembers > 0
    ? Math.round((digest.submittedCount / digest.totalMembers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 gap-1.5">
            <Link href="/daily-reports">
              <ArrowLeft className="size-4" /> Back to My Reports
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-strong">Leadership Daily Digest</h1>
          <p className="text-sm text-muted-foreground">
            Review submissions, track missing logs, and verify team progress for <span className="font-mono text-accent">{formatPlainDate(targetDate)}</span>.
          </p>
        </div>

        <form method="get" action="/daily-reports/digest" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={targetDate}
            className="rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs text-foreground font-mono focus:border-accent focus:outline-none"
          />
          <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">Go</Button>
        </form>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-surface-1">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Roster</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-strong font-mono">{digest.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Total members expected</p>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/5">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-success">Submitted Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-success font-mono">{digest.submittedCount} ({submissionRate}%)</div>
            <p className="text-xs text-muted-foreground">Log received</p>
          </CardContent>
        </Card>

        <Card className="border-danger/30 bg-danger/5">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-danger">Missing Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-danger font-mono">{digest.missingCount}</div>
            <p className="text-xs text-muted-foreground">Pending daily submission</p>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Logs Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-strong">Submitted Daily Logs ({digest.submittedList.length})</h2>

        {digest.submittedList.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-sm text-muted-foreground">No reports submitted for this date yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {digest.submittedList.map(({ profile, report }) => (
              <Card key={report.id} className="flex flex-col justify-between border-border bg-surface-1">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-strong">{profile.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{profile.role} • {profile.department || "No Dept"}</p>
                    </div>
                    <DigestStatusBadge status={report.status} isExcused={report.is_excused} />
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {report.is_excused ? (
                    <div className="rounded-lg bg-accent/10 p-2.5 text-xs text-accent">
                      <span className="font-semibold">Excused Leave: </span>
                      {report.excused_reason || "No details provided"}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg bg-surface-2/60 p-2.5 text-xs space-y-1">
                        <span className="font-semibold text-strong">Summary: </span>
                        <p className="text-muted-foreground line-clamp-3">{report.summary}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total Duration:</span>
                        <span className="font-mono font-bold text-foreground">
                          {Math.floor(report.total_time_minutes / 60)}h {report.total_time_minutes % 60}m
                        </span>
                      </div>

                      {report.blockers ? (
                        <div className="rounded-lg bg-danger/10 p-2 text-xs text-danger">
                          <span className="font-semibold">Blocker: </span>
                          {report.blockers}
                        </div>
                      ) : null}

                      {report.proof_links && report.proof_links.length > 0 ? (
                        <div className="text-xs">
                          <span className="font-semibold text-strong">Proof Links: </span>
                          <span className="font-mono text-accent">{report.proof_links.length} attached</span>
                        </div>
                      ) : null}
                    </>
                  )}

                  {report.review_comments ? (
                    <div className="rounded-lg border border-border p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Remark ({report.reviewer?.full_name}): </span>
                      {report.review_comments}
                    </div>
                  ) : null}

                  <div className="pt-2 border-t border-border flex justify-end">
                    <ReviewReportDialog report={report} currentUser={currentUser} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Missing Submissions Section */}
      {digest.missingList.length > 0 ? (
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-strong text-danger flex items-center gap-2">
            <UserX className="size-5 text-danger" /> Missing Submissions ({digest.missingList.length})
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {digest.missingList.map((p) => (
              <div key={p.id} className="rounded-xl border border-danger/30 bg-danger/5 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-strong">{p.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.role} • {p.department || "No Dept"}</p>
                </div>
                <Badge variant="danger" className="text-[10px]">Unsubmitted</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DigestStatusBadge({ status, isExcused }: { status: string; isExcused?: boolean }) {
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
          <CheckCircle2 className="size-3" /> Approved
        </Badge>
      );
    case "changes_requested":
      return (
        <Badge variant="warning" className="gap-1 text-xs">
          <AlertTriangle className="size-3" /> Revisions Needed
        </Badge>
      );
    default:
      return (
        <Badge variant="accent" className="gap-1 text-xs">
          <Clock className="size-3" /> Submitted
        </Badge>
      );
  }
}
