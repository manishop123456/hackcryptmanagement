"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkInSchema,
  createSessionSchema,
  manualOverrideSchema,
  reviewFlagSchema,
  CheckInInput,
  CreateSessionInput,
  ManualOverrideInput,
  ReviewFlagInput,
} from "./validation";
import { evaluateCheckIn } from "./evaluator";
import { getCurrentCode } from "./live-code";

/**
 * Member Self Check-In Server Action.
 * Client sends only { session_id, lat?, lng?, accuracy_m?, code? }.
 * Evaluates full location/time/code/flag algorithm server-side.
 */
export async function checkInMemberAction(rawInput: CheckInInput) {
  // 1. Zod validation (strict schema rejects extra fields)
  const parseResult = checkInSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || "Invalid check-in data" };
  }
  const input = parseResult.data;

  // 2. Authenticate User
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, department, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    return { success: false, error: "Active user profile required for check-in" };
  }

  // 3. Fetch Session
  const { data: session } = await supabase
    .from("attendance_sessions")
    .select(
      "id, title, type, department, starts_at, ends_at, grace_minutes, venue_lat, venue_lng, radius_m, require_code, closed_at"
    )
    .eq("id", input.session_id)
    .single();

  if (!session) {
    return { success: false, error: "Attendance session not found" };
  }

  if (session.closed_at) {
    return { success: false, error: "Session has been closed by team lead" };
  }

  // 4. Duplicate Check (Do not overwrite existing check-in)
  const { data: existingRecord } = await supabase
    .from("attendance_records")
    .select("id, status, flags, review, checked_in_at")
    .eq("session_id", session.id)
    .eq("member_id", profile.id)
    .maybeSingle();

  if (existingRecord) {
    return {
      success: true,
      duplicate: true,
      status: existingRecord.status,
      flags: existingRecord.flags,
      review: existingRecord.review,
      message: "You have already checked in for this session.",
    };
  }

  // 5. Fetch Session Secret (Service Role Only)
  let secret: string | null = null;
  if (session.require_code) {
    const adminSupabase = createAdminClient();
    const { data: secretRow } = await adminSupabase
      .from("attendance_session_secrets")
      .select("secret")
      .eq("session_id", session.id)
      .single();

    if (!secretRow) {
      return { success: false, error: "Session security secret unavailable" };
    }
    secret = secretRow.secret;
  }

  // 6. Evaluate Algorithm
  const evaluation = evaluateCheckIn({
    session,
    user: profile,
    lat: input.lat,
    lng: input.lng,
    accuracy_m: input.accuracy_m,
    code: input.code,
    secret,
  });

  if (!evaluation.success) {
    return { success: false, error: evaluation.error };
  }

  // 7. Save Record using Admin Client (No client INSERT policy by security design)
  const adminSupabase = createAdminClient();
  const { data: newRecord, error: insertError } = await adminSupabase
    .from("attendance_records")
    .insert({
      session_id: session.id,
      member_id: profile.id,
      status: evaluation.status,
      checked_in_at: new Date().toISOString(),
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      accuracy_m: input.accuracy_m ?? null,
      distance_m: evaluation.distance_m ?? null,
      method: "self",
      flags: evaluation.flags,
      review: evaluation.review,
    })
    .select("id, status, flags, review")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Unique constraint race condition
      return {
        success: true,
        duplicate: true,
        message: "You have already checked in for this session.",
      };
    }
    return { success: false, error: "Failed to save attendance record: " + insertError.message };
  }

  revalidatePath(`/attendance/${session.id}`);
  revalidatePath("/attendance");

  return {
    success: true,
    duplicate: false,
    status: newRecord.status,
    flags: newRecord.flags,
    review: newRecord.review,
    message: evaluation.message,
  };
}

/**
 * Create Session Server Action (Leads / Core).
 */
export async function createAttendanceSessionAction(rawInput: CreateSessionInput) {
  const parseResult = createSessionSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || "Invalid session data" };
  }
  const input = parseResult.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  // Permission check
  const { data: canCreate } = await (supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }> }).rpc("can_create_session_for", {
    d: input.department ?? null,
  });

  if (!canCreate) {
    return { success: false, error: "You are not authorized to create a session for this department" };
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .insert({
      title: input.title,
      type: input.type,
      department: input.department ?? null,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      grace_minutes: input.grace_minutes,
      venue_name: input.venue_name ?? null,
      venue_lat: input.venue_lat ?? null,
      venue_lng: input.venue_lng ?? null,
      radius_m: input.radius_m,
      require_code: input.require_code,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Failed to create session: " + sessionError?.message };
  }

  // If live passcode required, generate secret and save via service role
  if (input.require_code) {
    const secret = crypto.randomBytes(32).toString("hex");
    const adminSupabase = createAdminClient();
    const { error: secretError } = await adminSupabase
      .from("attendance_session_secrets")
      .insert({ session_id: session.id, secret });

    if (secretError) {
      // Rollback session
      await supabase.from("attendance_sessions").delete().eq("id", session.id);
      return { success: false, error: "Failed to initialize session passcode security" };
    }
  }

  revalidatePath("/attendance");
  return { success: true, sessionId: session.id };
}

/**
 * Close Session Server Action.
 */
export async function closeAttendanceSessionAction(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id, department")
    .eq("id", sessionId)
    .single();

  if (!session) return { success: false, error: "Session not found" };

  const { data: canWrite } = await (supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }> }).rpc("can_write_attendance_department", {
    d: session.department,
  });

  if (!canWrite) {
    return { success: false, error: "Not authorized to close session for this department" };
  }

  const { error } = await supabase
    .from("attendance_sessions")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");
  return { success: true };
}

/**
 * Manual Override Server Action (Lead / Core).
 * Requires mandatory remark min 5 characters & writes to audit_log.
 */
export async function overrideAttendanceRecordAction(rawInput: ManualOverrideInput) {
  const parseResult = manualOverrideSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || "Invalid override input" };
  }
  const input = parseResult.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  // Fetch record & session
  const { data: record } = await supabase
    .from("attendance_records")
    .select("id, session_id, member_id, status, remark, method")
    .eq("id", input.record_id)
    .single();

  if (!record) return { success: false, error: "Attendance record not found" };

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id, department")
    .eq("id", record.session_id)
    .single();

  if (!session) return { success: false, error: "Session not found" };

  // Scope check: lead must have write access to session department
  const { data: canWrite } = await (supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }> }).rpc("can_write_attendance_department", {
    d: session.department,
  });

  if (!canWrite) {
    return { success: false, error: "You are not authorized to override attendance for this department" };
  }

  const beforeState = { status: record.status, remark: record.remark, method: record.method };

  // Update record (Column level RLS allows update on status, remark, method, marked_by)
  const { error: updateError } = await supabase
    .from("attendance_records")
    .update({
      status: input.status,
      remark: input.remark,
      method: "manual",
      marked_by: user.id,
    })
    .eq("id", record.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const afterState = { status: input.status, remark: input.remark, method: "manual", marked_by: user.id };

  // Audit log entry
  await supabase.rpc("log_audit", {
    p_action: "manual_override",
    p_entity: "attendance_records",
    p_entity_id: record.id,
    p_before: beforeState,
    p_after: afterState,
  });

  revalidatePath(`/attendance/${record.session_id}`);
  return { success: true };
}

/**
 * Review Flag Server Action.
 */
export async function reviewAttendanceFlagAction(rawInput: ReviewFlagInput) {
  const parseResult = reviewFlagSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || "Invalid review input" };
  }
  const input = parseResult.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  const { data: record } = await supabase
    .from("attendance_records")
    .select("id, session_id, status, review, flags")
    .eq("id", input.record_id)
    .single();

  if (!record) return { success: false, error: "Record not found" };

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id, department")
    .eq("id", record.session_id)
    .single();

  if (!session) return { success: false, error: "Session not found" };

  const { data: canWrite } = await (supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }> }).rpc("can_write_attendance_department", {
    d: session.department,
  });

  if (!canWrite) return { success: false, error: "Not authorized for this department" };

  const beforeState = { status: record.status, review: record.review };
  const newStatus = input.action === "reject" ? "absent" : record.status;
  const newReview = input.action === "reject" ? "rejected" : "approved";

  const { error: updateError } = await supabase
    .from("attendance_records")
    .update({
      status: newStatus,
      review: newReview,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  if (updateError) return { success: false, error: updateError.message };

  const afterState = { status: newStatus, review: newReview, reviewed_by: user.id };

  await supabase.rpc("log_audit", {
    p_action: `flag_${input.action}`,
    p_entity: "attendance_records",
    p_entity_id: record.id,
    p_before: beforeState,
    p_after: afterState,
  });

  revalidatePath(`/attendance/${record.session_id}`);
  return { success: true };
}

/**
 * Get Current Live Passcode Action for Leads.
 * Refreshes code every 30 seconds.
 */
export async function getLiveSessionCodeAction(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id, department, require_code, closed_at")
    .eq("id", sessionId)
    .single();

  if (!session || !session.require_code || session.closed_at) {
    return { success: false, error: "Session dynamic passcode unavailable" };
  }

  const { data: canWrite } = await (supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }> }).rpc("can_write_attendance_department", {
    d: session.department,
  });

  if (!canWrite) {
    return { success: false, error: "Not authorized to access session passcode" };
  }

  const adminSupabase = createAdminClient();
  const { data: secretRow } = await adminSupabase
    .from("attendance_session_secrets")
    .select("secret")
    .eq("session_id", sessionId)
    .single();

  if (!secretRow) return { success: false, error: "Passcode secret not found" };

  const nowMs = Date.now();
  const code = getCurrentCode(secretRow.secret, nowMs);
  const secondsRemaining = 30 - (Math.floor(nowMs / 1000) % 30);

  return { success: true, code, secondsRemaining };
}
