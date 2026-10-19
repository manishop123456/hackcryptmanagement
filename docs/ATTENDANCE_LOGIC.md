# Attendance Logic (authoritative)

All checks run on the **server**. The client only sends `{ session_id, lat, lng, accuracy_m, code? }`.

## Inputs on a session
`starts_at`, `ends_at`, `grace_minutes` (default 10), `venue_lat`, `venue_lng`, `radius_m` (default 100), `require_code`, `code_secret`.

## Algorithm

1. Authenticate the user. Reject if not an active member allowed in this session's department scope.
2. Load session. Reject with "Session not found" if missing.
3. **Time window**
   - `now < starts_at - 10 min` → reject: "Check-in not open yet".
   - `now > ends_at` → reject: "Session has ended".
4. **Duplicate**: one record per `(session_id, member_id)`. If one exists, return it (do not overwrite).
5. **Live code** (if `require_code`)
   - Valid if code matches the current 30 s window or the previous one.
   - Invalid/missing → reject: "Wrong or expired code". Do not create a record.
6. **Location**
   - If lat/lng missing or invalid → flag `no_location`.
   - Else compute `distance_m` with Haversine.
   - `distance_m > radius_m` → flag `outside_area`.
   - `accuracy_m > 200` → flag `low_accuracy` (can combine with other flags).
7. **Base status**
   - `now <= starts_at + grace_minutes` → `present`
   - otherwise → `late`
8. **Save record**
   - `method = 'self'`, store lat, lng, accuracy_m, distance_m, checked_in_at, flag.
   - If any flag → `review = 'pending'`, else `review = 'not_needed'`.
9. Return status + flag + friendly message to the client.

Flagged records are NOT auto-rejected. A lead approves or rejects them in the review queue. Rejecting sets the final status to `absent` and logs it in `audit_log`.

## Haversine (reference)

```ts
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
```

## Live code (reference)

Code = last 6 digits of `HMAC_SHA256(code_secret, String(Math.floor(Date.now() / 30000)))` converted to a number, zero-padded to 6 digits. Accept window `t` and `t-1`. The lead's screen shows the current code and refreshes every 30 s. Compare codes with a constant-time comparison.

## Manual override (leads and above)
- Allowed statuses: present, late, excused, absent.
- Remark is mandatory (min 5 characters).
- Sets `method = 'manual'`, `marked_by`, writes `audit_log` with before/after.
- A lead can override only members of their own department (Admin lead is read-only across other departments).

## Attendance %
`attendance % = (present + late + excused) / total sessions the member was expected at × 100`
(Late counts as attended; show late count separately. Excused sessions are excluded from the denominator if the setting `excused_excluded` is true.)

## Test cases (write these as unit tests)

| # | Scenario | Expected |
|---|---|---|
| 1 | Inside radius, 2 min after start, valid code | present, no flag |
| 2 | Inside radius, 15 min after start (grace 10) | late, no flag |
| 3 | 300 m away, on time | present + flag `outside_area`, review pending |
| 4 | Location permission denied (no lat/lng) | present + flag `no_location`, review pending |
| 5 | Accuracy 350 m, inside radius | flag `low_accuracy`, review pending |
| 6 | Expired code (3 windows old) | rejected, no record |
| 7 | Code from previous window | accepted |
| 8 | 20 min before start | rejected: not open yet |
| 9 | After `ends_at` | rejected: ended |
| 10 | Second check-in by same member | returns existing record, no overwrite |
| 11 | Member from another department's session | rejected (RLS + server check) |
| 12 | Client tries to send `status` or `distance_m` | ignored/rejected by Zod schema |
| 13 | Lead overrides without remark | rejected |
| 14 | Creatives lead overrides a PR member | rejected |
| 15 | Admin lead reads PR attendance | allowed (read only) |
| 16 | Haversine for known pair of points | within 1 m of expected value |
