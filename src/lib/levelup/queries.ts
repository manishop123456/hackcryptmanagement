// FILE: src/lib/levelup/queries.ts
import { createClient } from "@/lib/supabase/server";

export type LectureStage = "topic" | "speaker" | "date" | "venue" | "preparation" | "lecture" | "review";

export interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { key: "topic_confirmed", label: "Topic & curriculum outline finalized", completed: false },
  { key: "speaker_confirmed", label: "Speaker invited and confirmed", completed: false },
  { key: "venue_booked", label: "Venue reserved & seating arranged", completed: false },
  { key: "equipment_ready", label: "Projector, microphones & slides tested", completed: false },
  { key: "schedule_published", label: "Schedule & reminder sent to members", completed: false },
  { key: "attire_verified", label: "Speaker & organizers formal attire verified", completed: false },
  { key: "feedback_collected", label: "Feedback form & lecture notes published", completed: false },
];

export interface LectureRow {
  id: string;
  topic: string;
  speaker: string;
  starts_at: string;
  venue: string;
  stage: LectureStage;
  checklist: ChecklistItem[];
  feedback_url: string | null;
  notes: string | null;
  session_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: { full_name: string | null; email: string | null } | null;
  session?: {
    id: string;
    title: string;
    starts_at: string;
    closed_at: string | null;
  } | null;
  attendance_stats?: {
    total: number;
    present: number;
    late: number;
    excused: number;
    absent: number;
  } | null;
}

export async function getLectures(): Promise<LectureRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lectures")
    .select(`
      *,
      creator:profiles!lectures_created_by_fkey(full_name, email),
      session:attendance_sessions!lectures_session_id_fkey(id, title, starts_at, closed_at)
    `)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[levelup] error fetching lectures:", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    ...row,
    checklist: Array.isArray(row.checklist) ? (row.checklist as unknown as ChecklistItem[]) : DEFAULT_CHECKLIST,
  })) as LectureRow[];
}

export async function getLectureById(id: string): Promise<LectureRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lectures")
    .select(`
      *,
      creator:profiles!lectures_created_by_fkey(full_name, email),
      session:attendance_sessions!lectures_session_id_fkey(id, title, starts_at, closed_at)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  let attendance_stats = null;
  if (data.session_id) {
    const { data: records } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("session_id", data.session_id);

    if (records) {
      attendance_stats = {
        total: records.length,
        present: records.filter((r) => r.status === "present").length,
        late: records.filter((r) => r.status === "late").length,
        excused: records.filter((r) => r.status === "excused").length,
        absent: records.filter((r) => r.status === "absent").length,
      };
    }
  }

  return {
    ...data,
    checklist: Array.isArray(data.checklist) ? (data.checklist as unknown as ChecklistItem[]) : DEFAULT_CHECKLIST,
    attendance_stats,
  } as LectureRow;
}
