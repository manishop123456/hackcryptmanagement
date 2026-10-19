// FILE: src/components/tasks/task-filters.tsx
// Filter bar for the Tasks view.

"use client";

import { LayoutGrid, List, Search, UserCheck, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS, DEPARTMENT_LABELS, PRIORITIES, TASK_STATUSES, TASK_STATUS_LABELS, type Department, type Priority, type TaskStatus } from "@/lib/constants";
import type { PhaseRow, ProfileRow } from "@/types/database";

export type FilterState = {
  search: string;
  department: Department | "all";
  status: TaskStatus | "all";
  priority: Priority | "all";
  owner_id: string | "all";
  phase_id: string | "all";
  my_tasks_only: boolean;
  overdue_only: boolean;
  view_mode: "kanban" | "list";
};

export function TaskFilters({
  filters,
  onChange,
  profiles,
  phases,
  currentUserId,
}: {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  profiles: ProfileRow[];
  phases: PhaseRow[];
  currentUserId: string;
}) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface-1 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* View Mode & Preset Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filters.my_tasks_only ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => {
              if (filters.my_tasks_only) {
                updateFilter("my_tasks_only", false);
              } else {
                onChange({ ...filters, my_tasks_only: true, owner_id: currentUserId });
              }
            }}
          >
            <UserCheck className="size-3.5" />
            My Tasks
          </Button>

          <Button
            variant={filters.overdue_only ? "destructive" : "outline"}
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => updateFilter("overdue_only", !filters.overdue_only)}
          >
            <AlertTriangle className="size-3.5" />
            Overdue
          </Button>

          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-0.5">
            <Button
              variant={filters.view_mode === "kanban" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => updateFilter("view_mode", "kanban")}
              title="Kanban Board"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={filters.view_mode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => updateFilter("view_mode", "list")}
              title="List View"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Select Filter Dropdowns */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Department Filter */}
        <Select
          value={filters.department}
          onValueChange={(val) => updateFilter("department", val as Department | "all")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {DEPARTMENT_LABELS[dept]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(val) => updateFilter("status", val as TaskStatus | "all")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TASK_STATUSES.map((st) => (
              <SelectItem key={st} value={st}>
                {TASK_STATUS_LABELS[st]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority}
          onValueChange={(val) => updateFilter("priority", val as Priority | "all")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)} Priority
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select
          value={filters.owner_id}
          onValueChange={(val) => {
            updateFilter("owner_id", val);
            if (val !== currentUserId && filters.my_tasks_only) {
              updateFilter("my_tasks_only", false);
            }
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phase Filter */}
        <Select
          value={filters.phase_id}
          onValueChange={(val) => updateFilter("phase_id", val)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {phases.map((ph) => (
              <SelectItem key={ph.id} value={ph.id}>
                {ph.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
