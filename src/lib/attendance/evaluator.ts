import { haversineMeters } from "./haversine";
import { validateLiveCode } from "./live-code";

export interface SessionData {
  id: string;
  department: string | null;
  starts_at: string;
  ends_at: string;
  grace_minutes: number;
  venue_lat: number | null;
  venue_lng: number | null;
  radius_m: number;
  require_code: boolean;
}

export interface UserProfileData {
  id: string;
  role: string;
  department: string | null;
  is_active: boolean;
}

export interface CheckInEvaluationInput {
  session: SessionData;
  user: UserProfileData;
  lat?: number | null;
  lng?: number | null;
  accuracy_m?: number | null;
  code?: string | null;
  secret?: string | null; // From attendance_session_secrets
  nowMs?: number; // Optional override for testing
}

export interface CheckInEvaluationSuccess {
  success: true;
  status: "present" | "late";
  distance_m: number | null;
  flags: Array<"outside_area" | "no_location" | "low_accuracy">;
  review: "pending" | "not_needed";
  message: string;
}

export interface CheckInEvaluationFailure {
  success: false;
  error: string;
}

export type CheckInEvaluationResult =
  | CheckInEvaluationSuccess
  | CheckInEvaluationFailure;

/**
 * Pure evaluation function implementing the exact attendance algorithm from docs/ATTENDANCE_LOGIC.md.
 */
export function evaluateCheckIn(
  input: CheckInEvaluationInput
): CheckInEvaluationResult {
  const { session, user, lat, lng, accuracy_m, code, secret, nowMs = Date.now() } = input;

  // 1. Authenticate & Active Member Check
  if (!user.is_active) {
    return { success: false, error: "User profile is inactive" };
  }

  // 2. Department Scope Check
  // Department-specific sessions require user department match or core/all-dept access
  const isCoreOrGlobal = [
    "president",
    "vice_president",
    "management_head",
    "development_head",
    "hackathon_head",
    "faculty",
  ].includes(user.role);

  if (
    session.department !== null &&
    session.department !== user.department &&
    !isCoreOrGlobal
  ) {
    return {
      success: false,
      error: "You are not authorized for this department's session",
    };
  }

  const now = new Date(nowMs);
  const startsAt = new Date(session.starts_at);
  const endsAt = new Date(session.ends_at);

  // 3. Time Window Check
  const openTime = new Date(startsAt.getTime() - 10 * 60 * 1000);
  if (now < openTime) {
    return {
      success: false,
      error: "Check-in is not open yet (opens 10 minutes before session start)",
    };
  }

  if (now > endsAt) {
    return { success: false, error: "Session has ended" };
  }

  // 4. Live Passcode Check
  if (session.require_code) {
    if (!secret) {
      return { success: false, error: "Session security secret unavailable" };
    }
    if (!code || !validateLiveCode(code, secret, nowMs)) {
      return { success: false, error: "Wrong or expired code" };
    }
  }

  // 5. Location & Flags Calculation
  const flags: Array<"outside_area" | "no_location" | "low_accuracy"> = [];
  let distance_m: number | null = null;

  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    flags.push("no_location");
  } else if (session.venue_lat !== null && session.venue_lng !== null) {
    distance_m = haversineMeters(lat, lng, session.venue_lat, session.venue_lng);
    if (distance_m > session.radius_m) {
      flags.push("outside_area");
    }
  }

  if (accuracy_m !== null && accuracy_m !== undefined && accuracy_m > 200) {
    flags.push("low_accuracy");
  }

  // 6. Base Status Calculation
  const graceEndTime = new Date(startsAt.getTime() + session.grace_minutes * 60 * 1000);
  const status: "present" | "late" = now <= graceEndTime ? "present" : "late";

  // 7. Review Verdict
  const review: "pending" | "not_needed" =
    flags.length > 0 ? "pending" : "not_needed";

  const message = generateStatusMessage(status, flags);

  return {
    success: true,
    status,
    distance_m,
    flags,
    review,
    message,
  };
}

function generateStatusMessage(
  status: "present" | "late",
  flags: Array<"outside_area" | "no_location" | "low_accuracy">
): string {
  if (flags.length === 0) {
    return status === "present"
      ? "Check-in successful! Attendance marked present."
      : "Check-in successful! Attendance marked late (after grace period).";
  }

  const flagDetails: string[] = [];
  if (flags.includes("no_location")) flagDetails.push("missing location");
  if (flags.includes("outside_area")) flagDetails.push("outside designated venue area");
  if (flags.includes("low_accuracy")) flagDetails.push("low GPS accuracy");

  return `Check-in recorded (${status}). Sent for team lead review due to: ${flagDetails.join(", ")}.`;
}
