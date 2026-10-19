"use client";

import { useState } from "react";
import { checkInMemberAction } from "@/lib/attendance/actions";
import { MapPin, ShieldCheck, AlertTriangle, CheckCircle, Clock, KeyRound } from "lucide-react";

interface CheckInFormProps {
  sessionId: string;
  sessionTitle: string;
  requireCode: boolean;
  isOpen: boolean;
  existingRecord?: {
    status: string;
    flags: string[];
    review: string;
    checked_in_at: string | null;
  } | null;
}

export function CheckInForm({
  sessionId,
  sessionTitle,
  requireCode,
  isOpen,
  existingRecord,
}: CheckInFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy_m: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: string;
    flags: string[];
    review: string;
    message: string;
  } | null>(existingRecord ? {
    status: existingRecord.status,
    flags: existingRecord.flags,
    review: existingRecord.review,
    message: existingRecord.review === "pending"
      ? "Check-in recorded. Sent for team lead review."
      : `Already checked in (${existingRecord.status}).`
  } : null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setErrorMsg("Browser geolocation is not supported on this device.");
      return;
    }

    setLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        });
        setLocationDenied(false);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationDenied(true);
        console.warn("Location error:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await checkInMemberAction({
        session_id: sessionId,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        accuracy_m: coords?.accuracy_m ?? null,
        code: requireCode ? code : null,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Check-in failed");
      } else {
        setResult({
          status: res.status || "present",
          flags: res.flags || [],
          review: res.review || "not_needed",
          message: res.message || "Check-in successful",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const isPending = result.review === "pending";
    const isLate = result.status === "late";

    return (
      <div className={`p-5 rounded-xl border ${
        isPending
          ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
          : isLate
          ? "bg-yellow-950/30 border-yellow-500/40 text-yellow-200"
          : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
      }`}>
        <div className="flex items-start gap-3">
          {isPending ? (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
              Status: <span className="font-mono">{result.status}</span>
              {isPending && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Pending Review
                </span>
              )}
            </h3>
            <p className="text-sm mt-1 text-zinc-300">{result.message}</p>
            {result.flags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.flags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-amber-500/30 text-amber-300 font-mono"
                  >
                    Flag: {flag.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111318] border border-zinc-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 text-[#00E5FF] mb-2 font-mono text-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>VERIFIED CHECK-IN</span>
      </div>

      <h2 className="text-xl font-bold text-zinc-100 mb-1">{sessionTitle}</h2>
      <p className="text-xs text-zinc-400 mb-6">
        Privacy Notice: Your location is read once to verify venue radius. Continuous tracking is never enabled.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCheckIn} className="space-y-5">
        {/* Geolocation Section */}
        <div className="p-4 rounded-lg bg-[#0C0E13] border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium">
              <MapPin className="w-4 h-4 text-[#00E5FF]" />
              <span>Location Coordinates</span>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locating}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-mono disabled:opacity-50"
            >
              {locating ? "Locating..." : coords ? "Update Location" : "Acquire GPS"}
            </button>
          </div>

          {coords ? (
            <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>
                GPS Acquired ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}) ±{Math.round(coords.accuracy_m)}m
              </span>
            </div>
          ) : locationDenied ? (
            <p className="mt-2 text-xs text-amber-400">
              Location permission denied. Check-in will be recorded with <code className="font-mono">no_location</code> flag for lead review.
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              Tap &quot;Acquire GPS&quot; to verify venue proximity, or proceed without location (will flag for review).
            </p>
          )}
        </div>

        {/* Dynamic Passcode Section */}
        {requireCode && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#00E5FF]" />
              Live 6-Digit Passcode <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required={requireCode}
              className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 font-mono text-center tracking-[0.5em] text-xl focus:outline-none focus:border-[#00E5FF] transition"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Enter the passcode displayed on the organizer&apos;s screen.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isOpen}
          className="w-full py-3.5 px-4 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] font-bold transition shadow-lg shadow-[#00E5FF]/10 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Clock className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Submit Check-In</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
