import { createClient } from "@/lib/supabase/server";

export interface AttendanceSession {
  id: string;
  title: string;
  type: "meeting" | "level_up" | "event_day" | "work_session";
  department: string | null;
  starts_at: string;
  ends_at: string;
  grace_minutes: number;
  venue_name: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  radius_m: number;
  require_code: boolean;
  created_by: string;
  created_at: string;
  closed_at: string | null;
}

export interface AttendanceRecordWithProfile {
  id: string;
  session_id: string;
  member_id: string;
  status: "present" | "late" | "excused" | "absent";
  checked_in_at: string | null;
  accuracy_m: number | null;
  distance_m: number | null;
  method: "self" | "manual";
  marked_by: string | null;
  remark: string | null;
  flags: Array<"outside_area" | "no_location" | "low_accuracy">;
  review: "not_needed" | "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  member?: {
    full_name: string;
    email: string;
    department: string | null;
  };
}

/**
 * Fetch attendance sessions accessible to current user.
 */
export async function getAttendanceSessions(): Promise<AttendanceSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("Error fetching attendance sessions:", error);
    return [];
  }

  return (data as AttendanceSession[]) || [];
}

/**
 * Fetch a single session by ID.
 */
export async function getAttendanceSessionById(id: string): Promise<AttendanceSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as AttendanceSession;
}

/**
 * Fetch member's own check-in record for a specific session.
 */
export async function getMySessionRecord(
  sessionId: string,
  memberId: string
): Promise<AttendanceRecordWithProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("session_id", sessionId)
    .eq("member_id", memberId)
    .maybeSingle();

  return (data as AttendanceRecordWithProfile) || null;
}

/**
 * Fetch all attendance records for a session (respecting RLS scope).
 */
export async function getAttendanceRecordsForSession(
  sessionId: string
): Promise<AttendanceRecordWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      member:profiles!attendance_records_member_id_fkey(full_name, email, department)
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching session attendance records:", error);
    return [];
  }

  return (data as unknown as AttendanceRecordWithProfile[]) || [];
}

/**
 * Fetch coordinates securely via RPC checkin_coordinates(p_session_id).
 * Enforces coordinate viewing permissions inside the database.
 */
export async function getSessionCoordinates(sessionId: string): Promise<
  Array<{ checked_in_member_id: string; latitude: number; longitude: number }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkin_coordinates", {
    p_session_id: sessionId,
  });

  if (error) {
    console.error("Error fetching session coordinates:", error);
    return [];
  }

  if (!data) return [];
  return data.filter(
    (row): row is { checked_in_member_id: string; latitude: number; longitude: number } =>
      row.latitude !== null && row.longitude !== null
  );
}

/**
 * Compute member attendance statistics.
 * Formula: attendance % = (present + late + excused) / total_expected_sessions * 100
 */
export async function getMemberAttendanceStats(memberId: string) {
  const supabase = await createClient();

  const { data: records } = await supabase
    .from("attendance_records")
    .select("status, review, flags")
    .eq("member_id", memberId);

  const list = records || [];
  const total = list.length;
  const present = list.filter((r) => r.status === "present").length;
  const late = list.filter((r) => r.status === "late").length;
  const excused = list.filter((r) => r.status === "excused").length;
  const absent = list.filter((r) => r.status === "absent").length;
  const pendingReview = list.filter((r) => r.review === "pending").length;

  const attendedCount = present + late + excused;
  const percentage = total > 0 ? Math.round((attendedCount / total) * 100) : 100;

  return {
    total,
    present,
    late,
    excused,
    absent,
    pendingReview,
    percentage,
  };
}
