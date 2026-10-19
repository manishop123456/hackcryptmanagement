// FILE: src/app/(app)/reports/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  CalendarCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Rocket,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Reports & Analytics | HackCrypt Management",
  description: "Comprehensive system reports, department health metrics, and CSV exports",
};

export default async function ReportsPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch metrics across modules
  const [
    { count: totalMembers },
    { count: totalTasks },
    { count: completedTasks },
    { count: totalSessions },
    { count: totalCheckins },
    { count: totalPS },
    { count: totalTeams },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("attendance_sessions").select("*", { count: "exact", head: true }),
    supabase.from("attendance_records").select("*", { count: "exact", head: true }).eq("status", "present"),
    supabase.from("problem_statements").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
  ]);

  const taskCompletionRate = totalTasks ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={35} opacity={0.15} />

      <PageHeader
        title="Production Reports & Analytics"
        description="Audit metrics, completion statistics, attendance rates, and exportable CSV data archives."
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>ACTIVE MEMBERS</span>
              <Users className="w-3.5 h-3.5 text-[#00E5FF]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-100">{totalMembers || 0}</div>
            <div className="text-[10px] text-zinc-500 font-mono">Pre-approved roster</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>TASK COMPLETION</span>
              <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">{taskCompletionRate}%</div>
            <div className="text-[10px] text-zinc-500 font-mono">
              {completedTasks || 0} / {totalTasks || 0} Tasks Done
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>ATTENDANCE SESSIONS</span>
              <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-100">{totalSessions || 0}</div>
            <div className="text-[10px] text-purple-400 font-mono font-bold">
              {totalCheckins || 0} Present Check-ins
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
              <span>HACKCRYPT READINESS</span>
              <Rocket className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-zinc-100">{totalTeams || 0} Teams</div>
            <div className="text-[10px] text-amber-400 font-mono font-bold">
              {totalPS || 0} Problem Statements
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exportable CSV Reports Matrix */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00E5FF]" />
            <span>Exportable CSV Reports Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Attendance Report Export */}
          <div className="bg-[#0C0E13] p-5 rounded-xl border border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
                <CalendarCheck className="w-4 h-4 text-purple-400" />
                <span>Attendance Log Report</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Export all session check-ins, location verification distances, passcodes, flags, and manual overrides.
              </p>
            </div>
            <Link
              href="/attendance"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance Data</span>
            </Link>
          </div>

          {/* Tasks Report Export */}
          <div className="bg-[#0C0E13] p-5 rounded-xl border border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <span>Task Execution Report</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Detailed task audit including assignees, deadlines, completion outputs, overdue status, and history.
              </p>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>View Task Board</span>
            </Link>
          </div>

          {/* Contribution & Performance Export */}
          <div className="bg-[#0C0E13] p-5 rounded-xl border border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
                <Award className="w-4 h-4 text-[#00E5FF]" />
                <span>Contribution % Matrix</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Weighted member performance scores (50% Task + 30% Attendance + 20% Lead Rating).
              </p>
            </div>
            <Link
              href="/contribution"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-mono font-bold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Open Contribution Matrix</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
