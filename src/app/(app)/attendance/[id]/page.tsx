import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getAttendanceSessionById,
  getAttendanceRecordsForSession,
  getMySessionRecord,
  getSessionCoordinates,
} from "@/lib/attendance/queries";
import { CheckInForm } from "@/components/attendance/check-in-form";
import { LivePasscode } from "@/components/attendance/live-passcode";
import { SessionMap } from "@/components/attendance/session-map";
import { CSVExportButton } from "@/components/attendance/csv-export-button";
import { LeadRecordsTable } from "./lead-records-table";
import { ArrowLeft, Clock, MapPin } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAttendanceSessionById(id);
  return {
    title: session ? `${session.title} | Attendance` : "Session Not Found",
  };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const session = await getAttendanceSessionById(id);
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Session Not Found</h1>
        <p className="text-zinc-400 mb-6">The requested attendance session does not exist.</p>
        <Link href="/attendance" className="text-[#00E5FF] font-mono text-sm underline">
          &larr; Back to Attendance Overview
        </Link>
      </div>
    );
  }

  const myRecord = await getMySessionRecord(session.id, user.id);
  const records = await getAttendanceRecordsForSession(session.id);
  const checkinCoords = await getSessionCoordinates(session.id);

  const isLead = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
    "team_lead",
    "admin_lead",
  ].includes(profile.role);

  const now = new Date();
  const startsAt = new Date(session.starts_at);
  const endsAt = new Date(session.ends_at);
  const isClosed = !!session.closed_at;
  const isOpen = !isClosed && now >= new Date(startsAt.getTime() - 10 * 60 * 1000) && now <= endsAt;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div>
        <Link
          href="/attendance"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-[#00E5FF] transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Attendance Sessions</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {session.type.replace("_", " ")}
              </span>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Dept: {session.department ? session.department.toUpperCase() : "ALL"}
              </span>
              {isOpen ? (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE CHECK-IN OPEN
                </span>
              ) : isClosed ? (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                  CLOSED BY LEAD
                </span>
              ) : (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  ENDED
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
              {session.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>
                  {startsAt.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  - {endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {session.venue_name && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span>
                    {session.venue_name} ({session.radius_m}m radius)
                  </span>
                </div>
              )}
            </div>
          </div>

          {isLead && records.length > 0 && (
            <CSVExportButton sessionTitle={session.title} records={records} />
          )}
        </div>
      </div>

      {/* Main Grid: Check-in / Lead Panel */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Member Check-In & Passcode */}
        <div className="lg:col-span-5 space-y-6">
          <CheckInForm
            sessionId={session.id}
            sessionTitle={session.title}
            requireCode={session.require_code}
            isOpen={isOpen}
            existingRecord={myRecord}
          />

          {isLead && session.require_code && !isClosed && (
            <LivePasscode sessionId={session.id} />
          )}
        </div>

        {/* Right Column: Interactive Map & Roster Table */}
        <div className="lg:col-span-7 space-y-6">
          {session.venue_lat && session.venue_lng && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00E5FF]" />
                  VENUE RADIUS & CHECK-IN MAP
                </span>
                <span>{checkinCoords.length} pins visible</span>
              </div>
              <SessionMap
                venueLat={session.venue_lat}
                venueLng={session.venue_lng}
                venueName={session.venue_name}
                radiusM={session.radius_m}
                checkinCoords={checkinCoords}
              />
            </div>
          )}

          {/* Lead Control Panel / Attendance Roster */}
          <LeadRecordsTable
            sessionId={session.id}
            records={records}
            isLead={isLead}
          />
        </div>
      </div>
    </div>
  );
}
