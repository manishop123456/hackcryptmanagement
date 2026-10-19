// FILE: src/app/(app)/social-media/social-media-client.tsx
"use client";

import { useActionState, useState } from "react";
import { Plus, Calendar, ExternalLink, CheckCircle2, Clock, AlertTriangle, Trash2, Edit, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { INITIAL_SOCIAL_STATE } from "@/lib/social-media/constants";
import { createOrUpdateSocialPostAction, deleteSocialPostAction } from "@/lib/social-media/actions";
import type { SocialMediaPostWithDetails } from "@/lib/social-media/queries";
import type { ProfileRow } from "@/types/database";
import { formatPlainDate } from "@/lib/utils";

export function SocialMediaClient({
  posts,
  isManager,
}: {
  posts: SocialMediaPostWithDetails[];
  currentUser: ProfileRow;
  isManager: boolean;
}) {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPost, setEditingPost] = useState<SocialMediaPostWithDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(createOrUpdateSocialPostAction, INITIAL_SOCIAL_STATE);

  const filteredPosts = posts.filter((p) => {
    if (platformFilter !== "all" && p.platform !== platformFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const handleDelete = async (postId: string) => {
    if (confirm("Are you sure you want to delete this social media post?")) {
      await deleteSocialPostAction(postId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-1 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Filter */}
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">X / Twitter</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="revisions_requested">Revisions Needed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isManager ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingPost(null);
              setIsDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-4" /> Create Post Entry
          </Button>
        ) : null}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.length === 0 ? (
          <Card className="col-span-full p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground">No social media posts found matching criteria.</p>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="flex flex-col justify-between border-border bg-surface-1 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="size-4 text-accent" />
                    <span className="font-mono text-xs font-semibold text-strong capitalize">
                      {post.platform}
                    </span>
                  </div>
                  <PostStatusBadge status={post.status} />
                </div>
                <CardTitle className="text-sm font-semibold text-strong mt-2 line-clamp-2">
                  {post.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                {post.campaign ? (
                  <div className="inline-block rounded-lg bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    Campaign: {post.campaign}
                  </div>
                ) : null}

                {post.caption ? (
                  <p className="text-xs text-muted-foreground line-clamp-3 bg-surface-2/60 p-2 rounded-lg">
                    {post.caption}
                  </p>
                ) : null}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="size-3.5" /> Deadline:
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatPlainDate(post.publishing_deadline.split("T")[0])}
                  </span>
                </div>

                {post.publication_url ? (
                  <a
                    href={post.publication_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-mono"
                  >
                    <ExternalLink className="size-3" /> View Live Post
                  </a>
                ) : null}

                {isManager ? (
                  <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setEditingPost(post);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="size-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-danger hover:bg-danger/10 gap-1"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Social Post" : "Create Social Post"}</DialogTitle>
            <DialogDescription>
              Plan content, assign platform, schedule publish date, and track status.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            {editingPost ? <input type="hidden" name="post_id" value={editingPost.id} /> : null}

            {state.status === "error" ? (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}

            {state.status === "success" ? (
              <Alert variant="default" className="border-success/50 bg-success/10 text-success">
                <CheckCircle2 className="size-4 text-success" />
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="title">Post Title / Content Topic *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingPost?.title ?? ""}
                placeholder="e.g. HackCrypt 2028 Speaker Announcement Reel"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="platform">Platform *</Label>
                <Select name="platform" defaultValue={editingPost?.platform ?? "instagram"}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">X / Twitter</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Pipeline Status *</Label>
                <Select name="status" defaultValue={editingPost?.status ?? "draft"}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="revisions_requested">Revisions Needed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="publishing_deadline">Publishing Deadline *</Label>
                <Input
                  id="publishing_deadline"
                  name="publishing_deadline"
                  type="datetime-local"
                  defaultValue={
                    editingPost?.publishing_deadline
                      ? new Date(editingPost.publishing_deadline).toISOString().slice(0, 16)
                      : new Date().toISOString().slice(0, 16)
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campaign">Campaign Name (Optional)</Label>
                <Input
                  id="campaign"
                  name="campaign"
                  defaultValue={editingPost?.campaign ?? ""}
                  placeholder="e.g. HackCrypt Launch"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="caption">Draft Caption / Copy</Label>
              <textarea
                id="caption"
                name="caption"
                rows={3}
                defaultValue={editingPost?.caption ?? ""}
                placeholder="Write caption, hashtags, mentions..."
                className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publication_url">Live Publication URL (if published)</Label>
              <Input
                id="publication_url"
                name="publication_url"
                defaultValue={editingPost?.publication_url ?? ""}
                placeholder="https://instagram.com/p/..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "published":
      return (
        <Badge variant="success" className="gap-1 text-[11px]">
          <CheckCircle2 className="size-3" /> Published
        </Badge>
      );
    case "scheduled":
      return (
        <Badge variant="accent" className="gap-1 text-[11px]">
          <Clock className="size-3" /> Scheduled
        </Badge>
      );
    case "in_review":
    case "revisions_requested":
      return (
        <Badge variant="warning" className="gap-1 text-[11px]">
          <AlertTriangle className="size-3" /> {status === "in_review" ? "In Review" : "Revisions Needed"}
        </Badge>
      );
    default:
      return (
        <Badge variant="muted" className="gap-1 text-[11px] capitalize">
          {status.replace("_", " ")}
        </Badge>
      );
  }
}
