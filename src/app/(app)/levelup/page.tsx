// FILE: src/app/(app)/levelup/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getLectures, type LectureStage } from "@/lib/levelup/queries";
import { canManageTasks } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Plus,
  User,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Level Up Lectures | HackCrypt Management",
  description: "Lecture pipeline, preparation checklists, and attendance integration",
};

const STAGE_LABELS: Record<LectureStage, { label: string; bg: string; text: string; step: number }> = {
  topic: { label: "1. Topic Selection", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", step: 1 },
  speaker: { label: "2. Speaker Briefing", bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400", step: 2 },
  date: { label: "3. Schedule Set", bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400", step: 3 },
  venue: { label: "4. Venue Reserved", bg: "bg-cyan-500/10 border-cyan-500/30", text: "text-cyan-400", step: 4 },
  preparation: { label: "5. Active Prep", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", step: 5 },
  lecture: { label: "6. Lecture Live", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", step: 6 },
  review: { label: "7. Post Review", bg: "bg-zinc-800 border-zinc-700", text: "text-zinc-300", step: 7 },
};

export default async function LevelUpPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const lectures = await getLectures();
  const canManage = canManageTasks(profile.role);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={35} opacity={0.15} />

      <PageHeader
        title="Level Up Technical Lectures"
        description="Structured pipeline for technical sessions, speaker coordination, checklists, and attendance tracking."
      />

      {/* Action & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-[#00E5FF]" />
            <span>TOTAL LECTURES ({lectures.length})</span>
          </div>
          <span>•</span>
          <span className="text-emerald-400 font-bold">
            LIVE / READY: {lectures.filter((l) => l.stage === "lecture" || l.stage === "preparation").length}
          </span>
        </div>

        {canManage && (
          <Link
            href="/levelup/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Lecture</span>
          </Link>
        )}
      </div>

      {/* Lecture List Grid */}
      {lectures.length === 0 ? (
        <div className="bg-[#111318] border border-zinc-800 rounded-xl p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="font-bold text-zinc-300 text-sm">No Level Up Lectures Scheduled</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Plan and coordinate technical workshops, expert sessions, and peer learning lectures.
          </p>
          {canManage && (
            <Link
              href="/levelup/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0C0E13] font-bold text-xs mt-2 hover:bg-[#00cce6] transition"
            >
              <Plus className="w-4 h-4" /> Add First Lecture
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lectures.map((lecture) => {
            const stageInfo = STAGE_LABELS[lecture.stage] || STAGE_LABELS.topic;
            const completedChecklistCount = lecture.checklist.filter((c) => c.completed).length;
            const progressPercent = Math.round((stageInfo.step / 7) * 100);

            return (
              <Card
                key={lecture.id}
                className="bg-[#111318] border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[11px] font-mono px-2.5 py-0.5 rounded border uppercase font-bold ${stageInfo.bg} ${stageInfo.text}`}
                      >
                        {stageInfo.label}
                      </span>
                      {lecture.session && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          <Users className="w-3 h-3" /> Attendance Linked
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-zinc-100 hover:text-[#00E5FF] transition">
                      <Link href={`/levelup/${lecture.id}`}>{lecture.topic}</Link>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs text-zinc-400">
                    <div className="space-y-2 bg-[#0C0E13] p-3 rounded-lg border border-zinc-800 font-mono text-[11px]">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <User className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                        <span className="truncate">Speaker: {lecture.speaker}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{new Date(lecture.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Venue: {lecture.venue}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Checklist Stats */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">PIPELINE PROGRESS</span>
                        <span className="text-[#00E5FF] font-bold">{progressPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00E5FF] to-cyan-400 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {completedChecklistCount} / {lecture.checklist.length} Checklist Items
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="px-6 pb-4 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 text-[10px]">
                    By: {lecture.creator?.full_name || "Lead"}
                  </span>

                  <Link
                    href={`/levelup/${lecture.id}`}
                    className="inline-flex items-center gap-1 text-[#00E5FF] hover:underline font-bold text-xs"
                  >
                    <span>View & Manage</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
