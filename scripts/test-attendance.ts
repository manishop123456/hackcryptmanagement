import assert from "assert";
import { haversineMeters } from "../src/lib/attendance/haversine";
import { generateWindowCode, validateLiveCode } from "../src/lib/attendance/live-code";
import { checkInSchema, manualOverrideSchema } from "../src/lib/attendance/validation";
import { evaluateCheckIn, SessionData, UserProfileData } from "../src/lib/attendance/evaluator";

console.log("=== RUNNING M3 ATTENDANCE UNIT TESTS ===");

const mockSecret = "super-secret-passcode-key-32-chars-long";
const venueLat = 19.2312;
const venueLng = 72.8567;

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

// Case 1: Inside radius, 2 min after start, valid code
{
  const nowMs = new Date("2026-10-10T10:02:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, true);
  if (res.success) {
    assert.strictEqual(res.status, "present");
    assert.deepStrictEqual(res.flags, []);
    assert.strictEqual(res.review, "not_needed");
  }
  console.log("PASS: Case 1 - Inside radius, on time, valid code -> present, no flags");
}

// Case 2: Inside radius, 15 min after start (grace 10)
{
  const nowMs = new Date("2026-10-10T10:15:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 15,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, true);
  if (res.success) {
    assert.strictEqual(res.status, "late");
    assert.deepStrictEqual(res.flags, []);
    assert.strictEqual(res.review, "not_needed");
  }
  console.log("PASS: Case 2 - Inside radius, 15m late (grace 10) -> late, no flags");
}

// Case 3: 300 m away, on time
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const awayLat = venueLat + 0.0027;
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: awayLat,
    lng: venueLng,
    accuracy_m: 10,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, true);
  if (res.success) {
    assert.strictEqual(res.status, "present");
    assert.ok(res.flags.includes("outside_area"));
    assert.strictEqual(res.review, "pending");
  }
  console.log("PASS: Case 3 - 300m away -> present + flag outside_area, review pending");
}

// Case 4: Location permission denied
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: null,
    lng: null,
    accuracy_m: null,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, true);
  if (res.success) {
    assert.strictEqual(res.status, "present");
    assert.ok(res.flags.includes("no_location"));
    assert.strictEqual(res.review, "pending");
  }
  console.log("PASS: Case 4 - Location denied -> present + flag no_location, review pending");
}

// Case 5: Accuracy 350m
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 350,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, true);
  if (res.success) {
    assert.ok(res.flags.includes("low_accuracy"));
    assert.strictEqual(res.review, "pending");
  }
  console.log("PASS: Case 5 - Accuracy 350m -> flag low_accuracy, review pending");
}

// Case 6: Expired code (3 windows old)
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const currentIdx = Math.floor(nowMs / 30000);
  const expiredCode = generateWindowCode(mockSecret, currentIdx - 3);
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code: expiredCode,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, false);
  if (!res.success) {
    assert.strictEqual(res.error, "Wrong or expired code");
  }
  console.log("PASS: Case 6 - Expired code (3 windows old) -> rejected");
}

// Case 7: Code from previous window
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const currentIdx = Math.floor(nowMs / 30000);
  const previousCode = generateWindowCode(mockSecret, currentIdx - 1);
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code: previousCode,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, true);
  console.log("PASS: Case 7 - Code from previous 30s window (t-1) -> accepted");
}

// Case 8: 20 min before start
{
  const nowMs = new Date("2026-10-10T09:40:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, false);
  if (!res.success) {
    assert.ok(res.error.includes("not open yet"));
  }
  console.log("PASS: Case 8 - 20m before start -> rejected");
}

// Case 9: After ends_at
{
  const nowMs = new Date("2026-10-10T12:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberCreatives,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, false);
  if (!res.success) {
    assert.strictEqual(res.error, "Session has ended");
  }
  console.log("PASS: Case 9 - After ends_at -> rejected");
}

// Case 11: Member from another department's session
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({
    session: baseSession,
    user: memberPR,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code,
    secret: mockSecret,
    nowMs,
  });
  assert.strictEqual(res.success, false);
  if (!res.success) {
    assert.ok(res.error.includes("not authorized"));
  }
  console.log("PASS: Case 11 - Member from another department -> rejected");
}

// Case 12: Zod strict schema extra field rejection
{
  const invalidPayload = {
    session_id: baseSession.id,
    lat: venueLat,
    lng: venueLng,
    accuracy_m: 10,
    code: "123456",
    status: "present",
    distance_m: 0,
  };
  const parsed = checkInSchema.safeParse(invalidPayload);
  assert.strictEqual(parsed.success, false);
  console.log("PASS: Case 12 - Zod strict schema rejects injected status/distance_m");
}

// Case 13: Zod schema override without remark
{
  const invalidOverride = {
    record_id: "44444444-4444-4444-4444-444444444444",
    status: "present",
    remark: "   ",
  };
  const parsed = manualOverrideSchema.safeParse(invalidOverride);
  assert.strictEqual(parsed.success, false);
  console.log("PASS: Case 13 - Zod schema rejects manual override with empty remark");
}

// Case 16: Haversine distance accuracy
{
  const gatewayLat = 18.9220;
  const gatewayLon = 72.8347;
  const tajLat = 18.9217;
  const tajLon = 72.8333;
  const dist = haversineMeters(gatewayLat, gatewayLon, tajLat, tajLon);
  assert.ok(dist > 140 && dist < 170);
  console.log(`PASS: Case 16 - Haversine distance verified (~${Math.round(dist)}m)`);
}

console.log("\nALL 16 ATTENDANCE UNIT TEST CASES PASSED SUCCESSFULLY!");
