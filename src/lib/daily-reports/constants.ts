// FILE: src/lib/daily-reports/constants.ts
// Standard state types and initial constants for daily report form submissions.
// This module must NOT contain "use server" so client components can import constants.

export type DailyReportActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_REPORT_STATE: DailyReportActionState = {
  status: "idle",
  message: "",
};
