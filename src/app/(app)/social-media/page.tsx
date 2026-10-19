// FILE: src/app/(app)/social-media/page.tsx
import { requireActiveProfile } from "@/lib/auth";
import { getSocialMediaPosts } from "@/lib/social-media/queries";
import { canManageSocialMedia } from "@/lib/permissions";
import { SocialMediaClient } from "./social-media-client";

export const metadata = {
  title: "Social Media Control Room | DevClub Management",
};

export default async function SocialMediaPage() {
  const currentUser = await requireActiveProfile();
  const posts = await getSocialMediaPosts();
  const isManager = canManageSocialMedia(currentUser) && currentUser.role !== "member" && currentUser.role !== "faculty";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-strong">Social Media Control Room</h1>
          <p className="text-sm text-muted-foreground">
            Manage campaign schedules, content pipelines, creative assets, and publishing status across platforms.
          </p>
        </div>
      </div>

      <SocialMediaClient posts={posts} currentUser={currentUser} isManager={isManager} />
    </div>
  );
}
