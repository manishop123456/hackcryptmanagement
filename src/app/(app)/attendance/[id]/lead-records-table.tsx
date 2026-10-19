"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AttendanceRecordWithProfile } from "@/lib/attendance/queries";
import { OverrideDialog } from "@/components/attendance/override-dialog";
import { closeAttendanceSessionAction } from "@/lib/attendance/actions";
import { Users, Lock } from "lucide-react";

interface LeadRecordsTableProps {
  sessionId: string;
  records: AttendanceRecordWithProfile[];
  isLead: boolean;
}

export function LeadRecordsTable({ sessionId, records, isLead }: LeadRecordsTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordWithProfile | null>(null);
  const [closing, setClosing] = useState(false);

  const filteredRecords = records.filter((r) => {
    if (filter === "all") return true;
    if (filter === "flagged") return r.review === "pending" || r.flags.length > 0;
    return r.status === filter;
  });

  const handleCloseSession = async () => {
    if (!confirm("Are you sure you want to close this session? Check-in will be permanently disabled.")) {
      return;
    }
    setClosing(true);
    await closeAttendanceSessionAction(sessionId);
    setClosing(false);
    router.refresh();
  };

  return (
    <div className="bg-[#111318] border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2 text-zinc-100 font-bold text-base">
          <Users className="w-5 h-5 text-[#00E5FF]" />
          <span>Session Attendance Roster ({records.length})</span>
        </div>

        {isLead && (
          <button
            onClick={handleCloseSession}
            disabled={closing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition border border-zinc-700 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Close Session</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        {(["all", "present", "late", "excused", "absent", "flagged"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded-lg border capitalize transition whitespace-nowrap ${
              filter === tab
                ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
                : "bg-[#0C0E13] border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase">
              <th className="py-2.5 px-3">Member</th>
              <th className="py-2.5 px-3">Dept</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Flags</th>
              {isLead && <th className="py-2.5 px-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500">
                  No records match filter
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-900/50 transition">
                  <td className="py-3 px-3 font-medium text-zinc-100">
                    {record.member?.full_name || "Unknown"}
                  </td>
                  <td className="py-3 px-3 uppercase text-zinc-400">
                    {record.member?.department || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] uppercase font-bold ${
                        record.status === "present"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                          : record.status === "late"
                          ? "bg-yellow-950/60 text-yellow-400 border border-yellow-500/30"
                          : record.status === "excused"
                          ? "bg-blue-950/60 text-blue-400 border border-blue-500/30"
                          : "bg-red-950/60 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {record.checked_in_at
                      ? new Date(record.checked_in_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    {record.flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {record.flags.map((f) => (
                          <span
                            key={f}
                            className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]"
                          >
                            ⚠️ {f.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  {isLead && (
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono transition border border-zinc-700"
                      >
                        Override
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <OverrideDialog
          recordId={selectedRecord.id}
          memberName={selectedRecord.member?.full_name || "Member"}
          currentStatus={selectedRecord.status}
          onClose={() => setSelectedRecord(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
