"use client";

import { useState } from "react";
import Link from "next/link";
import { type ProblemStatementRow, type TeamRow } from "@/lib/hackcrypt/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode,
  Filter,
  Plus,
  Rocket,
  Search,
  Users,
} from "lucide-react";

interface HackCryptClientTabsProps {
  problemStatements: ProblemStatementRow[];
  teams: TeamRow[];
  canManage: boolean;
}

const PS_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  submitted: { label: "Submitted", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
  under_review: { label: "Under Review", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  changes_requested: { label: "Changes Requested", bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400" },
  finalised: { label: "Finalised", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
};

const TEAM_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  confirmed: { label: "Confirmed", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
  dropped: { label: "Dropped", bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
};

export function HackCryptClientTabs({
  problemStatements,
  teams,
  canManage,
}: HackCryptClientTabsProps) {
  const [activeTab, setActiveTab] = useState<"ps" | "teams">("ps");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPS = problemStatements.filter((ps) => {
    const matchesSearch =
      ps.title.toLowerCase().includes(search.toLowerCase()) ||
      ps.source.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || ps.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.college.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation & Search Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ps");
              setStatusFilter("all");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
              activeTab === "ps"
                ? "bg-[#00E5FF] text-[#0C0E13]"
                : "bg-[#111318] text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Problem Statements ({problemStatements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("teams");
              setStatusFilter("all");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
              activeTab === "teams"
                ? "bg-[#00E5FF] text-[#0C0E13]"
                : "bg-[#111318] text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Registrations ({teams.length})</span>
          </button>
        </div>

        {/* Filter / Search Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-[#0C0E13] border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF] w-44"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0C0E13] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#00E5FF]"
            >
              <option value="all">All Statuses</option>
              {activeTab === "ps" ? (
                <>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="changes_requested">Changes Requested</option>
                  <option value="finalised">Finalised</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dropped">Dropped</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Content: Problem Statements */}
      {activeTab === "ps" && (
        <>
          {filteredPS.length === 0 ? (
            <div className="bg-[#111318] border border-zinc-800 rounded-xl p-12 text-center space-y-3">
              <FileCode className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="font-bold text-zinc-300 text-sm">No Problem Statements Found</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No problem statements match your current search or filter criteria.
              </p>
              {canManage && (
                <Link
                  href="/hackcrypt/ps/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0C0E13] font-bold text-xs mt-2 hover:bg-[#00cce6] transition"
                >
                  <Plus className="w-4 h-4" /> Add Problem Statement
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPS.map((ps) => {
                const statusMeta = PS_STATUS_MAP[ps.status] || PS_STATUS_MAP.submitted;

                return (
                  <Card
                    key={ps.id}
                    className="bg-[#111318] border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            Domain: <strong className="text-zinc-300">{ps.source}</strong>
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold text-zinc-100 hover:text-[#00E5FF] transition">
                          <Link href={`/hackcrypt/ps/${ps.id}`}>{ps.title}</Link>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 text-xs text-zinc-400">
                        {ps.notes && (
                          <p className="line-clamp-2 text-zinc-400 bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800 text-[11px]">
                            {ps.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
                          <span>Assigned Teams: <strong className="text-[#00E5FF]">{ps.teams_count}</strong></span>
                          {ps.document_url && (
                            <a
                              href={ps.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#00E5FF] hover:underline"
                            >
                              <span>Doc Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    <div className="px-6 pb-4 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-500 text-[10px]">
                        By: {ps.creator?.full_name || "Lead"}
                      </span>
                      <Link
                        href={`/hackcrypt/ps/${ps.id}`}
                        className="inline-flex items-center gap-1 text-[#00E5FF] hover:underline font-bold text-xs"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab Content: Team Registrations */}
      {activeTab === "teams" && (
        <>
          {filteredTeams.length === 0 ? (
            <div className="bg-[#111318] border border-zinc-800 rounded-xl p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="font-bold text-zinc-300 text-sm">No Registered Teams Found</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No external teams match your current search or filter criteria.
              </p>
              {canManage && (
                <Link
                  href="/hackcrypt/teams/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0C0E13] font-bold text-xs mt-2 hover:bg-[#00cce6] transition"
                >
                  <Plus className="w-4 h-4" /> Register New Team
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => {
                const statusMeta = TEAM_STATUS_MAP[team.status] || TEAM_STATUS_MAP.pending;

                return (
                  <Card
                    key={team.id}
                    className="bg-[#111318] border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-zinc-400" />
                            <span className="truncate max-w-[120px]">{team.college}</span>
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold text-zinc-100 hover:text-[#00E5FF] transition">
                          <Link href={`/hackcrypt/teams/${team.id}`}>{team.name}</Link>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 text-xs text-zinc-400">
                        {/* Member count & list */}
                        <div className="bg-[#0C0E13] p-3 rounded-lg border border-zinc-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span>MEMBERS ({team.members.length}):</span>
                          </div>
                          <div className="space-y-1 text-zinc-300 font-mono text-[11px]">
                            {team.members.slice(0, 3).map((m, i) => (
                              <div key={i} className="truncate">
                                • {m.name} {m.role ? `(${m.role})` : ""}
                              </div>
                            ))}
                            {team.members.length > 3 && (
                              <div className="text-zinc-500 text-[10px]">
                                + {team.members.length - 3} more members
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Problem Statement Tag */}
                        {team.problem_statement ? (
                          <div className="text-[11px] font-mono text-zinc-400 truncate">
                            PS: <span className="text-zinc-200 font-bold">{team.problem_statement.title}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-zinc-500 italic">
                            No problem statement assigned
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="px-6 pb-4 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-500 text-[10px]">
                        Registered: {new Date(team.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/hackcrypt/teams/${team.id}`}
                        className="inline-flex items-center gap-1 text-[#00E5FF] hover:underline font-bold text-xs"
                      >
                        <span>Manage Team</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
