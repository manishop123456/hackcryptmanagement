"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAttendanceSessionAction } from "@/lib/attendance/actions";
import { MapPin, AlertTriangle } from "lucide-react";

interface CreateSessionFormProps {
  userRole: string;
  userDepartment: string | null;
}

export function CreateSessionForm({ userRole, userDepartment }: CreateSessionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"meeting" | "level_up" | "event_day" | "work_session">("meeting");
  const [department, setDepartment] = useState<string>(userDepartment || "creatives");
  const [isAllDept, setIsAllDept] = useState<boolean>(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [venueName, setVenueName] = useState("TRCAC Campus");
  const [venueLat, setVenueLat] = useState<number>(19.2312);
  const [venueLng, setVenueLng] = useState<number>(72.8567);
  const [radiusM, setRadiusM] = useState(100);
  const [requireCode, setRequireCode] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCore = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
  ].includes(userRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAt || !endsAt) {
      setError("Start time and end time are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createAttendanceSessionAction({
        title,
        type,
        department: isAllDept ? null : (department as "creatives" | "pr" | "social_media" | "admin"),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        grace_minutes: Number(graceMinutes),
        venue_name: venueName || null,
        venue_lat: venueLat ? Number(venueLat) : null,
        venue_lng: venueLng ? Number(venueLng) : null,
        radius_m: Number(radiusM),
        require_code: requireCode,
      });

      if (!res.success) {
        setError(res.error || "Failed to create session");
      } else if (res.sessionId) {
        router.push(`/attendance/${res.sessionId}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#111318] border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-mono text-zinc-300 mb-1">
          Session Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Creatives Weekly Review & Sprint 4 Setup"
          required
          minLength={3}
          maxLength={200}
          className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Session Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "meeting" | "level_up" | "event_day" | "work_session")}
            className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
          >
            <option value="meeting">Meeting</option>
            <option value="work_session">Work Session</option>
            <option value="level_up">Level Up Lecture</option>
            <option value="event_day">Event Day</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Target Department</label>
          {isCore ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="allDeptCheck"
                  checked={isAllDept}
                  onChange={(e) => setIsAllDept(e.target.checked)}
                  className="rounded bg-[#0C0E13] border-zinc-700 text-[#00E5FF] focus:ring-0"
                />
                <label htmlFor="allDeptCheck" className="text-xs text-zinc-300 font-mono">
                  All Departments (Event Day)
                </label>
              </div>
              {!isAllDept && (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
                >
                  <option value="creatives">Creatives</option>
                  <option value="pr">PR</option>
                  <option value="social_media">Social Media</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          ) : (
            <input
              type="text"
              readOnly
              value={(userDepartment || "creatives").toUpperCase()}
              className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-400 font-mono"
            />
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">
            Starts At <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">
            Ends At <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            required
            className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Grace Period (Minutes)</label>
          <input
            type="number"
            min={0}
            max={120}
            value={graceMinutes}
            onChange={(e) => setGraceMinutes(Number(e.target.value))}
            className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Allowed Radius (Meters)</label>
          <input
            type="number"
            min={10}
            max={10000}
            value={radiusM}
            onChange={(e) => setRadiusM(Number(e.target.value))}
            className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Live Passcode Security</label>
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="codeCheck"
              checked={requireCode}
              onChange={(e) => setRequireCode(e.target.checked)}
              className="rounded bg-[#0C0E13] border-zinc-700 text-[#00E5FF] focus:ring-0 w-4 h-4"
            />
            <label htmlFor="codeCheck" className="text-xs text-zinc-300 font-mono">
              Require 30s Dynamic Code
            </label>
          </div>
        </div>
      </div>

      {/* Venue Coordinates */}
      <div className="p-4 rounded-lg bg-[#0C0E13] border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <MapPin className="w-4 h-4 text-[#00E5FF]" />
          <span>Venue Map Location</span>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">Venue Name / Room</label>
          <input
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="e.g. TRCAC Seminar Hall B"
            className="w-full bg-[#111318] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00E5FF] transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Venue Latitude</label>
            <input
              type="number"
              step="any"
              value={venueLat}
              onChange={(e) => setVenueLat(Number(e.target.value))}
              className="w-full bg-[#111318] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#00E5FF] transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Venue Longitude</label>
            <input
              type="number"
              step="any"
              value={venueLng}
              onChange={(e) => setVenueLng(Number(e.target.value))}
              className="w-full bg-[#111318] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#00E5FF] transition"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold transition shadow-lg shadow-[#00E5FF]/10 disabled:opacity-50 font-mono text-sm"
      >
        {loading ? "Creating Session..." : "Create & Launch Session"}
      </button>
    </form>
  );
}
