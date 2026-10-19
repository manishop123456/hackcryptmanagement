// FILE: src/components/tasks/task-form-dialog.tsx
// Modal dialog for creating and editing tasks with full validation.

"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INITIAL_TASK_STATE } from "@/lib/tasks/constants";
import { createTask, updateTask } from "@/app/(app)/tasks/actions";
import { DEPARTMENTS, DEPARTMENT_LABELS, PRIORITIES, TASK_STATUSES, TASK_STATUS_LABELS, type Department, type Priority, type TaskStatus } from "@/lib/constants";
import { isPlainMember } from "@/lib/permissions";
import type { TaskWithDetails } from "@/lib/tasks/queries";
import type { PhaseRow, ProfileRow } from "@/types/database";

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  currentUser,
  profiles,
  phases,
  defaultDepartment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithDetails | null;
  currentUser: ProfileRow;
  profiles: ProfileRow[];
  phases: PhaseRow[];
  defaultDepartment?: Department;
}) {
  const isEditing = Boolean(task);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task assignment, status, or details."
              : "Every task must have an owner and a deadline."}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <TaskFormBody
            key={task?.id ?? "new"}
            task={task}
            currentUser={currentUser}
            profiles={profiles}
            phases={phases}
            defaultDepartment={defaultDepartment}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskFormBody({
  task,
  currentUser,
  profiles,
  phases,
  defaultDepartment,
  onSuccess,
  onCancel,
}: {
  task?: TaskWithDetails | null;
  currentUser: ProfileRow;
  profiles: ProfileRow[];
  phases: PhaseRow[];
  defaultDepartment?: Department;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(task);

  const [state, formAction, isPending] = useActionState(
    isEditing ? updateTask : createTask,
    INITIAL_TASK_STATE,
  );

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [department, setDepartment] = useState<Department>(
    task?.department ?? defaultDepartment ?? currentUser.department ?? "creatives",
  );
  const [ownerId, setOwnerId] = useState<string>(task?.owner_id ?? currentUser.id);
  const [deadline, setDeadline] = useState<string>(() =>
    task?.deadline
      ? new Date(task.deadline).toISOString().slice(0, 16)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "not_started");
  const [output, setOutput] = useState<string>(task?.output ?? "");
  const [remarks, setRemarks] = useState<string>(task?.remarks ?? "");
  const [phaseId, setPhaseId] = useState<string>(task?.phase_id ?? "none");

  useEffect(() => {
    if (state.status === "success") {
      onSuccess();
    }
  }, [state, onSuccess]);

  const isMemberOnly = isPlainMember(currentUser.role) && isEditing;

  return (
    <form action={formAction} className="space-y-4">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Design HackCrypt 2027 Poster"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isMemberOnly || isPending}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add task requirements or context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isMemberOnly || isPending}
          className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>

      {/* Department & Priority */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="department">Department *</Label>
          <Select
            value={department}
            onValueChange={(val) => setDepartment(val as Department)}
            disabled={isMemberOnly || isPending}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {DEPARTMENT_LABELS[dept]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="department" value={department} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={priority}
            onValueChange={(val) => setPriority(val as Priority)}
            disabled={isMemberOnly || isPending}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} Priority
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="priority" value={priority} />
        </div>
      </div>

      {/* Owner & Deadline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="owner_id">Owner / Assignee *</Label>
          <Select
            value={ownerId}
            onValueChange={(val) => setOwnerId(val)}
            disabled={isMemberOnly || isPending}
          >
            <SelectTrigger id="owner_id">
              <SelectValue placeholder="Select Assignee" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="owner_id" value={ownerId} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline *</Label>
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isMemberOnly || isPending}
            required
          />
        </div>
      </div>

      {/* Phase & Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phase_id">Planning Phase</Label>
          <Select
            value={phaseId}
            onValueChange={(val) => setPhaseId(val)}
            disabled={isMemberOnly || isPending}
          >
            <SelectTrigger id="phase_id">
              <SelectValue placeholder="Select Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific phase</SelectItem>
              {phases.map((ph) => (
                <SelectItem key={ph.id} value={ph.id}>
                  {ph.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="phase_id" value={phaseId} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Task Status *</Label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as TaskStatus)}
            disabled={isPending}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {TASK_STATUS_LABELS[st]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="status" value={status} />
        </div>
      </div>

      {/* Output (Mandatory if Completed) */}
      <div className="space-y-1.5">
        <Label htmlFor="output">
          Output Link or Summary {status === "completed" ? "*" : "(Optional)"}
        </Label>
        <Input
          id="output"
          name="output"
          placeholder="e.g. https://figma.com/... or Completed initial poster layout"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          disabled={isPending}
          required={status === "completed"}
        />
        {status === "completed" ? (
          <p className="text-[11px] text-muted-foreground">
            Output (link or note) is required when task status is set to Completed.
          </p>
        ) : null}
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks">Remarks / Notes</Label>
        <textarea
          id="remarks"
          name="remarks"
          rows={2}
          placeholder="Any additional notes..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={isPending}
          className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
        </Button>
      </DialogFooter>
    </form>
  );
}
