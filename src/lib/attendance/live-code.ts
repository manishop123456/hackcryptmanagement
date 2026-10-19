import crypto from "crypto";

/**
 * Generate a 6-digit dynamic passcode for a given time window index.
 * HMAC_SHA256(secret, windowIndex) -> last 6 digits zero-padded.
 */
export function generateWindowCode(secret: string, windowIndex: number): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(windowIndex));
  const digest = hmac.digest("hex");
  // Extract integer from last 8 hex chars, get modulo 1000000
  const sub = digest.slice(-8);
  const num = parseInt(sub, 16) % 1000000;
  return String(num).padStart(6, "0");
}

/**
 * Get current 30-second window index for a given timestamp (default Date.now()).
 */
export function getWindowIndex(timestampMs: number = Date.now()): number {
  return Math.floor(timestampMs / 30000);
}

/**
 * Generate current 6-digit code for a secret.
 */
export function getCurrentCode(secret: string, timestampMs: number = Date.now()): string {
  return generateWindowCode(secret, getWindowIndex(timestampMs));
}

/**
 * Validate a user-provided 6-digit code against a secret.
 * Accepts code generated in current window (t) or previous window (t-1).
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateLiveCode(
  providedCode: string,
  secret: string,
  timestampMs: number = Date.now()
): boolean {
  if (!providedCode || providedCode.length !== 6) {
    return false;
  }

  const currentIdx = getWindowIndex(timestampMs);
  const codeCurrent = generateWindowCode(secret, currentIdx);
  const codePrevious = generateWindowCode(secret, currentIdx - 1);

  return (
    timingSafeCompare(providedCode, codeCurrent) ||
    timingSafeCompare(providedCode, codePrevious)
  );
}

/**
 * Constant-time string equality check.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return crypto.timingSafeEqual(bufA, bufB);
}
