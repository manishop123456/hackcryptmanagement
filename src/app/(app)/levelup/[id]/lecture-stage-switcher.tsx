"use client";

import { useTransition } from "react";
import { type LectureStage } from "@/lib/levelup/queries";
import { updateLectureStageAction } from "@/lib/levelup/actions";
import { Loader2 } from "lucide-react";

const STAGES: { value: LectureStage; label: string; step: number }[] = [
  { value: "topic", label: "1. Topic Selection", step: 1 },
  { value: "speaker", label: "2. Speaker Briefing", step: 2 },
  { value: "date", label: "3. Schedule Set", step: 3 },
  { value: "venue", label: "4. Venue Reserved", step: 4 },
  { value: "preparation", label: "5. Active Prep", step: 5 },
  { value: "lecture", label: "6. Lecture Live", step: 6 },
  { value: "review", label: "7. Post Review", step: 7 },
];

interface LectureStageSwitcherProps {
  lectureId: string;
  currentStage: LectureStage;
  canManage: boolean;
}

export function LectureStageSwitcher({
  lectureId,
  currentStage,
  canManage,
}: LectureStageSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const handleStageChange = (newStage: LectureStage) => {
    if (!canManage || newStage === currentStage) return;

    const formData = new FormData();
    formData.append("lectureId", lectureId);
    formData.append("stage", newStage);

    startTransition(async () => {
      await updateLectureStageAction(formData);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-400 uppercase font-bold">Pipeline Stage Progression</span>
        {isPending && <Loader2 className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map((s) => {
          const isActive = s.value === currentStage;

          return (
            <button
              key={s.value}
              type="button"
              disabled={!canManage || isPending}
              onClick={() => handleStageChange(s.value)}
              className={`p-2.5 rounded-xl border text-center text-xs font-mono transition flex flex-col items-center justify-center gap-1 ${
                isActive
                  ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
                  : "bg-[#0C0E13] border-zinc-800 text-zinc-400 hover:border-zinc-700"
              } ${canManage ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-[10px] opacity-75">{s.step}</span>
              <span className="text-[11px] font-bold truncate max-w-full">{s.label.split(". ")[1]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
