// FILE: src/lib/social-media/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { canManageSocialMedia } from "@/lib/permissions";
import type { Database, SocialPostStatus } from "@/types/database";

type SocialPostUpdate = Database["public"]["Tables"]["social_media_posts"]["Update"];
import type { SocialMediaActionState } from "./constants";
export type { SocialMediaActionState };

const postSchema = z
  .object({
    title: z.string().min(3, "Title is required."),
    platform: z.string().min(1, "Platform is required."),
    publishing_deadline: z.string().min(1, "Publishing deadline is required.").refine(
      (val) => !isNaN(Date.parse(val)),
      { message: "Invalid publishing deadline date" }
    ),
    status: z.enum(["draft", "in_review", "revisions_requested", "approved", "scheduled", "published"]),
    campaign: z.string().optional(),
    caption: z.string().optional(),
    creative_urls_raw: z.string().optional(),
    publication_url: z.string().url().optional().or(z.literal("")),
    proof_url: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.status === "published") {
        return Boolean(data.publication_url && data.publication_url.trim().length > 0);
      }
      return true;
    },
    {
      message: "A live publication URL is required when marking a post as published.",
      path: ["publication_url"],
    }
  );

export async function createOrUpdateSocialPostAction(
  _prevState: SocialMediaActionState,
  formData: FormData
): Promise<SocialMediaActionState> {
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

    if (!profile || !canManageSocialMedia(profile)) {
      return { status: "error", message: "Only Social Media & Creatives team members or leadership can manage posts." };
    }

    const postId = formData.get("post_id")?.toString();

    const raw = {
      title: formData.get("title"),
      platform: formData.get("platform"),
      publishing_deadline: formData.get("publishing_deadline"),
      status: formData.get("status") ?? "draft",
      campaign: formData.get("campaign") ?? "",
      caption: formData.get("caption") ?? "",
      creative_urls_raw: formData.get("creative_urls_raw") ?? "",
      publication_url: formData.get("publication_url") ?? "",
      proof_url: formData.get("proof_url") ?? "",
    };

    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues.map((i) => i.message).join(" ") };
    }

    const data = parsed.data;

    // Unauthorized approval guard: regular members cannot approve, request revisions, or publish posts
    const isLeadership = profile.role !== "member" && profile.role !== "faculty";
    if (!isLeadership && ["approved", "revisions_requested", "published"].includes(data.status)) {
      return {
        status: "error",
        message: "Only team leads and heads can approve, request revisions, or publish social posts.",
      };
    }

    const creativeUrls = (data.creative_urls_raw || "")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const reviewerId = data.status === "approved" || data.status === "published" ? user.id : undefined;

    if (postId) {
      const updatePayload: SocialPostUpdate = {
        title: data.title,
        platform: data.platform,
        publishing_deadline: new Date(data.publishing_deadline).toISOString(),
        status: data.status as SocialPostStatus,
        campaign: data.campaign || null,
        caption: data.caption || null,
        creative_urls: creativeUrls,
        publication_url: data.publication_url || null,
        proof_url: data.proof_url || null,
      };

      if (reviewerId) {
        updatePayload.reviewer_id = reviewerId;
      }

      const { error: updateErr } = await supabase
        .from("social_media_posts")
        .update(updatePayload)
        .eq("id", postId);

      if (updateErr) {
        return { status: "error", message: updateErr.message };
      }
    } else {
      const { error: insertErr } = await supabase.from("social_media_posts").insert({
        title: data.title,
        platform: data.platform,
        publishing_deadline: new Date(data.publishing_deadline).toISOString(),
        status: data.status as SocialPostStatus,
        campaign: data.campaign || null,
        caption: data.caption || null,
        creative_urls: creativeUrls,
        publication_url: data.publication_url || null,
        proof_url: data.proof_url || null,
        content_owner_id: user.id,
        reviewer_id: reviewerId || null,
      });

      if (insertErr) {
        return { status: "error", message: insertErr.message };
      }
    }

    revalidatePath("/social-media");
    revalidatePath("/radar");

    return {
      status: "success",
      message: postId ? "Social media post updated!" : "Social media post created successfully!",
    };
  } catch (err: unknown) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "An unknown error occurred.",
    };
  }
}

export async function deleteSocialPostAction(postId: string): Promise<SocialMediaActionState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "error", message: "Unauthorized." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, department, co_head_department")
      .eq("id", user.id)
      .single();

    if (!profile || !canManageSocialMedia(profile)) {
      return { status: "error", message: "Permission denied." };
    }

    const { error } = await supabase.from("social_media_posts").delete().eq("id", postId);

    if (error) return { status: "error", message: error.message };

    revalidatePath("/social-media");
    revalidatePath("/radar");
    return { status: "success", message: "Post deleted successfully." };
  } catch (err: unknown) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "An unknown error occurred.",
    };
  }
}
