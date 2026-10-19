// FILE: src/app/(app)/event-day/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Starfield } from "@/components/starfield";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  LifeBuoy,
  MapPin,
  Plus,
  Radio,
  Rocket,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Event-Day War Room | HackCrypt 2027-28",
  description: "Live event operations, venue check-in monitoring, emergency desk, and real-time passcodes",
};

export default async function EventDayPage() {
  const profile = await requireActiveProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch active sessions and recent high-priority issues
  const [{ data: activeSessions }, { data: activeIssues }, { data: teams }] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("*")
      .is("closed_at", null)
      .order("starts_at", { ascending: false }),
    supabase
      .from("issues")
      .select("*")
      .in("status", ["open", "escalated"])
      .order("created_at", { ascending: false }),
    supabase.from("teams").select("id, name, college, status").eq("status", "confirmed"),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Starfield density={40} opacity={0.2} />

      <PageHeader
        title="HackCrypt 2027-28 Live War Room"
        description="Real-time event operations center for 8–9 January 2027. Monitor live check-ins, issue desk, and venue activity."
      />

      {/* Top War Room Pulse Banner */}
      <div className="bg-gradient-to-r from-red-500/10 via-[#00E5FF]/10 to-amber-500/10 border border-[#00E5FF]/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] animate-pulse">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-wider">
                • EVENT DAY OPERATIONAL MODE ACTIVE
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-zinc-100 font-mono">
              HackCrypt 2027-28 • Main Auditorium & Labs 401-405
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/issues/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-mono font-bold transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Escalate Live Issue</span>
          </Link>

          <Link
            href="/attendance/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] text-xs font-mono font-bold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Open Attendance Session</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Attendance Sessions & Active Emergency Desk */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Attendance Sessions */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
                <span>Active Live Attendance Sessions ({(activeSessions || []).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activeSessions || activeSessions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-mono">No active attendance session currently open.</p>
                  <Link
                    href="/attendance/new"
                    className="inline-flex items-center gap-1.5 text-xs text-[#00E5FF] font-mono font-bold hover:underline"
                  >
                    + Open Event Day Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-[#0C0E13] p-4 rounded-xl border border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-zinc-100 text-sm">{session.title}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>Venue: {session.venue_name}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">Passcode Active</span>
                        </div>
                      </div>

                      <Link
                        href={`/attendance/${session.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
                      >
                        <span>Open Live Roster</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Incident Desk */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                <LifeBuoy className="w-5 h-5 text-amber-400" />
                <span>Active Event Helpdesk & Issues ({(activeIssues || []).length})</span>
              </CardTitle>
              <Link
                href="/issues"
                className="text-xs font-mono text-[#00E5FF] hover:underline font-bold"
              >
                View Log
              </Link>
            </CardHeader>
            <CardContent>
              {!activeIssues || activeIssues.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4 font-mono">
                  All systems operational. No active emergency issues logged.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-[#0C0E13] p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-zinc-200">{issue.title}</div>
                        <div className="text-[11px] font-mono text-zinc-400 uppercase">
                          Severity: <span className="text-amber-400 font-bold">{issue.severity}</span> • Status: {issue.status}
                        </div>
                      </div>
                      <Link
                        href="/issues"
                        className="text-xs font-mono text-[#00E5FF] font-bold hover:underline"
                      >
                        Resolve
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Confirmed Teams & Quick Operations Summary */}
        <div className="space-y-6">
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-200 uppercase font-mono flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400" />
                <span>Confirmed Hackathon Teams ({(teams || []).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              {!teams || teams.length === 0 ? (
                <p className="text-zinc-500 italic text-center py-2">No confirmed teams yet.</p>
              ) : (
                <div className="space-y-2">
                  {teams.slice(0, 6).map((t) => (
                    <div
                      key={t.id}
                      className="bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-bold text-zinc-200 truncate max-w-[140px]">{t.name}</span>
                      <span className="text-zinc-500 truncate max-w-[110px]">{t.college}</span>
                    </div>
                  ))}
                  {teams.length > 6 && (
                    <div className="text-[10px] text-zinc-500 text-center pt-1">
                      + {teams.length - 6} more confirmed teams
                    </div>
                  )}
                </div>
              )}
              <Link
                href="/hackcrypt"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-xs transition"
              >
                <span>Full HackCrypt Desk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Operational Protocols */}
          <Card className="bg-[#111318] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-200 uppercase font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Event Day Protocols</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] font-mono text-zinc-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Location verification mandatory at venue doorstep.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>HMAC passcode changes dynamically every 30 seconds.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Department Leads verify flagged check-ins with remarks.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
