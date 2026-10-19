import { haversineMeters } from "../haversine";
import { generateWindowCode } from "../live-code";
import { checkInSchema, manualOverrideSchema } from "../validation";
import { evaluateCheckIn, SessionData, UserProfileData } from "../evaluator";

const mockSecret = "super-secret-passcode-key-32-chars-long";
const venueLat = 19.2312; // TRCAC Mumbai approx lat
const venueLng = 72.8567; // TRCAC Mumbai approx lng

const baseSession: SessionData = {
  id: "11111111-1111-1111-1111-111111111111",
  department: "creatives",
  starts_at: "2026-10-10T10:00:00Z",
  ends_at: "2026-10-10T12:00:00Z",
  grace_minutes: 10,
  venue_lat: venueLat,
  venue_lng: venueLng,
  radius_m: 100,
  require_code: true,
};

const memberCreatives: UserProfileData = {
  id: "22222222-2222-2222-2222-222222222222",
  role: "member",
  department: "creatives",
  is_active: true,
};

const memberPR: UserProfileData = {
  id: "33333333-3333-3333-3333-333333333333",
  role: "member",
  department: "pr",
  is_active: true,
};

export function runAttendanceUnitTests() {
  console.log("=== EXECUTING ATTENDANCE UNIT TESTS ===");

  // Case 1
  const nowMs1 = new Date("2026-10-10T10:02:00Z").getTime();
  const code1 = generateWindowCode(mockSecret, Math.floor(nowMs1 / 30000));
  const res1 = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code: code1,
    secret: mockSecret,
    nowMs: nowMs1,
  });
  if (!res1.success || res1.status !== "present" || res1.flags.length !== 0) {
    throw new Error("Case 1 Failed");
  }

  // Case 2
  const nowMs2 = new Date("2026-10-10T10:15:00Z").getTime();
  const code2 = generateWindowCode(mockSecret, Math.floor(nowMs2 / 30000));
  const res2 = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 15,
    code: code2,
    secret: mockSecret,
    nowMs: nowMs2,
  });
  if (!res2.success || res2.status !== "late" || res2.flags.length !== 0) {
    throw new Error("Case 2 Failed");
  }

  // Case 3
  const nowMs3 = new Date("2026-10-10T10:05:00Z").getTime();
  const code3 = generateWindowCode(mockSecret, Math.floor(nowMs3 / 30000));
  const res3 = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat + 0.0027,
    lng: venueLng,
    accuracy_m: 10,
    code: code3,
    secret: mockSecret,
    nowMs: nowMs3,
  });
  if (!res3.success || !res3.flags.includes("outside_area") || res3.review !== "pending") {
    throw new Error("Case 3 Failed");
  }

  // Case 4
  const res4 = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: null,
    lng: null,
    accuracy_m: null,
    code: code3,
    secret: mockSecret,
    nowMs: nowMs3,
  });
  if (!res4.success || !res4.flags.includes("no_location") || res4.review !== "pending") {
    throw new Error("Case 4 Failed");
  }

  // Case 5
  const res5 = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 350,
    code: code3,
    secret: mockSecret,
    nowMs: nowMs3,
  });
  if (!res5.success || !res5.flags.includes("low_accuracy") || res5.review !== "pending") {
    throw new Error("Case 5 Failed");
  }

  // Case 6
  const expiredCode = generateWindowCode(mockSecret, Math.floor(nowMs3 / 30000) - 3);
  const res6 = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code: expiredCode,
    secret: mockSecret,
    nowMs: nowMs3,
  });
  if (res6.success) throw new Error("Case 6 Failed");

  // Case 11
  const res11 = evaluateCheckIn({
    session: baseSession,
    user: memberPR,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code: code3,
    secret: mockSecret,
    nowMs: nowMs3,
  });
  if (res11.success) throw new Error("Case 11 Failed");

  // Case 12
  const parsed12 = checkInSchema.safeParse({
    session_id: baseSession.id,
    lat: venueLat,
    lng: venueLng,
    status: "present",
  });
  if (parsed12.success) throw new Error("Case 12 Failed");

  // Case 13
  const parsed13 = manualOverrideSchema.safeParse({
    record_id: "44444444-4444-4444-4444-444444444444",
    status: "present",
    remark: "   ",
  });
  if (parsed13.success) throw new Error("Case 13 Failed");

  // Case 16
  const dist = haversineMeters(18.9220, 72.8347, 18.9217, 72.8333);
  if (dist < 140 || dist > 170) throw new Error("Case 16 Failed");

  console.log("ALL UNIT TESTS PASSED 100%");
}
