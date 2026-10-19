// FILE: src/app/(app)/contribution/page.tsx
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getAllMembersContributions, calculateMemberContribution } from "@/lib/contribution/queries";
import { saveLeadRatingAction } from "@/lib/contribution/actions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DepartmentBadge, RoleBadge } from "@/components/status-badge";
import type { AppRole, Department } from "@/lib/constants";
import { Award, Calculator, Info, Star, TrendingUp, Users } from "lucide-react";

export const metadata = {
  title: "Contribution Tracking | HackCrypt Management",
  description: "Transparent member contribution scoring and performance breakdown",
};

export default async function ContributionPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const myContribution = await calculateMemberContribution(profile.id);
  const allContributions = await getAllMembersContributions();

  const canEditRatings = [
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
        title="Member Contribution & Performance Tracking"
        description="Automated, transparent contribution calculation based on task completion, attendance, and lead assessment."
      />

      {/* Formula Explanation Banner */}
      <Card className="bg-[#111318] border-[#00E5FF]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#00E5FF]">
            <Calculator className="w-5 h-5" />
            Transparent Contribution Formula
          </CardTitle>
          <CardDescription>
            Overall Contribution % = (50% × Task Score) + (30% × Attendance Rate) + (20% × Lead Rating)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="bg-[#0C0E13] p-3 rounded-lg border border-zinc-800">
              <span className="text-[#00E5FF] font-bold block text-sm">50% TASK SCORE</span>
              <p className="text-[#E1E2E9]/70 mt-1">Based on on-time completed tasks vs assigned, with delayed penalties.</p>
            </div>
            <div className="bg-[#0C0E13] p-3 rounded-lg border border-zinc-800">
              <span className="text-blue-400 font-bold block text-sm">30% ATTENDANCE RATE</span>
              <p className="text-[#E1E2E9]/70 mt-1">Verified check-in rate across all scheduled meetings and sessions.</p>
            </div>
            <div className="bg-[#0C0E13] p-3 rounded-lg border border-zinc-800">
              <span className="text-amber-400 font-bold block text-sm">20% LEAD RATING</span>
              <p className="text-[#E1E2E9]/70 mt-1">Assessment rating (0–100) and major contribution notes from leads.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Personal Contribution Breakdown */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00E5FF]" />
            Your Contribution Summary ({myContribution.fullName})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0C0E13] p-4 rounded-xl border border-zinc-800">
            <div>
              <span className="text-zinc-500 block text-[10px]">OVERALL CONTRIBUTION</span>
              <span className="text-3xl font-black text-[#00E5FF]">{myContribution.overallScore}%</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">TASK SCORE (50%)</span>
              <span className="text-xl font-bold text-emerald-400">{myContribution.taskScore} / 100</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">ATTENDANCE (30%)</span>
              <span className="text-xl font-bold text-blue-400">{myContribution.attendanceScore}%</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">LEAD RATING (20%)</span>
              <span className="text-xl font-bold text-amber-400">{myContribution.leadRating} / 100</span>
            </div>
          </div>

          {myContribution.majorContribution && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300">
              <span className="font-bold flex items-center gap-1 mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Major Contribution Note:
              </span>
              <p>{myContribution.majorContribution}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Contribution Leaderboard & Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00E5FF]" />
          <span>Team Member Contribution Leaderboard</span>
        </h2>

        <div className="grid gap-4">
          {allContributions.map((m) => (
            <Card key={m.memberId} className="bg-[#111318] border-zinc-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">{m.fullName}</span>
                      <RoleBadge role={m.role as AppRole} />
                      <DepartmentBadge department={m.department as unknown as Department | null} />
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">{m.email}</span>
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">OVERALL</span>
                      <span className="text-2xl font-black text-[#00E5FF]">{m.overallScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#0C0E13] p-2.5 rounded-lg text-[11px] font-mono text-zinc-400">
                  <span>Tasks: <strong className="text-emerald-400">{m.taskScore}/100</strong> ({m.completedTasks}/{m.assignedTasks} completed)</span>
                  <span>Attendance: <strong className="text-blue-400">{m.attendanceScore}%</strong></span>
                  <span>Lead Rating: <strong className="text-amber-400">{m.leadRating}/100</strong></span>
                </div>

                {/* Lead Rating Form for Authorized Leads */}
                {canEditRatings && (
                  <form action={saveLeadRatingAction} className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-3 text-xs font-mono">
                    <input type="hidden" name="memberId" value={m.memberId} />
                    <input type="hidden" name="period" value="Phase 1" />

                    <div className="flex items-center gap-2">
                      <label className="text-zinc-400">Rating (0-100):</label>
                      <input
                        type="number"
                        name="rating"
                        defaultValue={m.leadRating}
                        min={0}
                        max={100}
                        className="w-20 bg-[#0C0E13] border border-zinc-800 rounded p-1 text-amber-400 font-bold"
                      />
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        name="majorContribution"
                        placeholder="Add major contribution note..."
                        defaultValue={m.majorContribution || ""}
                        className="w-full bg-[#0C0E13] border border-zinc-800 rounded p-1 text-zinc-200"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-[#00E5FF] text-[#0C0E13] font-bold hover:bg-[#00cce6] transition"
                    >
                      Save Rating
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
