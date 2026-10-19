// FILE: src/components/tasks/task-history-view.tsx
// Component displaying audit history trail for a task.

"use client";

import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskHistoryWithActor } from "@/lib/tasks/queries";
import { formatPlainDate } from "@/lib/utils";

export function TaskHistoryView({ history }: { history: TaskHistoryWithActor[] }) {
  return (
    <Card className="bg-surface-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-accent" />
          Task History ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No history records yet.</p>
        ) : (
          <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {history.map((item) => {
              const actorName = item.actor?.full_name ?? "System";
              return (
                <div key={item.id} className="relative text-xs space-y-0.5">
                  <span aria-hidden="true" className="absolute -left-[19px] top-1 size-2.5 rounded-full bg-accent ring-4 ring-surface-1" />
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-strong">{actorName}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatPlainDate(item.created_at)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Changed <span className="font-mono font-medium text-foreground">{item.field}</span>
                    {item.old_value ? (
                      <>
                        {" "}from <span className="text-foreground">{formatValue(item.field, item.old_value)}</span>
                      </>
                    ) : null}
                    {" "}to <span className="font-medium text-accent">{formatValue(item.field, item.new_value)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatValue(field: string, val: string | null): string {
  if (!val) return "none";
  if (field === "deadline" && !isNaN(Date.parse(val))) {
    return formatPlainDate(val);
  }
  return val;
}
