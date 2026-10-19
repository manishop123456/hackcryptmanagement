// FILE: src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// The club is in Mumbai, so every date in the app is rendered in IST. Fixing the zone
// also keeps server-rendered and client-rendered output identical.
const IST = "Asia/Kolkata";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
});

/** "22 Oct 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/** "22 Oct 2026, 06:30 pm" */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

/** "06:30 pm" */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return timeFormatter.format(date);
}

/** A date-only string as Postgres returns it, e.g. "2026-10-22". */
export function formatPlainDate(value: string | null | undefined): string {
  if (!value) return "—";
  return formatDate(`${value}T00:00:00+05:30`);
}

/** First letters of a name, for the small avatar chips. */
export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Today's date in IST as "YYYY-MM-DD", the format Postgres `date` columns use. */
export function todayIsoDate(): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const MS_PER_DAY = 86_400_000;

/** Whole days between two "YYYY-MM-DD" values. Negative means the target has passed. */
export function daysUntil(dateOnly: string, from: string = todayIsoDate()): number {
  return Math.round(
    (Date.parse(`${dateOnly}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY,
  );
}

/** Inclusive length of a date range in days. */
export function rangeLengthInDays(startsOn: string, endsOn: string): number {
  return daysUntil(endsOn, startsOn) + 1;
}

/** Which day of a range a date falls on, 1-based. */
export function dayOfRange(dateOnly: string, startsOn: string): number {
  return daysUntil(dateOnly, startsOn) + 1;
}

export function isDatePast(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

