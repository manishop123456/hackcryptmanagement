// FILE: src/app/(app)/issues/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getIssues } from "@/lib/issues/queries";
import { escalateIssueAction, resolveIssueAction } from "@/lib/issues/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DepartmentBadge } from "@/components/status-badge";
import type { Department } from "@/lib/constants";
import { ArrowUpRight, CheckCircle2, Clock, LifeBuoy, Plus } from "lucide-react";

export const metadata = {
  title: "Issues & Escalation | HackCrypt Management",
  description: "Issue tracking log and multi-tier escalation chain",
};

export default async function IssuesPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const issues = await getIssues();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={35} opacity={0.15} />

      <PageHeader
        title="Issues & Multi-Tier Escalation Chain"
        description="Structured issue log: Member → Team Lead → Management Head → President/VP → Faculty."
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <LifeBuoy className="w-4 h-4 text-[#00E5FF]" />
          <span>OPEN ISSUES LOG ({issues.filter((i) => i.status !== "resolved").length})</span>
        </div>

        <Link
          href="/issues/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Issue</span>
        </Link>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <div className="bg-[#111318] border border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-sm">
            No issues raised yet.
          </div>
        ) : (
          issues.map((issue) => {
            const ageDays = Math.floor(
              (new Date().getTime() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={issue.id} className="bg-[#111318] border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          issue.severity === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : issue.severity === "high"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <DepartmentBadge department={issue.department as unknown as Department} />
                      <h3 className="font-bold text-sm text-zinc-100">{issue.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-zinc-500">LEVEL:</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[#00E5FF] font-bold uppercase">
                        {issue.current_level.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="text-zinc-300 bg-[#0C0E13] p-3 rounded-lg border border-zinc-800 font-sans">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span>Raised by: {issue.raiser?.full_name || "Member"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" /> Open {ageDays} {ageDays === 1 ? "day" : "days"}
                      </span>
                    </div>

                    {/* Escalation Controls */}
                    {issue.status !== "resolved" && (
                      <div className="flex items-center gap-2">
                        <form action={escalateIssueAction}>
                          <input type="hidden" name="issueId" value={issue.id} />
                          <input type="hidden" name="currentLevel" value={issue.current_level} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition font-bold"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> Escalate Next Level
                          </button>
                        </form>

                        <form action={resolveIssueAction}>
                          <input type="hidden" name="issueId" value={issue.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition font-bold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
