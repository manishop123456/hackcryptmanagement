// FILE: src/lib/levelup/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth";
import { canManageTasks } from "@/lib/permissions";
import { writeAudit } from "@/lib/audit";
import { DEFAULT_CHECKLIST, type ChecklistItem, type LectureStage } from "@/lib/levelup/queries";

const createLectureSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  speaker: z.string().min(1, "Speaker is required"),
  starts_at: z.string().min(1, "Start date/time is required"),
  venue: z.string().min(1, "Venue is required"),
  stage: z.enum(["topic", "speaker", "date", "venue", "preparation", "lecture", "review"]),
  feedback_url: z.string().optional(),
  notes: z.string().optional(),
  create_session: z.enum(["true", "false"]).optional(),
});

export async function createLectureAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Only team leads and management heads can create lectures.");
  }

  const parsed = createLectureSchema.safeParse({
    topic: formData.get("topic"),
    speaker: formData.get("speaker"),
    starts_at: formData.get("starts_at"),
    venue: formData.get("venue"),
    stage: formData.get("stage") || "topic",
    feedback_url: formData.get("feedback_url") || undefined,
    notes: formData.get("notes") || undefined,
    create_session: formData.get("create_session") || "false",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input for lecture creation");
  }

  const { topic, speaker, starts_at, venue, stage, feedback_url, notes, create_session } = parsed.data;
  const supabase = await createClient();

  let sessionId: string | null = null;

  if (create_session === "true") {
    // Calculate 2-hour session window by default
    const startTime = new Date(starts_at);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    const { data: sessionData, error: sessionErr } = await supabase
      .from("attendance_sessions")
      .insert({
        title: `Level Up: ${topic}`,
        type: "level_up",
        department: null, // all departments
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        grace_minutes: 15,
        venue_name: venue,
        radius_m: 100,
        require_code: true,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (sessionErr) {
      console.error("[levelup] Error creating linked attendance session:", sessionErr.message);
    } else if (sessionData) {
      sessionId = sessionData.id;
    }
  }

  const { data: lecture, error } = await supabase
    .from("lectures")
    .insert({
      topic,
      speaker,
      starts_at: new Date(starts_at).toISOString(),
      venue,
      stage: stage as LectureStage,
      checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
      feedback_url: feedback_url || null,
      notes: notes || null,
      session_id: sessionId,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !lecture) {
    throw new Error(error?.message || "Failed to create lecture");
  }

  await writeAudit(supabase, {
    action: "create_lecture",
    entity: "lecture",
    entityId: lecture.id,
    after: { topic, speaker, venue, stage, session_id: sessionId },
  });

  revalidatePath("/levelup");
  redirect(`/levelup/${lecture.id}`);
}

export async function updateLectureStageAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to update lecture stage.");
  }

  const lectureId = formData.get("lectureId")?.toString();
  const nextStage = formData.get("stage")?.toString() as LectureStage;

  if (!lectureId || !nextStage) {
    throw new Error("Missing lecture ID or target stage");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("lectures").select("stage").eq("id", lectureId).single();

  const { error } = await supabase
    .from("lectures")
    .update({
      stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lectureId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "update_lecture_stage",
    entity: "lecture",
    entityId: lectureId,
    before: { stage: existing?.stage },
    after: { stage: nextStage },
  });

  revalidatePath("/levelup");
  revalidatePath(`/levelup/${lectureId}`);
}

export async function updateLectureChecklistAction(lectureId: string, checklist: ChecklistItem[]) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to update checklist.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lectures")
    .update({
      checklist: JSON.parse(JSON.stringify(checklist)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", lectureId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "update_lecture_checklist",
    entity: "lecture",
    entityId: lectureId,
    after: { checklist_count: checklist.length, completed_count: checklist.filter((c) => c.completed).length },
  });

  revalidatePath(`/levelup/${lectureId}`);
}

export async function deleteLectureAction(formData: FormData) {
  const profile = await requireActiveProfile();
  if (!canManageTasks(profile.role)) {
    throw new Error("Not authorized to delete lecture.");
  }

  const lectureId = formData.get("lectureId")?.toString();
  if (!lectureId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("lectures").delete().eq("id", lectureId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAudit(supabase, {
    action: "delete_lecture",
    entity: "lecture",
    entityId: lectureId,
  });

  revalidatePath("/levelup");
  redirect("/levelup");
}
