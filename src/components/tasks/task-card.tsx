// FILE: src/components/tasks/task-card.tsx
// Cinematic task card component for Kanban board and List view.

"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, ExternalLink, MoreVertical, User } from "lucide-react";

import { DepartmentBadge, PriorityBadge, TaskStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { quickUpdateTaskStatus } from "@/app/(app)/tasks/actions";
import { INITIAL_TASK_STATE } from "@/lib/tasks/constants";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import type { TaskWithDetails } from "@/lib/tasks/queries";
import { formatPlainDate, isDatePast } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export function TaskCard({
  task,
  currentUser,
  onEdit,
}: {
  task: TaskWithDetails;
  currentUser: ProfileRow;
  onEdit?: (task: TaskWithDetails) => void;
}) {
  const [state, formAction, isPending] = useActionState(quickUpdateTaskStatus, INITIAL_TASK_STATE);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [outputInput, setOutputInput] = useState(task.output ?? "");

  const isOverdue = task.status !== "completed" && isDatePast(task.deadline);
  const canEdit =
    currentUser.role === "president" ||
    currentUser.role === "vice_president" ||
    currentUser.role === "management_head" ||
    currentUser.role === "development_head" ||
    (currentUser.role === "hackathon_head" && task.department === "hackathon") ||
    (currentUser.role === "team_lead" && currentUser.department === task.department) ||
    currentUser.id === task.owner_id;

  const handleStatusSelect = (targetStatus: TaskStatus) => {
    if (targetStatus === "completed" && !task.output) {
      setCompleteDialogOpen(true);
      return;
    }
    const formData = new FormData();
    formData.append("id", task.id);
    formData.append("status", targetStatus);
    formAction(formData);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outputInput.trim()) return;
    const formData = new FormData();
    formData.append("id", task.id);
    formData.append("status", "completed");
    formData.append("output", outputInput.trim());
    formAction(formData);
    setCompleteDialogOpen(false);
  };

  return (
    <>
      <Card
        className={`group relative flex flex-col justify-between transition-all duration-200 hover:border-accent/40 ${
          isOverdue ? "border-danger/40 bg-danger/5" : "bg-surface-1"
        }`}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <DepartmentBadge department={task.department} />
              <PriorityBadge priority={task.priority} />
            </div>

            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg opacity-80 group-hover:opacity-100">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Task actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit ? (
                    <DropdownMenuItem onClick={() => onEdit(task)}>Edit task details</DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link href={`/tasks/${task.id}`}>View details & history</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <Link href={`/tasks/${task.id}`} className="mt-2 block group-hover:text-accent">
            <h3 className="text-sm font-semibold text-strong leading-snug line-clamp-2">{task.title}</h3>
          </Link>
          {task.description ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          ) : null}
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate" title={`Owner: ${task.owner?.full_name}`}>
              <User className="size-3.5 shrink-0 text-accent" />
              <span className="truncate">{task.owner?.full_name ?? "Unassigned"}</span>
            </div>

            <div
              className={`flex items-center gap-1.5 font-mono text-[11px] ${
                isOverdue ? "font-semibold text-danger" : "text-muted-foreground"
              }`}
            >
              {isOverdue ? <AlertTriangle className="size-3.5 shrink-0 text-danger" /> : <Calendar className="size-3.5 shrink-0" />}
              <span>{formatPlainDate(task.deadline)}</span>
            </div>
          </div>

          {task.output ? (
            <div className="rounded-lg border border-border bg-surface-2/60 p-2 text-xs">
              <span className="font-semibold text-strong">Output: </span>
              {task.output.startsWith("http://") || task.output.startsWith("https://") ? (
                <a
                  href={task.output}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent underline hover:text-accent-light"
                >
                  Link <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">{task.output}</span>
              )}
            </div>
          ) : null}

          {state.status === "error" ? (
            <p className="text-[11px] text-danger">{state.message}</p>
          ) : null}

          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <TaskStatusBadge status={task.status} />

            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={isPending}>
                    Move status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {TASK_STATUSES.map((st) => (
                    <DropdownMenuItem
                      key={st}
                      disabled={st === task.status}
                      onClick={() => handleStatusSelect(st)}
                    >
                      {TASK_STATUS_LABELS[st]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Completion Output Modal */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              A completed task requires an output link or a brief note describing the result.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="task-output" className="text-xs font-medium text-foreground">
                Output (URL link or summary note) *
              </label>
              <Input
                id="task-output"
                placeholder="https://github.com/... or Completed initial draft"
                value={outputInput}
                onChange={(e) => setOutputInput(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={!outputInput.trim() || isPending}>
                Save & Mark Complete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
