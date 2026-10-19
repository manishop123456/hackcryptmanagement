// FILE: src/app/(app)/hackcrypt/ps/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getProblemStatementById, getTeams } from "@/lib/hackcrypt/queries";
import { deletePSAction, updatePSStatusAction } from "@/lib/hackcrypt/actions";
import { canManageTasks } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Building,
  ExternalLink,
  FileCode,
  Trash2,
  User,
  Users,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Problem Statement Details | HackCrypt 2027-28",
  description: "View problem statement details, evaluation notes, and assigned teams",
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  submitted: { label: "Submitted", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
  under_review: { label: "Under Review", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  changes_requested: { label: "Changes Requested", bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400" },
  finalised: { label: "Finalised", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
};

export default async function ProblemStatementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const [ps, allTeams] = await Promise.all([
    getProblemStatementById(id),
    getTeams(),
  ]);

  if (!ps) {
    notFound();
  }

  const assignedTeams = allTeams.filter((t) => t.problem_statement_id === ps.id);
  const canManage = canManageTasks(profile.role);
  const statusMeta = STATUS_MAP[ps.status] || STATUS_MAP.submitted;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <Starfield density={30} opacity={0.15} />

      <div className="flex items-center justify-between">
        <Link
          href="/hackcrypt"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to HackCrypt Dashboard
        </Link>

        {canManage && (
          <form action={deletePSAction}>
            <input type="hidden" name="psId" value={ps.id} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this problem statement?")) {
                  e.preventDefault();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Problem Statement</span>
            </button>
          </form>
        )}
      </div>

      <PageHeader
        title={ps.title}
        description={`Domain / Source: ${ps.source} • Created by ${ps.creator?.full_name || "Lead"}`}
      />

      {/* Status Bar & Lead Status Switcher */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">Current Status:</span>
            <span
              className={`text-xs font-mono px-3 py-1 rounded border uppercase font-bold ${statusMeta.bg} ${statusMeta.text}`}
            >
              {statusMeta.label}
            </span>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">Update Status:</span>
              <div className="flex items-center gap-1">
                {(["submitted", "under_review", "changes_requested", "finalised"] as const).map(
                  (st) => (
                    <form key={st} action={updatePSStatusAction}>
                      <input type="hidden" name="psId" value={ps.id} />
                      <input type="hidden" name="status" value={st} />
                      <button
                        type="submit"
                        disabled={ps.status === st}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono capitalize transition ${
                          ps.status === st
                            ? "bg-[#00E5FF] text-[#0C0E13] font-bold"
                            : "bg-[#0C0E13] text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    </form>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description & Assigned Teams */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes & Description */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#00E5FF]" />
                <span>Description & Evaluation Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-zinc-300">
              {ps.notes ? (
                <div className="bg-[#0C0E13] p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap leading-relaxed font-mono">
                  {ps.notes}
                </div>
              ) : (
                <p className="text-zinc-500 italic">No notes or evaluation guidelines provided yet.</p>
              )}

              {ps.document_url && (
                <div className="flex items-center justify-between bg-[#0C0E13] p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 font-mono">Full Spec Document:</span>
                  <a
                    href={ps.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#00E5FF] font-bold hover:underline"
                  >
                    <span>Open External Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Teams List */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Assigned Teams ({assignedTeams.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedTeams.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4">
                  No hackathon teams have registered under this problem statement yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {assignedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-[#0C0E13] p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-zinc-200">{team.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                          <Building className="w-3 h-3 text-zinc-500" />
                          <span>{team.college}</span>
                          <span>•</span>
                          <span>{team.members.length} Members</span>
                        </div>
                      </div>

                      <Link
                        href={`/hackcrypt/teams/${team.id}`}
                        className="inline-flex items-center gap-1 text-[#00E5FF] font-mono text-xs font-bold hover:underline"
                      >
                        <span>View Team</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Metadata & Author Info */}
        <div className="space-y-6">
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-200 uppercase font-mono">
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-zinc-300 font-mono">
              <div className="flex items-start gap-2.5">
                <FileCode className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">DOMAIN / TRACK</div>
                  <div className="font-bold text-zinc-200">{ps.source}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <User className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">CURATOR / CREATOR</div>
                  <div>{ps.creator?.full_name || ps.creator?.email || "Lead"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <Users className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">TOTAL TEAMS</div>
                  <div className="font-bold text-[#00E5FF]">{assignedTeams.length} Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
