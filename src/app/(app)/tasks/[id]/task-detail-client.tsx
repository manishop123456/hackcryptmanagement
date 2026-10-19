// FILE: src/app/(app)/tasks/[id]/task-detail-client.tsx
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Calendar, Edit3, ExternalLink, Trash2, User, UserCheck } from "lucide-react";

import { DepartmentBadge, PriorityBadge, RoleBadge, TaskStatusBadge } from "@/components/status-badge";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskHistoryView } from "@/components/tasks/task-history-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INITIAL_TASK_STATE } from "@/lib/tasks/constants";
import { deleteTask } from "@/app/(app)/tasks/actions";
import type { TaskCommentWithAuthor, TaskHistoryWithActor, TaskWithDetails } from "@/lib/tasks/queries";
import { formatPlainDate, isDatePast } from "@/lib/utils";
import type { PhaseRow, ProfileRow } from "@/types/database";

export function TaskDetailClient({
  task,
  comments,
  history,
  currentUser,
  profiles,
  phases,
}: {
  task: TaskWithDetails;
  comments: TaskCommentWithAuthor[];
  history: TaskHistoryWithActor[];
  currentUser: ProfileRow;
  profiles: ProfileRow[];
  phases: PhaseRow[];
}) {
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTask, INITIAL_TASK_STATE);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOverdue = task.status !== "completed" && isDatePast(task.deadline);
  const canEdit =
    currentUser.role === "president" ||
    currentUser.role === "vice_president" ||
    currentUser.role === "management_head" ||
    currentUser.role === "development_head" ||
    (currentUser.role === "hackathon_head" && task.department === "hackathon") ||
    (currentUser.role === "team_lead" && currentUser.department === task.department) ||
    currentUser.id === task.owner_id;

  const canDelete =
    currentUser.role === "president" ||
    currentUser.role === "vice_president" ||
    currentUser.role === "management_head" ||
    currentUser.role === "development_head" ||
    (currentUser.role === "hackathon_head" && task.department === "hackathon") ||
    (currentUser.role === "team_lead" && currentUser.department === task.department);

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    deleteAction(formData);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/tasks">
            <ArrowLeft className="size-4" />
            Back to Tasks
          </Link>
        </Button>
      </div>

      {deleteState.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{deleteState.message}</AlertDescription>
        </Alert>
      ) : null}

      {/* Main Task Header Card */}
      <Card className="bg-surface-1">
        <CardHeader className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <DepartmentBadge department={task.department} />
              <PriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              {task.phase ? (
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  Phase: {task.phase.name}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {canEdit ? (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditDialogOpen(true)}>
                  <Edit3 className="size-3.5" />
                  Edit Task
                </Button>
              ) : null}

              {canDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Delete Task
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-strong sm:text-2xl">{task.title}</h1>
            {task.description ? (
              <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface-2/60 p-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Task Owner / Assignee</span>
              <div className="flex items-center gap-1.5 font-medium text-strong">
                <User className="size-3.5 text-accent" />
                {task.owner?.full_name ?? "Unassigned"}
                {task.owner?.role ? <RoleBadge role={task.owner.role} /> : null}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">Assigned By</span>
              <div className="flex items-center gap-1.5 text-foreground">
                <UserCheck className="size-3.5 text-muted-foreground" />
                {task.assigned_by_profile?.full_name ?? "System / Core"}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">Deadline</span>
              <div
                className={`flex items-center gap-1.5 font-mono font-medium ${
                  isOverdue ? "text-danger" : "text-strong"
                }`}
              >
                {isOverdue ? <AlertTriangle className="size-3.5 text-danger" /> : <Calendar className="size-3.5 text-accent" />}
                {formatPlainDate(task.deadline)}
                {isOverdue ? " (Overdue)" : ""}
              </div>
            </div>
          </div>

          {/* Output & Remarks */}
          {task.output || task.remarks ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              {task.output ? (
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <span className="font-semibold text-strong block mb-1">Deliverable / Output</span>
                  {task.output.startsWith("http://") || task.output.startsWith("https://") ? (
                    <a
                      href={task.output}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-accent underline hover:text-accent-light break-all"
                    >
                      {task.output} <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-foreground">{task.output}</span>
                  )}
                </div>
              ) : null}

              {task.remarks ? (
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <span className="font-semibold text-strong block mb-1">Remarks / Notes</span>
                  <p className="text-muted-foreground whitespace-pre-wrap">{task.remarks}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Grid: Comments & History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskComments taskId={task.id} comments={comments} currentUser={currentUser} />
        <TaskHistoryView history={history} />
      </div>

      {/* Form Dialog for Edit */}
      <TaskFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        currentUser={currentUser}
        profiles={profiles}
        phases={phases}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete task &quot;{task.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteSubmit}>
            <input type="hidden" name="id" value={task.id} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isDeletePending}>
                {isDeletePending ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
