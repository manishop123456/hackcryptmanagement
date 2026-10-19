// FILE: src/app/(app)/daily-reports/new/report-form-client.tsx
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Plus, Trash2, CheckCircle2, FileText, ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INITIAL_REPORT_STATE } from "@/lib/daily-reports/constants";
import { saveOrSubmitDailyReport } from "@/lib/daily-reports/actions";
import type { DailyReportWithProfile } from "@/lib/daily-reports/queries";
import type { TaskWithDetails } from "@/lib/tasks/queries";
import type { WorkEntryItem } from "@/types/database";

export function DailyReportFormClient({
  targetDate,
  existingReport,
  userTasks,
}: {
  targetDate: string;
  existingReport: DailyReportWithProfile | null;
  userTasks: TaskWithDetails[];
}) {
  const [state, formAction, isPending] = useActionState(saveOrSubmitDailyReport, INITIAL_REPORT_STATE);

  const [summary, setSummary] = useState(existingReport?.summary ?? "");
  const [otherWork, setOtherWork] = useState(existingReport?.other_work ?? "");
  const [proofLinksRaw, setProofLinksRaw] = useState(existingReport?.proof_links?.join("\n") ?? "");
  const [blockers, setBlockers] = useState(existingReport?.blockers ?? "");
  const [nextPriorities, setNextPriorities] = useState(existingReport?.next_priorities ?? "");
  const [optionalNotes, setOptionalNotes] = useState(existingReport?.optional_notes ?? "");
  const [isExcused, setIsExcused] = useState(existingReport?.is_excused ?? false);
  const [excusedReason, setExcusedReason] = useState(existingReport?.excused_reason ?? "");

  const [workEntries, setWorkEntries] = useState<WorkEntryItem[]>(
    existingReport?.work_entries ?? [
      {
        category: "task_work",
        description: "",
        duration_minutes: 60,
      },
    ]
  );

  const addWorkEntry = () => {
    setWorkEntries([
      ...workEntries,
      {
        category: "task_work",
        description: "",
        duration_minutes: 60,
      },
    ]);
  };

  const removeWorkEntry = (index: number) => {
    setWorkEntries(workEntries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, fields: Partial<WorkEntryItem>) => {
    const updated = [...workEntries];
    updated[index] = { ...updated[index], ...fields };
    setWorkEntries(updated);
  };

  const totalTimeMinutes = isExcused
    ? 0
    : workEntries.reduce((acc, curr) => acc + (Number(curr.duration_minutes) || 0), 0);

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link href="/daily-reports">
              <ArrowLeft className="size-4" /> Back to reports
            </Link>
          </Button>

          <span className="font-mono text-xs font-semibold text-accent">
            Date: {targetDate}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="report_date" value={targetDate} />
          <input type="hidden" name="work_entries_json" value={JSON.stringify(workEntries)} />
          <input type="hidden" name="is_excused" value={isExcused ? "true" : "false"} />

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error Saving Report</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          {state.status === "success" ? (
            <Alert variant="default" className="border-success/50 bg-success/10 text-success">
              <CheckCircle2 className="size-4 text-success" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          {/* Excused Leave Checkbox */}
          <div className="rounded-xl border border-border bg-surface-2/40 p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_excused"
                checked={isExcused}
                onChange={(e) => setIsExcused(e.target.checked)}
                className="size-4 rounded border-border accent-accent cursor-pointer"
              />
              <Label htmlFor="is_excused" className="font-semibold text-strong cursor-pointer">
                Mark as Excused Leave / Authorized No-Work Day
              </Label>
            </div>

            {isExcused ? (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="excused_reason">Reason for Excused Leave *</Label>
                <Input
                  id="excused_reason"
                  name="excused_reason"
                  placeholder="e.g. College exams, sick leave, authorized personal work"
                  value={excusedReason}
                  onChange={(e) => setExcusedReason(e.target.value)}
                  required={isExcused}
                />
              </div>
            ) : null}
          </div>

          {!isExcused ? (
            <>
              {/* Daily Summary */}
              <div className="space-y-1.5">
                <Label htmlFor="summary">Daily Work Summary *</Label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  placeholder="High-level overview of what you accomplished today..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Work Breakdown Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-strong">Work Entries & Time Log</h3>
                    <p className="text-xs text-muted-foreground">
                      Total logged time: <span className="font-mono font-bold text-accent">{Math.floor(totalTimeMinutes / 60)}h {totalTimeMinutes % 60}m</span>
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addWorkEntry} className="gap-1.5 text-xs">
                    <Plus className="size-3.5" /> Add Activity
                  </Button>
                </div>

                <div className="space-y-3">
                  {workEntries.map((entry, idx) => (
                    <div key={idx} className="rounded-xl border border-border/80 bg-surface-1 p-4 space-y-3 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Item #{idx + 1}</span>
                        {workEntries.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-danger hover:bg-danger/10"
                            onClick={() => removeWorkEntry(idx)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={entry.category}
                            onValueChange={(val) => updateEntry(idx, { category: val as WorkEntryItem["category"] })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="task_work">Assigned Task Work</SelectItem>
                              <SelectItem value="meeting">Meeting / Discussion</SelectItem>
                              <SelectItem value="cross_team_help">Cross-Team Collaboration</SelectItem>
                              <SelectItem value="event_prep">Event / Lecture Prep</SelectItem>
                              <SelectItem value="other">Other Activity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Duration (mins)</Label>
                          <Input
                            type="number"
                            min={5}
                            step={5}
                            value={entry.duration_minutes}
                            onChange={(e) => updateEntry(idx, { duration_minutes: Number(e.target.value) })}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {entry.category === "task_work" && userTasks.length > 0 ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Linked Task (Optional)</Label>
                          <Select
                            value={entry.task_id || "none"}
                            onValueChange={(val) => {
                              const selectedTask = userTasks.find((t) => t.id === val);
                              updateEntry(idx, {
                                task_id: val === "none" ? null : val,
                                task_title: selectedTask ? selectedTask.title : null,
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Link to assigned task" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned / General Activity</SelectItem>
                              {userTasks.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.title} ({t.status})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        <Label className="text-xs">Description of Work *</Label>
                        <Input
                          placeholder="Specific work completed..."
                          value={entry.description}
                          onChange={(e) => updateEntry(idx, { description: e.target.value })}
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proof Links */}
              <div className="space-y-1.5">
                <Label htmlFor="proof_links_raw">Deliverable Proof Links (One URL per line)</Label>
                <textarea
                  id="proof_links_raw"
                  name="proof_links_raw"
                  rows={2}
                  placeholder="https://github.com/...\nhttps://figma.com/..."
                  value={proofLinksRaw}
                  onChange={(e) => setProofLinksRaw(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Blockers & Next Priorities */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="blockers">Blockers / Dependencies</Label>
                  <textarea
                    id="blockers"
                    name="blockers"
                    rows={2}
                    placeholder="Anything holding you back?"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="next_priorities">Next Tomorrow Priorities</Label>
                  <textarea
                    id="next_priorities"
                    name="next_priorities"
                    rows={2}
                    placeholder="Top goals for tomorrow..."
                    value={nextPriorities}
                    onChange={(e) => setNextPriorities(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </>
          ) : null}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="submit"
              name="is_draft"
              value="true"
              variant="outline"
              disabled={isPending}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              name="is_draft"
              value="false"
              variant="default"
              disabled={isPending}
            >
              <FileText className="size-4 mr-1.5" />
              {isPending ? "Submitting..." : "Submit Final Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
