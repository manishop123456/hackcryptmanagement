// FILE: src/app/(app)/tasks/tasks-client.tsx
// Interactive client wrapper for the tasks page handling filters, view mode, and dialogs.

"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskCard } from "@/components/tasks/task-card";
import { FilterState, TaskFilters } from "@/components/tasks/task-filters";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Button } from "@/components/ui/button";
import type { TaskWithDetails } from "@/lib/tasks/queries";
import { isDatePast } from "@/lib/utils";
import type { PhaseRow, ProfileRow } from "@/types/database";

export function TasksClient({
  initialTasks,
  currentUser,
  profiles,
  phases,
}: {
  initialTasks: TaskWithDetails[];
  currentUser: ProfileRow;
  profiles: ProfileRow[];
  phases: PhaseRow[];
}) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "all",
    status: "all",
    priority: "all",
    owner_id: "all",
    phase_id: "all",
    my_tasks_only: false,
    overdue_only: false,
    view_mode: "kanban",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  const canCreate =
    currentUser.role === "president" ||
    currentUser.role === "vice_president" ||
    currentUser.role === "management_head" ||
    currentUser.role === "development_head" ||
    currentUser.role === "hackathon_head" ||
    currentUser.role === "team_lead";

  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      if (filters.my_tasks_only && task.owner_id !== currentUser.id) {
        return false;
      }
      if (filters.overdue_only && (task.status === "completed" || !isDatePast(task.deadline))) {
        return false;
      }
      if (filters.department !== "all" && task.department !== filters.department) {
        return false;
      }
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }
      if (filters.priority !== "all" && task.priority !== filters.priority) {
        return false;
      }
      if (filters.owner_id !== "all" && task.owner_id !== filters.owner_id) {
        return false;
      }
      if (filters.phase_id !== "all" && task.phase_id !== filters.phase_id) {
        return false;
      }
      if (filters.search.trim().length > 0) {
        const term = filters.search.toLowerCase().trim();
        const inTitle = task.title.toLowerCase().includes(term);
        const inDesc = task.description ? task.description.toLowerCase().includes(term) : false;
        const inOwner = task.owner?.full_name ? task.owner.full_name.toLowerCase().includes(term) : false;
        if (!inTitle && !inDesc && !inOwner) return false;
      }
      return true;
    });
  }, [initialTasks, filters, currentUser.id]);

  const handleEdit = (task: TaskWithDetails) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header controls & filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-strong sm:text-2xl">Tasks Module</h1>
          <p className="text-xs text-muted-foreground">
            Assign, track, and manage responsibilities across DevClub TRCAC departments.
          </p>
        </div>

        {canCreate ? (
          <Button variant="default" size="sm" className="gap-1.5" onClick={handleCreate}>
            <Plus className="size-4" />
            Create Task
          </Button>
        ) : null}
      </div>

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        profiles={profiles}
        phases={phases}
        currentUserId={currentUser.id}
      />

      {/* Main task display */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-1 p-12 text-center">
          <p className="text-sm font-medium text-strong">No tasks found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search filters or create a new task.
          </p>
          {canCreate ? (
            <Button variant="default" size="sm" className="mt-4 gap-1.5" onClick={handleCreate}>
              <Plus className="size-4" />
              Create Task
            </Button>
          ) : null}
        </div>
      ) : filters.view_mode === "kanban" ? (
        <KanbanBoard tasks={filteredTasks} currentUser={currentUser} onEdit={handleEdit} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} currentUser={currentUser} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        currentUser={currentUser}
        profiles={profiles}
        phases={phases}
      />
    </div>
  );
}
