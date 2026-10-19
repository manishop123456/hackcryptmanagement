// FILE: src/lib/tasks/constants.ts
// Standard state types and initial constants for task form submissions.
// This module must NOT contain "use server" so client components can import constants.

export type TaskActionState = {
  status: "idle" | "success" | "error";
  message: string;
  taskId?: string;
};

export const INITIAL_TASK_STATE: TaskActionState = { status: "idle", message: "" };
