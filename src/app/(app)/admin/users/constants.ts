// FILE: src/app/(app)/admin/users/constants.ts
// Standard state types and initial constants for admin user form submissions.
// This module must NOT contain "use server" so client components can import constants.

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_ADMIN_STATE: AdminActionState = { status: "idle", message: "" };
