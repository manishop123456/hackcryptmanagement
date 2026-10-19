// FILE: src/components/status-badge.tsx
// Status badges. Each one shows a colour AND a label AND an icon, so the state is never
// communicated by colour alone (an accessibility requirement in the spec).

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock,
  Flame,
  Loader,
  MinusCircle,
  ShieldAlert,
  ShieldQuestion,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  ATTENDANCE_STATUS_LABELS,
  DEPARTMENT_LABELS,
  FLAG_LABELS,
  PRIORITIES,
  ROLE_LABELS,
  TASK_STATUSES,
  type AppRole,
  type AttendanceFlag,
  type AttendanceStatus,
  type Department,
  type Priority,
  type TaskStatus,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; variant: BadgeProps["variant"] }
> = {
  not_started: { label: "Assigned", icon: Circle, variant: "muted" },
  in_progress: { label: "In Progress", icon: Loader, variant: "accent" },
  review: { label: "Submitted", icon: ShieldQuestion, variant: "warning" },
  changes_requested: { label: "Changes Requested", icon: AlertTriangle, variant: "warning" },
  completed: { label: "Approved", icon: CheckCircle2, variant: "success" },
  delayed: { label: "Delayed", icon: AlertTriangle, variant: "danger" },
  cancelled: { label: "Cancelled", icon: MinusCircle, variant: "muted" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  // Guard against a value arriving from the database that is not in our list.
  const config = TASK_STATUS_CONFIG[status] ?? TASK_STATUS_CONFIG.not_started;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon />
      {config.label}
    </Badge>
  );
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "border-danger/40 text-danger" },
  medium: { label: "Medium", className: "border-warning/40 text-warning" },
  low: { label: "Low", className: "border-border text-muted-foreground" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.low;
  return (
    <Badge variant="muted" className={config.className}>
      {priority === "high" ? <Flame /> : null}
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

const ATTENDANCE_CONFIG: Record<
  AttendanceStatus,
  { icon: LucideIcon; variant: BadgeProps["variant"] }
> = {
  present: { icon: UserCheck, variant: "success" },
  late: { icon: Clock, variant: "warning" },
  excused: { icon: ShieldQuestion, variant: "accent" },
  absent: { icon: MinusCircle, variant: "danger" },
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config = ATTENDANCE_CONFIG[status] ?? ATTENDANCE_CONFIG.absent;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon />
      {ATTENDANCE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

const FLAG_CONFIG: Record<AttendanceFlag, { icon: LucideIcon; variant: BadgeProps["variant"] }> = {
  no_location: { icon: CircleDashed, variant: "warning" },
  outside_area: { icon: ShieldAlert, variant: "warning" },
  low_accuracy: { icon: AlertTriangle, variant: "warning" },
};

export function FlagBadges({ flags }: { flags: AttendanceFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {flags.map((flag) => {
        const config = FLAG_CONFIG[flag] ?? FLAG_CONFIG.no_location;
        const Icon = config.icon;
        return (
          <Badge key={flag} variant={config.variant}>
            <Icon />
            {FLAG_LABELS[flag] ?? flag}
          </Badge>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Departments and roles
// ---------------------------------------------------------------------------

export type RagStatus = "green" | "yellow" | "red";

const RAG_CONFIG: Record<RagStatus, { label: string; icon: LucideIcon; variant: BadgeProps["variant"] }> = {
  green: { label: "On track", icon: CheckCircle2, variant: "success" },
  yellow: { label: "Needs attention", icon: AlertTriangle, variant: "warning" },
  red: { label: "Delayed / Critical", icon: Flame, variant: "danger" },
};

export function RagBadge({ status }: { status: RagStatus }) {
  const config = RAG_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon />
      {config.label}
    </Badge>
  );
}

export function DepartmentBadge({ department }: { department: Department | null }) {
  if (!department) {
    return <Badge variant="muted">All departments</Badge>;
  }
  return <Badge variant="default">{DEPARTMENT_LABELS[department] ?? department}</Badge>;
}

export function RoleBadge({ role }: { role: AppRole }) {
  return <Badge variant="accent">{ROLE_LABELS[role] ?? role}</Badge>;
}

export { PRIORITIES, TASK_STATUSES };
