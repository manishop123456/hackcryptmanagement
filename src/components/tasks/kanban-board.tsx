// FILE: src/components/tasks/kanban-board.tsx
// Responsive Kanban Board layout for tasks.

"use client";

import { AlertTriangle, CheckCircle2, Circle, Clock, Loader } from "lucide-react";

import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import type { TaskWithDetails } from "@/lib/tasks/queries";
import type { ProfileRow } from "@/types/database";

const COLUMN_CONFIG: Record<
  TaskStatus,
  { title: string; icon: React.ComponentType<{ className?: string }>; border: string }
> = {
  not_started: { title: "Assigned", icon: Circle, border: "border-border" },
  in_progress: { title: "In Progress", icon: Loader, border: "border-accent/40" },
  review: { title: "Submitted", icon: Clock, border: "border-warning/40" },
  changes_requested: { title: "Changes Requested", icon: AlertTriangle, border: "border-warning/40" },
  completed: { title: "Approved", icon: CheckCircle2, border: "border-success/40" },
  delayed: { title: "Delayed", icon: AlertTriangle, border: "border-danger/40" },
  cancelled: { title: "Cancelled", icon: AlertTriangle, border: "border-muted" },
};

export function KanbanBoard({
  tasks,
  currentUser,
  onEdit,
}: {
  tasks: TaskWithDetails[];
  currentUser: ProfileRow;
  onEdit?: (task: TaskWithDetails) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const config = COLUMN_CONFIG[status];
        const Icon = config.icon;

        return (
          <div
            key={status}
            className="flex flex-col rounded-2xl border border-border bg-surface-2/40 p-3 shadow-inner min-h-[400px]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${config.border}`}>
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-accent" />
                <h2 className="text-xs font-semibold text-strong tracking-wide uppercase">
                  {config.title}
                </h2>
              </div>
              <Badge variant="muted" className="font-mono text-xs">
                {columnTasks.length}
              </Badge>
            </div>

            {/* Task List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface-1/30 p-4 text-center text-xs text-muted-foreground">
                  No tasks in {config.title.toLowerCase()}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUser={currentUser}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
