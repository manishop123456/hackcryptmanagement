import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAttendanceSessions,
  getMemberAttendanceStats,
} from "@/lib/attendance/queries";
import { FlagReviewCard } from "@/components/attendance/flag-review-card";
import {
  Clock,
  MapPin,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Filter,
} from "lucide-react";

export const metadata = {
  title: "Attendance | HackCrypt Management",
  description: "Location-verified attendance tracking and management",
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/pending");

  const sessions = await getAttendanceSessions();
  const stats = await getMemberAttendanceStats(user.id);

  // Check if lead/core can create session
  const canCreateSession = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
    "team_lead",
  ].includes(profile.role);

  // Filter sessions by department query if provided
  const filteredSessions = params.dept
    ? sessions.filter((s) => s.department === params.dept)
    : sessions;

  // Fetch all pending flagged records for leads
  let pendingFlags: Array<{
    id: string;
    status: string;
    flags: string[];
    checked_in_at: string | null;
    distance_m: number | null;
    accuracy_m: number | null;
    member?: { full_name: string | null; department: string | null } | null;
  }> = [];
  if (canCreateSession) {
    const { data: records } = await supabase
      .from("attendance_records")
      .select(`
        *,
        member:profiles!attendance_records_member_id_fkey(full_name, email, department)
      `)
      .eq("review", "pending")
      .order("created_at", { ascending: false });
    pendingFlags = (records as unknown as typeof pendingFlags) || [];
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#00E5FF] font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>DEVCLUB HACKCRYPT 2027-28</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            Attendance Verification
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Location-verified, code-secured check-ins and lead control panel.
          </p>
        </div>

        {canCreateSession && (
          <Link
            href="/attendance/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold text-sm transition shadow-lg shadow-[#00E5FF]/10 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Session</span>
          </Link>
        )}
      </div>

      {/* Member Attendance Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#111318] border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-mono text-zinc-400">ATTENDANCE RATE</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-[#00E5FF]">
              {stats.percentage}%
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Present + Late + Excused</p>
        </div>

        <div className="bg-[#111318] border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-mono text-zinc-400">PRESENT</p>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {stats.present}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">On-time check-ins</p>
        </div>

        <div className="bg-[#111318] border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-mono text-zinc-400">LATE</p>
          <div className="text-2xl font-black font-mono text-yellow-400 mt-1">
            {stats.late}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">After grace period</p>
        </div>

        <div className="bg-[#111318] border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-mono text-zinc-400">EXCUSED</p>
          <div className="text-2xl font-black font-mono text-blue-400 mt-1">
            {stats.excused}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Approved absences</p>
        </div>

        <div className="bg-[#111318] border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-mono text-zinc-400">ABSENT</p>
          <div className="text-2xl font-black font-mono text-red-400 mt-1">
            {stats.absent}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Unexcused / Rejected</p>
        </div>
      </div>

      {/* Lead Flag Review Queue */}
      {canCreateSession && pendingFlags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>FLAG REVIEW QUEUE ({pendingFlags.length} PENDING)</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {pendingFlags.map((record) => (
              <FlagReviewCard
                key={record.id}
                recordId={record.id}
                memberName={record.member?.full_name || "Member"}
                department={record.member?.department ?? null}
                status={record.status}
                flags={record.flags}
                checkedInAt={record.checked_in_at}
                distanceM={record.distance_m}
                accuracyM={record.accuracy_m}
              />
            ))}
          </div>
        </div>
      )}

      {/* Session Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-mono">
        <span className="text-zinc-500 flex items-center gap-1 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Department:
        </span>
        <Link
          href="/attendance"
          className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
            !params.dept
              ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
              : "bg-[#111318] border-zinc-800 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          All Departments
        </Link>
        {(["creatives", "pr", "social_media", "admin"] as const).map((dept) => (
          <Link
            key={dept}
            href={`/attendance?dept=${dept}`}
            className={`px-3 py-1.5 rounded-lg border capitalize transition whitespace-nowrap ${
              params.dept === dept
                ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
                : "bg-[#111318] border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {dept.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Sessions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center justify-between">
          <span>Attendance Sessions ({filteredSessions.length})</span>
        </h2>

        {filteredSessions.length === 0 ? (
          <div className="bg-[#111318] border border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-sm">
            No attendance sessions found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => {
              const now = new Date();
              const startsAt = new Date(session.starts_at);
              const endsAt = new Date(session.ends_at);
              const isClosed = !!session.closed_at;
              const isActive = !isClosed && now >= startsAt && now <= endsAt;

              return (
                <Link
                  key={session.id}
                  href={`/attendance/${session.id}`}
                  className={`group bg-[#111318] border rounded-xl p-5 transition flex flex-col justify-between hover:border-[#00E5FF]/50 shadow-md ${
                    isActive
                      ? "border-[#00E5FF]/40 bg-[#111318]/90 ring-1 ring-[#00E5FF]/20"
                      : "border-zinc-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {session.type.replace("_", " ")}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          CHECK-IN OPEN
                        </span>
                      ) : isClosed ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">
                          CLOSED
                        </span>
                      ) : now > endsAt ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">
                          ENDED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          UPCOMING
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-zinc-100 group-hover:text-[#00E5FF] transition text-base line-clamp-1">
                      {session.title}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>
                          {startsAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          • {startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {session.venue_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="line-clamp-1">{session.venue_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span>
                      Dept: {session.department ? session.department.toUpperCase() : "ALL"}
                    </span>
                    <span className="text-[#00E5FF] group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
