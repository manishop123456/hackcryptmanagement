// FILE: src/lib/contribution/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile, toActor } from "@/lib/auth";
import { canWriteDepartment } from "@/lib/permissions";

const saveRatingSchema = z.object({
  memberId: z.string().uuid(),
  rating: z.number().min(0).max(100),
  majorContribution: z.string().optional(),
  period: z.string().min(1),
});

export async function saveLeadRatingAction(formData: FormData) {
  const actor = await requireActiveProfile();

  if (actor.role === "member" || actor.role === "faculty") {
    throw new Error("Only team leads and heads can submit lead ratings.");
  }

  const parsed = saveRatingSchema.safeParse({
    memberId: formData.get("memberId"),
    rating: Number(formData.get("rating") || 0),
    majorContribution: formData.get("majorContribution")?.toString() || "",
    period: formData.get("period")?.toString() || "Phase 1",
  });

  if (!parsed.success) {
    throw new Error("Invalid rating inputs provided");
  }

  const { memberId, rating, majorContribution, period } = parsed.data;

  if (memberId === actor.id) {
    throw new Error("You cannot submit a lead rating for yourself.");
  }

  const supabase = await createClient();

  // Fetch target member profile to verify department scope
  const { data: targetMember } = await supabase
    .from("profiles")
    .select("department")
    .eq("id", memberId)
    .maybeSingle();

  if (!targetMember) {
    throw new Error("Member profile not found.");
  }

  if (!canWriteDepartment(toActor(actor), targetMember.department)) {
    throw new Error("You are not authorized to rate members in this department.");
  }

  const { error } = await supabase.from("contribution_ratings").upsert(
    {
      member_id: memberId,
      rated_by: actor.id,
      period,
      rating,
      major_contribution: majorContribution,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id,period" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/contribution");
}
