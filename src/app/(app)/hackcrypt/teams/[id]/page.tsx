// FILE: src/app/(app)/hackcrypt/teams/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getProblemStatements, getTeamById } from "@/lib/hackcrypt/queries";
import { assignTeamPSAction, deleteTeamAction, updateTeamStatusAction } from "@/lib/hackcrypt/actions";
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
  UserCheck,
  Users,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Team Details | HackCrypt 2027-28",
  description: "View hackathon team details, roster, problem statement track, and status",
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  confirmed: { label: "Confirmed", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
  dropped: { label: "Dropped", bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
};

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const [team, problemStatements] = await Promise.all([
    getTeamById(id),
    getProblemStatements(),
  ]);

  if (!team) {
    notFound();
  }

  const canManage = canManageTasks(profile.role);
  const statusMeta = STATUS_MAP[team.status] || STATUS_MAP.pending;

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
          <form action={deleteTeamAction}>
            <input type="hidden" name="teamId" value={team.id} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this team?")) {
                  e.preventDefault();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Team</span>
            </button>
          </form>
        )}
      </div>

      <PageHeader
        title={team.name}
        description={`College / Institution: ${team.college}`}
      />

      {/* Status Bar & Lead Controls */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">Registration Status:</span>
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
                {(["pending", "confirmed", "dropped"] as const).map((st) => (
                  <form key={st} action={updateTeamStatusAction}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="status" value={st} />
                    <button
                      type="submit"
                      disabled={team.status === st}
                      className={`px-3 py-1 rounded text-[11px] font-mono capitalize transition ${
                        team.status === st
                          ? "bg-[#00E5FF] text-[#0C0E13] font-bold"
                          : "bg-[#0C0E13] text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {st}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Members Roster & Problem Statement Assign */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members Roster */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00E5FF]" />
                <span>Team Members Roster ({team.members.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.members.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">No members registered.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {team.members.map((member, index) => (
                    <div
                      key={index}
                      className="bg-[#0C0E13] p-3 rounded-xl border border-zinc-800 flex items-center gap-3 font-mono text-xs"
                    >
                      <UserCheck className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-zinc-200 truncate">{member.name}</div>
                        {member.role && <div className="text-[10px] text-zinc-500 truncate">{member.role}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes & Contacts */}
          {team.notes && (
            <Card className="bg-[#111318] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base font-bold text-zinc-100">
                  Notes & Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#0C0E13] p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                  {team.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Problem Statement Track & Metadata */}
        <div className="space-y-6">
          {/* Problem Statement Track Card */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-200 uppercase font-mono flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Problem Statement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono">
              {team.problem_statement ? (
                <div className="bg-[#0C0E13] p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="font-bold text-zinc-200 text-xs">{team.problem_statement.title}</div>
                  <div className="text-[10px] text-emerald-400">
                    Track Status: {team.problem_statement.status}
                  </div>
                  <Link
                    href={`/hackcrypt/ps/${team.problem_statement.id}`}
                    className="inline-flex items-center gap-1 text-[#00E5FF] font-bold hover:underline text-[11px] pt-1"
                  >
                    <span>View Track Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-zinc-500 italic text-[11px]">No problem statement track assigned yet.</p>
              )}

              {/* Assign/Change Problem Statement Form */}
              {canManage && (
                <form action={assignTeamPSAction} className="pt-2 border-t border-zinc-800 space-y-2">
                  <input type="hidden" name="teamId" value={team.id} />
                  <label htmlFor="problem_statement_id" className="text-[11px] text-zinc-400 font-bold block">
                    Assign / Change Track:
                  </label>
                  <select
                    id="problem_statement_id"
                    name="problem_statement_id"
                    defaultValue={team.problem_statement_id || ""}
                    className="w-full bg-[#0C0E13] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#00E5FF]"
                  >
                    <option value="">-- No Track --</option>
                    {problemStatements.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition"
                  >
                    Save Track Assignment
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-200 uppercase font-mono">
                Team Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-zinc-300 font-mono">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">COLLEGE / INSTITUTION</div>
                  <div className="font-bold text-zinc-200">{team.college}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <Users className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">TOTAL MEMBERS</div>
                  <div className="font-bold text-[#00E5FF]">{team.members.length} Hackers</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80">
                <Building className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-zinc-500 text-[10px]">REGISTRATION DATE</div>
                  <div>{new Date(team.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
