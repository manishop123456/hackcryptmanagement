// FILE: src/app/(app)/page.tsx
// HackCrypt Management System — Full Production Role-Aware Dashboard & Command Center

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile, toActor } from "@/lib/auth";
import { getTasks } from "@/lib/tasks/queries";
import { getMemberAttendanceStats, getAttendanceSessions } from "@/lib/attendance/queries";
import { getTimelineEvents } from "@/lib/timeline/queries";
import { DepartmentBadge, RoleBadge, TaskStatusBadge, PriorityBadge } from "@/components/status-badge";
import { Starfield } from "@/components/starfield";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isDatePast } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  Flag,
  Layers,
  ListTodo,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // 1. Fetch Phases
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .order("sort_order", { ascending: true });

  const today = new Date().toISOString().split("T")[0];
  const currentPhase = (phases ?? []).find(
    (p) => p.starts_on <= today && p.ends_on >= today
  );

  // 2. Fetch Tasks & Compute KPIs
  const allTasks = await getTasks();

  // Role-based task scope
  let visibleTasks = allTasks;
  if (profile.role === "member") {
    visibleTasks = allTasks.filter((t) => t.owner_id === profile.id);
  } else if (["team_lead", "co_head"].includes(profile.role)) {
    const targetDept = profile.department || profile.co_head_department;
    if (targetDept) {
      visibleTasks = allTasks.filter((t) => t.department === targetDept);
    }
  }

  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter((t) => t.status === "completed").length;
  const delayedTasks = visibleTasks.filter((t) => t.status === "delayed").length;
  const inProgressTasks = visibleTasks.filter((t) => t.status === "in_progress").length;
  const reviewTasks = visibleTasks.filter((t) => t.status === "review").length;
  const notStartedTasks = visibleTasks.filter((t) => t.status === "not_started").length;

  const myTasks = allTasks.filter(
    (t) => t.owner_id === profile.id && t.status !== "completed" && t.status !== "cancelled"
  );
  const overdueTasks = visibleTasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled" && isDatePast(t.deadline)
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Attendance Stats
  const attendanceStats = await getMemberAttendanceStats(profile.id);
  const sessions = await getAttendanceSessions();

  // Check active sessions
  const now = new Date();
  const activeSession = sessions.find((s) => {
    const start = new Date(s.starts_at);
    const end = new Date(s.ends_at);
    return !s.closed_at && now >= start && now <= end;
  });

  // Pending Flags Count for Leads
  let pendingFlagsCount = 0;
  if (
    [
      "president",
      "vice_president",
      "management_head",
      "development_head",
      "development_co_head",
      "management_co_head",
      "hackathon_head",
      "team_lead",
      "co_head",
    ].includes(profile.role)
  ) {
    const { count } = await supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("review", "pending");
    pendingFlagsCount = count || 0;
  }

  // 4. Compute Department RAG Status
  let ragStatus: "green" | "yellow" | "red" = "green";
  const highPriorityOverdue = visibleTasks.some(
    (t) =>
      t.priority === "high" &&
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      isDatePast(t.deadline)
  );
  const delayedPercentage = totalTasks > 0 ? (delayedTasks / totalTasks) * 100 : 0;

  if (highPriorityOverdue || delayedPercentage > 30) {
    ragStatus = "red";
  } else if (delayedPercentage >= 10 || attendanceStats.percentage < 70) {
    ragStatus = "yellow";
  }

  // 5. Fetch Recent Activity Timeline
  const recentTimeline = await getTimelineEvents(5);

  // 6. HackCrypt Event Countdown (8 Jan 2027)
  const eventDate = new Date("2027-01-08T09:00:00Z");
  const diffTime = Math.max(0, eventDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const firstName = profile.full_name.split(/\s+/)[0] ?? profile.full_name;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={40} opacity={0.18} />

      {/* Header with Countdown Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#00E5FF] font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>DEVCLUB TRCAC COMMAND CENTER</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            HackCrypt 2027-28 Preparation & Execution Dashboard
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#111318] border border-[#00E5FF]/30 rounded-xl px-4 py-3 shrink-0 shadow-lg shadow-[#00E5FF]/5">
          <Clock className="w-5 h-5 text-[#00E5FF] animate-pulse" />
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">HACKCRYPT COUNTDOWN</div>
            <div className="text-xl font-black font-mono text-zinc-100">
              {diffDays} <span className="text-xs font-normal text-zinc-400">DAYS TO GO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Access Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111318] border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 mr-1">ROLE:</span>
          <RoleBadge role={profile.role} />
          <DepartmentBadge department={profile.department} />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">HEALTH STATUS (RAG):</span>
          {ragStatus === "green" ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GREEN (ON TRACK)
            </span>
          ) : ragStatus === "yellow" ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              YELLOW (ATTENTION)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              RED (CRITICAL DELAYS)
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono">MY ACTIVE TASKS</span>
              <ListTodo className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <div className="text-2xl font-black font-mono text-zinc-100">{myTasks.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Requiring your completion</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono">COMPLETION RATE</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">{completionRate}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">{completedTasks} of {totalTasks} tasks completed</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono">ATTENDANCE RATE</span>
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono text-blue-400">{attendanceStats.percentage}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">{attendanceStats.present} present / {attendanceStats.total} sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111318] border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono">OVERDUE / DELAYED</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black font-mono text-red-400">{delayedTasks + overdueTasks.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">{delayedTasks} delayed · {overdueTasks.length} past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Session & Flag Alerts */}
      {(activeSession || pendingFlagsCount > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {activeSession && (
            <div className="bg-[#111318] border border-[#00E5FF]/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="text-xs font-mono text-[#00E5FF] font-bold">CHECK-IN SESSION ACTIVE</div>
                  <div className="text-sm font-bold text-zinc-100">{activeSession.title}</div>
                </div>
              </div>
              <Link
                href={`/attendance/${activeSession.id}`}
                className="px-3 py-1.5 rounded-lg bg-[#00E5FF] text-[#0C0E13] font-bold text-xs hover:bg-[#00cce6] transition"
              >
                Check In Now
              </Link>
            </div>
          )}

          {pendingFlagsCount > 0 && (
            <div className="bg-[#111318] border border-amber-500/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs font-mono text-amber-400 font-bold">FLAG REVIEW QUEUE</div>
                  <div className="text-sm font-bold text-zinc-100">{pendingFlagsCount} check-in flags pending review</div>
                </div>
              </div>
              <Link
                href="/attendance"
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-[#0C0E13] font-bold text-xs hover:bg-amber-300 transition"
              >
                Review Flags
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Current Phase Progress */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-[#00E5FF]" />
            Current Planning Phase: {currentPhase?.name || "Preparation"}
          </CardTitle>
          <CardDescription>
            {currentPhase ? `Active from ${currentPhase.starts_on} to ${currentPhase.ends_on}` : "HackCrypt 2027-28 Preparation Period"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Phase Completion</span>
              <span className="text-[#00E5FF] font-bold">{completionRate}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#00E5FF] h-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown & Immediate Deadlines Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Status Distribution */}
        <Card className="bg-[#111318] border-zinc-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00E5FF]" />
              Task Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Completed
              </span>
              <span className="font-mono font-bold text-zinc-200">{completedTasks}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> In Progress
              </span>
              <span className="font-mono font-bold text-zinc-200">{inProgressTasks}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Under Review
              </span>
              <span className="font-mono font-bold text-zinc-200">{reviewTasks}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Not Started
              </span>
              <span className="font-mono font-bold text-zinc-200">{notStartedTasks}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Delayed
              </span>
              <span className="font-mono font-bold text-zinc-200">{delayedTasks}</span>
            </div>
          </CardContent>
        </Card>

        {/* Immediate Deadlines */}
        <Card className="bg-[#111318] border-zinc-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00E5FF]" />
                Urgent & Immediate Deadlines
              </CardTitle>
              <CardDescription>Tasks requiring immediate attention</CardDescription>
            </div>
            <Link href="/tasks" className="text-xs font-mono text-[#00E5FF] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">
                No active pending tasks assigned to you.
              </div>
            ) : (
              myTasks.slice(0, 4).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0C0E13] border border-zinc-800/80 hover:border-zinc-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="font-bold text-sm text-zinc-100">{task.title}</span>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <span>Dept: {task.department.toUpperCase()}</span>
                      <span>•</span>
                      <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline Preview */}
      <Card className="bg-[#111318] border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00E5FF]" />
              Recent Activity Feed
            </CardTitle>
            <CardDescription>Live stream of tasks, sessions, and audit events</CardDescription>
          </div>
          <Link href="/timeline" className="text-xs font-mono text-[#00E5FF] hover:underline flex items-center gap-1">
            Full Timeline <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTimeline.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0C0E13] border border-zinc-800/60"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-[#00E5FF]">
                      {item.type}
                    </span>
                    <span className="font-bold text-xs text-zinc-200">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{item.description}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
