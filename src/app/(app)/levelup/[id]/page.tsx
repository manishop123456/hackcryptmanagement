// FILE: src/app/(app)/levelup/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getLectureById } from "@/lib/levelup/queries";
import { deleteLectureAction } from "@/lib/levelup/actions";
import { canManageTasks } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LectureChecklistEditor } from "./lecture-checklist-editor";
import { LectureStageSwitcher } from "./lecture-stage-switcher";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  GraduationCap,
  MapPin,
  Trash2,
  User,
  Users,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Lecture Details | Level Up",
  description: "View and manage Level Up technical lecture details and preparation",
};

export default async function LectureDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const lecture = await getLectureById(id);
  if (!lecture) {
    notFound();
  }

  const canManage = canManageTasks(profile.role);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <div className="flex items-center justify-between">
        <Link
          href="/levelup"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Level Up Pipeline
        </Link>

        {canManage && (
          <form action={deleteLectureAction}>
            <input type="hidden" name="lectureId" value={lecture.id} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this lecture?")) {
                  e.preventDefault();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Lecture</span>
            </button>
          </form>
        )}
      </div>

      <PageHeader
        title={lecture.topic}
        description={`Speaker: ${lecture.speaker} • Venue: ${lecture.venue}`}
      />

      {/* Pipeline Stage Progress */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardContent className="pt-6">
          <LectureStageSwitcher
            lectureId={lecture.id}
            currentStage={lecture.stage}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preparation Checklist */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#00E5FF]" />
                <span>Lecture Preparation & Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LectureChecklistEditor
                lectureId={lecture.id}
                initialChecklist={lecture.checklist}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          {/* Notes & Feedback Link */}
          {(lecture.notes || lecture.feedback_url) && (
            <Card className="bg-[#111318] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base font-bold text-zinc-100">
                  Notes & Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-zinc-300">
                {lecture.notes && (
                  <div className="bg-[#0C0E13] p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {lecture.notes}
                  </div>
                )}

                {lecture.feedback_url && (
                  <div className="flex items-center justify-between bg-[#0C0E13] p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 font-mono">Feedback Form Link:</span>
                    <a
                      href={lecture.feedback_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#00E5FF] font-bold hover:underline"
                    >
                      <span>Open Form</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Metadata & Attendance Session */}
        <div className="space-y-6">
          {/* Overview Metadata Card */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-200 uppercase font-mono">
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-zinc-300 font-mono">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">SPEAKER</div>
                  <div className="font-bold text-zinc-200">{lecture.speaker}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <Calendar className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">DATE & TIME</div>
                  <div>{new Date(lecture.starts_at).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">VENUE</div>
                  <div>{lecture.venue}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <User className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">ORGANIZER / CREATOR</div>
                  <div>{lecture.creator?.full_name || lecture.creator?.email || "Team Lead"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Attendance Session Card */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-200 flex items-center gap-2 font-mono">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Attendance Session</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {lecture.session ? (
                <>
                  <div className="bg-[#0C0E13] p-3 rounded-xl border border-zinc-800 space-y-2 font-mono">
                    <div className="font-bold text-zinc-200 text-xs">{lecture.session.title}</div>
                    <div className="text-[11px] text-zinc-500">
                      Status: {lecture.session.closed_at ? "Closed" : "Active / Open"}
                    </div>
                  </div>

                  {lecture.attendance_stats && (
                    <div className="grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-emerald-400 font-bold text-base">
                          {lecture.attendance_stats.present}
                        </div>
                        <div className="text-[10px] text-zinc-500">PRESENT</div>
                      </div>

                      <div className="bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-amber-400 font-bold text-base">
                          {lecture.attendance_stats.late}
                        </div>
                        <div className="text-[10px] text-zinc-500">LATE</div>
                      </div>

                      <div className="bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-blue-400 font-bold text-base">
                          {lecture.attendance_stats.excused}
                        </div>
                        <div className="text-[10px] text-zinc-500">EXCUSED</div>
                      </div>

                      <div className="bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-red-400 font-bold text-base">
                          {lecture.attendance_stats.absent}
                        </div>
                        <div className="text-[10px] text-zinc-500">ABSENT</div>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/attendance/${lecture.session.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs transition"
                  >
                    <span>Open Attendance Roster & Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <div className="text-center py-4 space-y-2 text-zinc-500">
                  <p className="text-xs">No attendance session linked to this lecture.</p>
                  {canManage && (
                    <Link
                      href="/attendance/new"
                      className="inline-flex items-center gap-1 text-[#00E5FF] text-xs font-mono font-bold hover:underline"
                    >
                      + Create Attendance Session
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
