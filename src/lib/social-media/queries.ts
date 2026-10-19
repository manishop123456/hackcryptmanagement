// FILE: src/lib/social-media/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, SocialMediaPostRow } from "@/types/database";

export type SocialMediaPostWithDetails = SocialMediaPostRow & {
  content_owner?: ProfileRow | null;
  designer?: ProfileRow | null;
  copywriter?: ProfileRow | null;
  reviewer?: ProfileRow | null;
};

export async function getSocialMediaPosts(filters?: {
  platform?: string;
  status?: string;
  campaign?: string;
}): Promise<SocialMediaPostWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("social_media_posts")
    .select(`
      *,
      content_owner:profiles!social_media_posts_content_owner_id_fkey(id, full_name, email, role, department),
      designer:profiles!social_media_posts_designer_id_fkey(id, full_name, role),
      copywriter:profiles!social_media_posts_copywriter_id_fkey(id, full_name, role),
      reviewer:profiles!social_media_posts_reviewer_id_fkey(id, full_name, role)
    `)
    .order("publishing_deadline", { ascending: true });

  if (filters?.platform && filters.platform !== "all") {
    query = query.eq("platform", filters.platform);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as SocialMediaPostRow["status"]);
  }

  if (filters?.campaign && filters.campaign !== "all") {
    query = query.eq("campaign", filters.campaign);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching social media posts:", error);
    return [];
  }

  return (data as unknown as SocialMediaPostWithDetails[]) || [];
}
