"use client";

import { useState } from "react";
import { overrideAttendanceRecordAction } from "@/lib/attendance/actions";
import { UserCheck, X, AlertTriangle, MessageSquare } from "lucide-react";

interface OverrideDialogProps {
  recordId: string;
  memberName: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OverrideDialog({
  recordId,
  memberName,
  currentStatus,
  onClose,
  onSuccess,
}: OverrideDialogProps) {
  const isStatus = (s: string): s is "present" | "late" | "excused" | "absent" =>
    ["present", "late", "excused", "absent"].includes(s);

  const [status, setStatus] = useState<"present" | "late" | "excused" | "absent">(
    isStatus(currentStatus) ? currentStatus : "present"
  );
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remark.trim().length < 5) {
      setError("Remark must be at least 5 characters long for manual overrides.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await overrideAttendanceRecordAction({
        record_id: recordId,
        status,
        remark,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit override");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#00E5FF] font-mono text-sm mb-1">
          <UserCheck className="w-4 h-4" />
          <span>MANUAL OVERRIDE</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-4">
          Override Attendance: <span className="text-[#00E5FF]">{memberName}</span>
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">
              New Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["present", "late", "excused", "absent"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono capitalize border transition ${
                    status === st
                      ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
                      : "bg-[#0C0E13] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              Reason / Remark <span className="text-red-400">* (min 5 chars)</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Provide clear reason for manual override (mandatory for audit trail)..."
              rows={3}
              required
              minLength={5}
              className="w-full bg-[#0C0E13] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00E5FF] transition"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 text-xs font-mono transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#00E5FF] hover:bg-[#00cce6] text-[#0C0E13] text-xs font-bold font-mono transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
