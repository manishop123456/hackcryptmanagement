// FILE: src/lib/daily-reports/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { canReviewDailyReport } from "@/lib/permissions";
import type { WorkEntryItem } from "@/types/database";
import type { DailyReportActionState } from "./constants";
export type { DailyReportActionState };

const workEntrySchema = z.object({
  task_id: z.string().optional().nullable(),
  task_title: z.string().optional().nullable(),
  category: z.enum(["task_work", "meeting", "cross_team_help", "event_prep", "other"]),
  description: z.string().min(3, "Work entry description is required."),
  duration_minutes: z.number().min(5, "Minimum duration is 5 minutes."),
  deliverable_urls: z.array(z.string().url()).optional(),
  progress_notes: z.string().optional(),
});

const submitReportSchema = z.object({
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  summary: z.string().min(5, "Daily summary must be at least 5 characters long."),
  work_entries_json: z.string(),
  other_work: z.string().optional(),
  proof_links_raw: z.string().optional(),
  blockers: z.string().optional(),
  next_priorities: z.string().optional(),
  optional_notes: z.string().optional(),
  is_excused: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  excused_reason: z.string().optional(),
  is_draft: z.preprocess((val) => val === "true" || val === true, z.boolean()),
});

export async function saveOrSubmitDailyReport(
  _prevState: DailyReportActionState,
  formData: FormData
): Promise<DailyReportActionState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { status: "error", message: "Unauthorized. Please sign in again." };
    }

    const raw = {
      report_date: formData.get("report_date"),
      summary: formData.get("summary"),
      work_entries_json: formData.get("work_entries_json") ?? "[]",
      other_work: formData.get("other_work") ?? "",
      proof_links_raw: formData.get("proof_links_raw") ?? "",
      blockers: formData.get("blockers") ?? "",
      next_priorities: formData.get("next_priorities") ?? "",
      optional_notes: formData.get("optional_notes") ?? "",
      is_excused: formData.get("is_excused"),
      excused_reason: formData.get("excused_reason") ?? "",
      is_draft: formData.get("is_draft"),
    };

    const parsed = submitReportSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).join(" "),
      };
    }

    const data = parsed.data;

    let workEntries: WorkEntryItem[] = [];
    try {
      const jsonParsed = JSON.parse(data.work_entries_json);
      if (Array.isArray(jsonParsed)) {
        workEntries = jsonParsed.map((item) => workEntrySchema.parse(item));
      }
    } catch {
      return { status: "error", message: "Invalid work entries breakdown structure." };
    }

    const totalTimeMinutes = workEntries.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);

    const proofLinks = (data.proof_links_raw || "")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const reportStatus = data.is_draft ? "draft" : "submitted";

    // Upsert into daily_reports
    const { data: existingReport } = await supabase
      .from("daily_reports")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("report_date", data.report_date)
      .maybeSingle();

    if (existingReport) {
      // Prevent reverting already submitted/reviewed reports to draft
      const finalStatus =
        existingReport.status !== "draft" && data.is_draft
          ? existingReport.status
          : reportStatus;

      // Create history record before update if previously submitted or reviewed or revised
      if (existingReport.status !== "draft") {
        const { data: oldData } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("id", existingReport.id)
          .maybeSingle();

        if (oldData) {
          await supabase.from("daily_report_history").insert({
            report_id: existingReport.id,
            changed_by: user.id,
            action: "member_updated_after_submission",
            before: (oldData as unknown) as import("@/types/database").Json,
            after: ({
              summary: data.summary,
              work_entries: workEntries,
              status: finalStatus,
            } as unknown) as import("@/types/database").Json,
          });
        }
      }

      const { error: updateErr } = await supabase
        .from("daily_reports")
        .update({
          summary: data.summary,
          work_entries: workEntries,
          other_work: data.other_work || null,
          total_time_minutes: totalTimeMinutes,
          proof_links: proofLinks,
          blockers: data.blockers || null,
          next_priorities: data.next_priorities || null,
          optional_notes: data.optional_notes || null,
          is_excused: data.is_excused,
          excused_reason: data.is_excused ? data.excused_reason : null,
          status: finalStatus,
          submitted_at: finalStatus === "draft" ? null : new Date().toISOString(),
        })
        .eq("id", existingReport.id);

      if (updateErr) {
        return { status: "error", message: `Failed to update report: ${updateErr.message}` };
      }
    } else {
      const { error: insertErr } = await supabase
        .from("daily_reports")
        .insert({
          user_id: user.id,
          report_date: data.report_date,
          summary: data.summary,
          work_entries: workEntries,
          other_work: data.other_work || null,
          total_time_minutes: totalTimeMinutes,
          proof_links: proofLinks,
          blockers: data.blockers || null,
          next_priorities: data.next_priorities || null,
          optional_notes: data.optional_notes || null,
          is_excused: data.is_excused,
          excused_reason: data.is_excused ? data.excused_reason : null,
          status: reportStatus,
          submitted_at: data.is_draft ? null : new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertErr) {
        return { status: "error", message: `Failed to create report: ${insertErr.message}` };
      }
    }

    revalidatePath("/daily-reports");
    revalidatePath("/daily-reports/digest");
    revalidatePath("/radar");

    return {
      status: "success",
      message: data.is_draft ? "Daily report draft saved." : "Daily report submitted successfully!",
    };
  } catch (err: unknown) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "An unknown error occurred.",
    };
  }
}

const reviewReportSchema = z.object({
  report_id: z.string().uuid(),
  decision: z.enum(["reviewed", "changes_requested"]),
  comments: z.string().optional(),
});

export async function reviewDailyReportAction(
  _prevState: DailyReportActionState,
  formData: FormData
): Promise<DailyReportActionState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { status: "error", message: "Unauthorized." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, department, co_head_department")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { status: "error", message: "Profile not found." };
    }

    const raw = {
      report_id: formData.get("report_id"),
      decision: formData.get("decision"),
      comments: formData.get("comments") ?? "",
    };

    const parsed = reviewReportSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues.map((i) => i.message).join(" ") };
    }

    const { report_id, decision, comments } = parsed.data;

    const { data: report } = await supabase
      .from("daily_reports")
      .select("id, user_id, status, profiles(department)")
      .eq("id", report_id)
      .single();

    if (!report) {
      return { status: "error", message: "Daily report not found." };
    }

    const reportDept = (report.profiles as unknown as { department: import("@/lib/constants").Department } | null)?.department ?? null;

    const allowed = canReviewDailyReport(
      {
        role: profile.role,
        department: profile.department,
        co_head_department: profile.co_head_department,
      },
      reportDept
    );

    if (!allowed) {
      return { status: "error", message: "You do not have permission to review this daily report." };
    }

    const { error: updateErr } = await supabase
      .from("daily_reports")
      .update({
        status: decision,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
        review_comments: comments || null,
      })
      .eq("id", report_id);

    if (updateErr) {
      return { status: "error", message: updateErr.message };
    }

    // Log history
    await supabase.from("daily_report_history").insert({
      report_id,
      changed_by: user.id,
      action: `reviewer_${decision}`,
      after: ({ decision, comments } as unknown) as import("@/types/database").Json,
    });

    revalidatePath("/daily-reports");
    revalidatePath("/daily-reports/digest");
    revalidatePath("/radar");

    return {
      status: "success",
      message: decision === "reviewed" ? "Daily report approved." : "Requested corrections on daily report.",
    };
  } catch (err: unknown) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "An unknown error occurred.",
    };
  }
}
