"use client";

import { useState } from "react";
import { reviewAttendanceFlagAction } from "@/lib/attendance/actions";
import { Check, X } from "lucide-react";

interface FlagReviewCardProps {
  recordId: string;
  memberName: string;
  department: string | null;
  status: string;
  flags: string[];
  checkedInAt: string | null;
  distanceM: number | null;
  accuracyM: number | null;
  onSuccess?: () => void;
}

export function FlagReviewCard({
  recordId,
  memberName,
  department,
  status,
  flags,
  checkedInAt,
  distanceM,
  accuracyM,
  onSuccess,
}: FlagReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async (action: "approve" | "reject") => {
    setLoading(true);
    setError(null);

    try {
      const res = await reviewAttendanceFlagAction({
        record_id: recordId,
        action,
      });

      if (!res.success) {
        setError(res.error || "Review failed");
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0C0E13] border border-amber-500/30 rounded-xl p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-zinc-100 text-sm">{memberName}</h4>
            {department && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {department}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Initial Status: <span className="font-mono text-amber-300">{status}</span> •{" "}
            {checkedInAt ? new Date(checkedInAt).toLocaleTimeString() : "No timestamp"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleReview("approve")}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono hover:bg-emerald-900/60 transition disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleReview("reject")}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono hover:bg-red-900/60 transition disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject (Absent)</span>
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400">
        <div className="flex flex-wrap gap-1">
          {flags.map((flag) => (
            <span
              key={flag}
              className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]"
            >
              ⚠️ {flag.replace("_", " ")}
            </span>
          ))}
        </div>
        <div className="text-[11px] text-zinc-500">
          {distanceM !== null && `Dist: ${Math.round(distanceM)}m `}
          {accuracyM !== null && `Acc: ±${Math.round(accuracyM)}m`}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
