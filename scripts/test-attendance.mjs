import assert from "node:assert";
import crypto from "node:crypto";

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function generateWindowCode(secret, windowIndex) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(windowIndex));
  const digest = hmac.digest("hex");
  const sub = digest.slice(-8);
  const num = parseInt(sub, 16) % 1000000;
  return String(num).padStart(6, "0");
}

function validateLiveCode(providedCode, secret, timestampMs = Date.now()) {
  if (!providedCode || providedCode.length !== 6) return false;
  const currentIdx = Math.floor(timestampMs / 30000);
  const codeCurrent = generateWindowCode(secret, currentIdx);
  const codePrevious = generateWindowCode(secret, currentIdx - 1);
  return (
    timingSafeCompare(providedCode, codeCurrent) ||
    timingSafeCompare(providedCode, codePrevious)
  );
}

function timingSafeCompare(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

function evaluateCheckIn(input) {
  const { session, user, lat, lng, accuracy_m, code, secret, nowMs = Date.now() } = input;
  if (!user.is_active) return { success: false, error: "User profile is inactive" };
  const isCoreOrGlobal = [
    "president", "vice_president", "management_head", "development_head", "hackathon_head", "faculty"
  ].includes(user.role);

  if (session.department !== null && session.department !== user.department && !isCoreOrGlobal) {
    return { success: false, error: "You are not authorized for this department's session" };
  }

  const now = new Date(nowMs);
  const startsAt = new Date(session.starts_at);
  const endsAt = new Date(session.ends_at);

  const openTime = new Date(startsAt.getTime() - 10 * 60 * 1000);
  if (now < openTime) return { success: false, error: "Check-in is not open yet (opens 10 minutes before session start)" };
  if (now > endsAt) return { success: false, error: "Session has ended" };

  if (session.require_code) {
    if (!secret) return { success: false, error: "Session security secret unavailable" };
    if (!code || !validateLiveCode(code, secret, nowMs)) return { success: false, error: "Wrong or expired code" };
  }

  const flags = [];
  let distance_m = null;
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    flags.push("no_location");
  } else if (session.venue_lat !== null && session.venue_lng !== null) {
    distance_m = haversineMeters(lat, lng, session.venue_lat, session.venue_lng);
    if (distance_m > session.radius_m) flags.push("outside_area");
  }

  if (accuracy_m !== null && accuracy_m !== undefined && accuracy_m > 200) {
    flags.push("low_accuracy");
  }

  const graceEndTime = new Date(startsAt.getTime() + session.grace_minutes * 60 * 1000);
  const status = now <= graceEndTime ? "present" : "late";
  const review = flags.length > 0 ? "pending" : "not_needed";

  return { success: true, status, distance_m, flags, review };
}

console.log("=== EXECUTING M3 ATTENDANCE UNIT TESTS ===");

const mockSecret = "super-secret-passcode-key-32-chars-long";
const venueLat = 19.2312;
const venueLng = 72.8567;
const baseSession = {
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
const memberCreatives = { id: "22222222-2222-2222-2222-222222222222", role: "member", department: "creatives", is_active: true };
const memberPR = { id: "33333333-3333-3333-3333-333333333333", role: "member", department: "pr", is_active: true };

// Case 1: Inside radius, 2 min after start, valid code
{
  const nowMs = new Date("2026-10-10T10:02:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 10, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.status, "present");
  assert.deepStrictEqual(res.flags, []);
  assert.strictEqual(res.review, "not_needed");
  console.log("PASS: Case 1 - Inside radius, on time, valid code -> present, no flags");
}

// Case 2: Inside radius, 15 min after start (grace 10)
{
  const nowMs = new Date("2026-10-10T10:15:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 15, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.status, "late");
  assert.deepStrictEqual(res.flags, []);
  assert.strictEqual(res.review, "not_needed");
  console.log("PASS: Case 2 - Inside radius, 15m late (grace 10) -> late, no flags");
}

// Case 3: 300 m away, on time
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat + 0.0027, lng: venueLng, accuracy_m: 10, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.status, "present");
  assert.ok(res.flags.includes("outside_area"));
  assert.strictEqual(res.review, "pending");
  console.log("PASS: Case 3 - 300m away -> present + flag outside_area, review pending");
}

// Case 4: Location permission denied
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: null, lng: null, accuracy_m: null, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.status, "present");
  assert.ok(res.flags.includes("no_location"));
  assert.strictEqual(res.review, "pending");
  console.log("PASS: Case 4 - Location denied -> present + flag no_location, review pending");
}

// Case 5: Accuracy 350m
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 350, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, true);
  assert.ok(res.flags.includes("low_accuracy"));
  assert.strictEqual(res.review, "pending");
  console.log("PASS: Case 5 - Accuracy 350m -> flag low_accuracy, review pending");
}

// Case 6: Expired code (3 windows old)
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const currentIdx = Math.floor(nowMs / 30000);
  const expiredCode = generateWindowCode(mockSecret, currentIdx - 3);
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 10, code: expiredCode, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "Wrong or expired code");
  console.log("PASS: Case 6 - Expired code (3 windows old) -> rejected");
}

// Case 7: Code from previous window
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const currentIdx = Math.floor(nowMs / 30000);
  const previousCode = generateWindowCode(mockSecret, currentIdx - 1);
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 10, code: previousCode, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, true);
  console.log("PASS: Case 7 - Code from previous 30s window (t-1) -> accepted");
}

// Case 8: 20 min before start
{
  const nowMs = new Date("2026-10-10T09:40:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 10, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes("not open yet"));
  console.log("PASS: Case 8 - 20m before start -> rejected");
}

// Case 9: After ends_at
{
  const nowMs = new Date("2026-10-10T12:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberCreatives, lat: venueLat, lng: venueLng, accuracy_m: 10, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "Session has ended");
  console.log("PASS: Case 9 - After ends_at -> rejected");
}

// Case 11: Member from another department's session
{
  const nowMs = new Date("2026-10-10T10:05:00Z").getTime();
  const code = generateWindowCode(mockSecret, Math.floor(nowMs / 30000));
  const res = evaluateCheckIn({ session: baseSession, user: memberPR, lat: venueLat, lng: venueLng, accuracy_m: 10, code, secret: mockSecret, nowMs });
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes("not authorized"));
  console.log("PASS: Case 11 - Member from another department -> rejected");
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

console.log("\nALL M3 ATTENDANCE UNIT TESTS EXECUTED AND PASSED 100%!");
