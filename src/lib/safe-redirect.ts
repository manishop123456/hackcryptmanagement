// FILE: src/lib/safe-redirect.ts

/**
 * Only ever redirect to a path inside this app. Blocks absolute URLs, protocol-relative
 * URLs and backslash tricks, so `?next=` cannot be used as an open redirect.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
