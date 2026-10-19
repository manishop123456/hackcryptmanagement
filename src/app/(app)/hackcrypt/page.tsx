// FILE: src/app/(app)/hackcrypt/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { getHackCryptStats, getProblemStatements, getTeams } from "@/lib/hackcrypt/queries";
import { canManageTasks } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HackCryptClientTabs } from "./hackcrypt-client-tabs";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileCode,
  Plus,
  Rocket,
  Users,
} from "lucide-react";

export const metadata = {
  title: "HackCrypt 2027-28 Module | HackCrypt Management",
  description: "Problem statements pipeline, team registrations, and event coordination",
};

export default async function HackCryptPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const [stats, problemStatements, teams] = await Promise.all([
    getHackCryptStats(),
    getProblemStatements(),
    getTeams(),
  ]);

  const canManage = canManageTasks(profile.role);

  // Calculate days remaining until HackCrypt Event (Jan 8, 2027)
  const eventDate = new Date("2027-01-08T09:00:00+05:30");
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={35} opacity={0.15} />

      <PageHeader
        title="HackCrypt 2027-28 Operations"
        description="Centralized module for problem statements curation, external hackathon team registrations, and event readiness."
      />

      {/* Top Banner / Event Countdown & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Event Day Banner */}
        <Card className="col-span-2 md:col-span-1 bg-[#111318] border-zinc-800 border-l-4 border-l-[#00E5FF]">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>EVENT COUNTDOWN</span>
              <Calendar className="w-3.5 h-3.5 text-[#00E5FF]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#00E5FF]">
              {daysRemaining} <span className="text-xs font-normal text-zinc-400">DAYS</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">8–9 January 2027</div>
          </CardContent>
        </Card>

        {/* Total PS */}
        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>PROBLEM STATEMENTS</span>
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-100">{stats.totalPS}</div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold">
              {stats.finalisedPS} Finalised
            </div>
          </CardContent>
        </Card>

        {/* Registered Teams */}
        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>REGISTERED TEAMS</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-100">{stats.totalTeams}</div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold">
              {stats.confirmedTeams} Confirmed
            </div>
          </CardContent>
        </Card>

        {/* Total Participants */}
        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>HACKERS / PARTICIPANTS</span>
              <Rocket className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-100">
              {stats.totalParticipants}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Across all colleges</div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-2 md:col-span-1 bg-[#111318] border-zinc-800 flex flex-col justify-center p-3 gap-2">
          {canManage && (
            <>
              <Link
                href="/hackcrypt/ps/new"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Problem Statement</span>
              </Link>

              <Link
                href="/hackcrypt/teams/new"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register Team</span>
              </Link>
            </>
          )}
        </Card>
      </div>

      {/* Main Client Tabs for Problem Statements & Teams */}
      <HackCryptClientTabs
        problemStatements={problemStatements}
        teams={teams}
        canManage={canManage}
      />
    </div>
  );
}
