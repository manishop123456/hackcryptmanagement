// FILE: src/lib/constants.ts
// Shared vocabularies. These mirror the Postgres enums in
// supabase/migrations/0001_enums.sql and 0018_devclub_management_system.sql.

export const APP_ROLES = [
  "faculty",
  "president",
  "vice_president",
  "management_head",
  "development_head",
  "development_co_head",
  "management_co_head",
  "co_head",
  "hackathon_head",
  "team_lead",
  "member",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEPARTMENTS = [
  "creatives",
  "admin",
  "social_media",
  "pr",
  "development",
  "hackathon",
  "management",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "review",
  "changes_requested",
  "completed",
  "delayed",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SESSION_TYPES = [
  "meeting",
  "level_up",
  "event_day",
  "work_session",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const ATTENDANCE_STATUSES = ["present", "late", "excused", "absent"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_FLAGS = ["no_location", "outside_area", "low_accuracy"] as const;
export type AttendanceFlag = (typeof ATTENDANCE_FLAGS)[number];

export const REVIEW_STATUSES = ["not_needed", "pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  faculty: "Faculty Head",
  president: "President",
  vice_president: "Vice President",
  management_head: "Management Head",
  development_head: "Development Head",
  development_co_head: "Development Co-Head",
  management_co_head: "Management Co-Head",
  co_head: "Co-Head",
  hackathon_head: "Hackathon Head",
  team_lead: "Team Lead",
  member: "Member",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  creatives: "Creatives",
  admin: "Admin",
  social_media: "Social Media",
  pr: "PR",
  development: "Development",
  hackathon: "Hackathon",
  management: "Management",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Assigned",
  in_progress: "In Progress",
  review: "Submitted",
  changes_requested: "Changes Requested",
  completed: "Approved",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  meeting: "Meeting",
  level_up: "Level Up",
  event_day: "Event day",
  work_session: "Work session",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  excused: "Excused",
  absent: "Absent",
};

export const FLAG_LABELS: Record<AttendanceFlag, string> = {
  no_location: "No location",
  outside_area: "Outside area",
  low_accuracy: "Low accuracy",
};

/** Roles that require a department scope. */
export function roleNeedsDepartment(role: AppRole): boolean {
  return role === "team_lead" || role === "co_head";
}
