"use client";

import { useState, useTransition } from "react";
import { type ChecklistItem } from "@/lib/levelup/queries";
import { updateLectureChecklistAction } from "@/lib/levelup/actions";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface LectureChecklistEditorProps {
  lectureId: string;
  initialChecklist: ChecklistItem[];
  canManage: boolean;
}

export function LectureChecklistEditor({
  lectureId,
  initialChecklist,
  canManage,
}: LectureChecklistEditorProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleItem = (key: string) => {
    if (!canManage) return;

    const nextChecklist = checklist.map((item) =>
      item.key === key ? { ...item, completed: !item.completed } : item
    );

    setChecklist(nextChecklist);
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await updateLectureChecklistAction(lectureId, nextChecklist);
      } catch (err: unknown) {
        setChecklist(checklist); // revert on failure
        setErrorMsg(err instanceof Error ? err.message : "Failed to update checklist");
      }
    });
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header & Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 uppercase font-bold">Preparation Checklist</span>
          {isPending && <Loader2 className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" />}
        </div>
        <span className="text-xs font-mono font-bold text-[#00E5FF]">
          {completedCount} / {totalCount} Completed ({percent}%)
        </span>
      </div>

      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#00E5FF] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Checklist items list */}
      <div className="space-y-2 pt-2">
        {checklist.map((item) => {
          return (
            <button
              key={item.key}
              type="button"
              disabled={!canManage || isPending}
              onClick={() => toggleItem(item.key)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition ${
                item.completed
                  ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200"
                  : "bg-[#0C0E13] border-zinc-800 text-zinc-400 hover:border-zinc-700"
              } ${canManage ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600" />
                )}
              </div>
              <span
                className={`text-xs leading-relaxed ${
                  item.completed ? "line-through text-zinc-400 font-mono" : "text-zinc-200"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
