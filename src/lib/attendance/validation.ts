import { z } from "zod";

export const sessionTypeEnum = z.enum(["meeting", "level_up", "event_day", "work_session"]);
export const departmentEnum = z.enum(["admin", "pr", "social_media", "creatives"]);
export const attendanceStatusEnum = z.enum(["present", "late", "excused", "absent"]);

/**
 * Strict self check-in input schema.
 * Rejects any extra fields (e.g. status, distance_m, flags) injected by the client.
 */
export const checkInSchema = z
  .object({
    session_id: z.string().uuid("Invalid session ID"),
    lat: z.number().min(-90).max(90).nullish(),
    lng: z.number().min(-180).max(180).nullish(),
    accuracy_m: z.number().min(0).nullish(),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Live code must be 6 digits")
      .nullish(),
  })
  .strict();

export type CheckInInput = z.infer<typeof checkInSchema>;

/**
 * Session creation schema.
 */
export const createSessionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must not exceed 200 characters"),
    type: sessionTypeEnum,
    department: departmentEnum.nullish(),
    starts_at: z.string().datetime("Invalid start time"),
    ends_at: z.string().datetime("Invalid end time"),
    grace_minutes: z.number().int().min(0).max(120).default(10),
    venue_name: z.string().trim().max(200).nullish(),
    venue_lat: z.number().min(-90).max(90).nullish(),
    venue_lng: z.number().min(-180).max(180).nullish(),
    radius_m: z.number().int().min(10).max(10000).default(100),
    require_code: z.boolean().default(false),
  })
  .refine(
    (data) => new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime(),
    {
      message: "End time must be after start time",
      path: ["ends_at"],
    }
  )
  .refine(
    (data) =>
      (data.venue_lat === null || data.venue_lat === undefined) ===
      (data.venue_lng === null || data.venue_lng === undefined),
    {
      message: "Both latitude and longitude must be specified together",
      path: ["venue_lat"],
    }
  );

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

/**
 * Manual attendance override schema.
 * Requires mandatory remark of at least 5 characters.
 */
export const manualOverrideSchema = z.object({
  record_id: z.string().uuid("Invalid record ID"),
  status: attendanceStatusEnum,
  remark: z
    .string()
    .trim()
    .min(5, "Remark must be at least 5 characters long for manual overrides"),
});

export type ManualOverrideInput = z.infer<typeof manualOverrideSchema>;

/**
 * Flag review schema.
 */
export const reviewFlagSchema = z.object({
  record_id: z.string().uuid("Invalid record ID"),
  action: z.enum(["approve", "reject"]),
  remark: z.string().trim().optional(),
});

export type ReviewFlagInput = z.infer<typeof reviewFlagSchema>;
