"use client";

import { Download } from "lucide-react";
import { AttendanceRecordWithProfile } from "@/lib/attendance/queries";

interface CSVExportButtonProps {
  sessionTitle: string;
  records: AttendanceRecordWithProfile[];
}

export function CSVExportButton({ sessionTitle, records }: CSVExportButtonProps) {
  const handleExport = () => {
    if (!records || records.length === 0) return;

    const headers = [
      "Member Name",
      "Email",
      "Department",
      "Status",
      "Checked In At",
      "Method",
      "Flags",
      "Review Verdict",
      "Remark",
    ];

    const rows = records.map((r) => [
      `"${r.member?.full_name || "Unknown"}"`,
      `"${r.member?.email || ""}"`,
      `"${r.member?.department || ""}"`,
      `"${r.status}"`,
      `"${r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : ""}"`,
      `"${r.method}"`,
      `"${(r.flags || []).join("; ")}"`,
      `"${r.review}"`,
      `"${(r.remark || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeTitle = sessionTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.setAttribute("download", `attendance_${safeTitle}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition border border-zinc-700"
    >
      <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
      <span>Export CSV</span>
    </button>
  );
}
