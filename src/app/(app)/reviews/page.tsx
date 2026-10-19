// FILE: src/app/(app)/reviews/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getWeeklyReports } from "@/lib/reviews/queries";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DepartmentBadge } from "@/components/status-badge";
import type { Department } from "@/lib/constants";
import { AlertTriangle, CheckCircle2, Plus, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Weekly Reviews | HackCrypt Management",
  description: "Weekly performance reports, department RAG status, and progress reviews",
};

export default async function WeeklyReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const selectedDept = params.dept;

  const reports = await getWeeklyReports(selectedDept);

  // Check if lead/core can submit review
  const canSubmit = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
    "team_lead",
  ].includes(profile.role);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={35} opacity={0.15} />

      <PageHeader
        title="Weekly Performance Reviews & Department RAG"
        description="Structured weekly review logs, assigned vs completed tasks auto-tracking, and RAG status."
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>DEPARTMENT REVIEWS ({reports.length})</span>
        </div>

        {canSubmit && (
          <Link
            href="/reviews/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Weekly Report</span>
          </Link>
        )}
      </div>

      {/* Weekly Reports Stream */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-[#111318] border border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-sm">
            No weekly performance reports submitted yet.
          </div>
        ) : (
          reports.map((r) => (
            <Card key={r.id} className="bg-[#111318] border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DepartmentBadge department={r.department as unknown as Department} />
                    <span className="text-xs font-mono text-zinc-400">Week of {r.week_start}</span>
                  </div>

                  {r.status_rag === "green" ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> GREEN (ON TRACK)
                    </span>
                  ) : r.status_rag === "yellow" ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> YELLOW (ATTENTION)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> RED (CRITICAL DELAYS)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0C0E13] p-3 rounded-lg border border-zinc-800 font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ASSIGNED</span>
                    <span className="text-sm font-bold text-zinc-200">{r.assigned} tasks</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">COMPLETED</span>
                    <span className="text-sm font-bold text-emerald-400">{r.completed} tasks</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">DELAYED</span>
                    <span className="text-sm font-bold text-red-400">{r.delayed} tasks</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ATTENDANCE</span>
                    <span className="text-sm font-bold text-[#00E5FF]">{r.attendance_rate}%</span>
                  </div>
                </div>

                {r.problems && (
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-300">Blockers & Problems Faced:</span>
                    <p className="text-zinc-400 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">{r.problems}</p>
                  </div>
                )}

                {r.next_tasks && (
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-300">Next Week Objectives:</span>
                    <p className="text-zinc-400 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">{r.next_tasks}</p>
                  </div>
                )}

                <div className="text-[10px] font-mono text-zinc-500 flex justify-between pt-2 border-t border-zinc-800/60">
                  <span>Author: {r.author?.full_name || "Lead"}</span>
                  <span>Submitted: {new Date(r.submitted_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
