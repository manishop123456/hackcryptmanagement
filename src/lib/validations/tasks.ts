// FILE: src/lib/validations/tasks.ts
// Zod schemas for task creation, update, comments, and filtering.

import { z } from "zod";

import { DEPARTMENTS, PRIORITIES, TASK_STATUSES, type Department, type Priority, type TaskStatus } from "@/lib/constants";

const departmentEnum = z.enum(DEPARTMENTS as unknown as [Department, ...Department[]]);
const priorityEnum = z.enum(PRIORITIES as unknown as [Priority, ...Priority[]]);
const statusEnum = z.enum(TASK_STATUSES as unknown as [TaskStatus, ...TaskStatus[]]);

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional().nullable(),
    department: departmentEnum,
    owner_id: z.string().uuid("Please select a task owner"),
    deadline: z.string().min(1, "Deadline is required").refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid deadline date format",
    }),
    priority: priorityEnum.default("medium"),
    status: statusEnum.default("not_started"),
    output: z.string().trim().optional().nullable(),
    remarks: z.string().trim().optional().nullable(),
    phase_id: z.string().uuid().optional().nullable(),
    blocked_by: z.array(z.string().uuid()).default([]),
  })
  .refine(
    (data) => {
      if (data.status === "completed") {
        return Boolean(data.output && data.output.trim().length > 0);
      }
      return true;
    },
    {
      message: "Output (link or note) is required when completing a task.",
      path: ["output"],
    },
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    id: z.string().uuid("Task ID is required"),
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional().nullable(),
    department: departmentEnum,
    owner_id: z.string().uuid("Please select a task owner"),
    deadline: z.string().min(1, "Deadline is required").refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid deadline date format",
    }),
    priority: priorityEnum,
    status: statusEnum,
    output: z.string().trim().optional().nullable(),
    remarks: z.string().trim().optional().nullable(),
    phase_id: z.string().uuid().optional().nullable(),
    blocked_by: z.array(z.string().uuid()).default([]),
  })
  .refine(
    (data) => {
      if (data.status === "completed") {
        return Boolean(data.output && data.output.trim().length > 0);
      }
      return true;
    },
    {
      message: "Output (link or note) is required when completing a task.",
      path: ["output"],
    },
  );

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const quickStatusUpdateSchema = z
  .object({
    id: z.string().uuid("Task ID is required"),
    status: statusEnum,
    output: z.string().trim().optional().nullable(),
    remarks: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === "completed") {
        return Boolean(data.output && data.output.trim().length > 0);
      }
      return true;
    },
    {
      message: "Output (link or note) is required when completing a task.",
      path: ["output"],
    },
  );

export type QuickStatusUpdateInput = z.infer<typeof quickStatusUpdateSchema>;

export const createTaskCommentSchema = z.object({
  task_id: z.string().uuid("Task ID is required"),
  body: z
    .string()
    .trim()
    .min(1, "Comment body cannot be empty")
    .max(4000, "Comment body cannot exceed 4000 characters"),
});

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;

export const deleteTaskCommentSchema = z.object({
  id: z.string().uuid("Comment ID is required"),
});

export const deleteTaskSchema = z.object({
  id: z.string().uuid("Task ID is required"),
});

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Input validation failed.";
}
