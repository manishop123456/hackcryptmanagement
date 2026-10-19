// FILE: src/components/tasks/task-comments.tsx
// Comments section component for task details page.

"use client";

import { useActionState, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";

import { RoleBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INITIAL_TASK_STATE } from "@/lib/tasks/constants";
import { addTaskComment, deleteTaskComment } from "@/app/(app)/tasks/actions";
import type { TaskCommentWithAuthor } from "@/lib/tasks/queries";
import { formatPlainDate } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export function TaskComments({
  taskId,
  comments,
  currentUser,
}: {
  taskId: string;
  comments: TaskCommentWithAuthor[];
  currentUser: ProfileRow;
}) {
  const [addState, addAction, isAddPending] = useActionState(addTaskComment, INITIAL_TASK_STATE);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTaskComment, INITIAL_TASK_STATE);
  const [commentBody, setCommentBody] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    const formData = new FormData(e.currentTarget);
    addAction(formData);
    setCommentBody("");
  };

  return (
    <Card className="bg-surface-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4 text-accent" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {addState.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription>{addState.message}</AlertDescription>
          </Alert>
        ) : null}

        {deleteState.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription>{deleteState.message}</AlertDescription>
          </Alert>
        ) : null}

        {/* Comment list */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No comments yet. Start the conversation below.
            </p>
          ) : (
            comments.map((comment) => {
              const isAuthor = comment.author_id === currentUser.id;
              const canDelete = isAuthor || currentUser.role === "president" || currentUser.role === "vice_president" || currentUser.role === "management_head" || currentUser.role === "development_head";

              return (
                <div
                  key={comment.id}
                  className="group relative rounded-xl border border-border bg-surface-2/60 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-strong">{comment.author?.full_name ?? "Unknown Author"}</span>
                      {comment.author?.role ? <RoleBadge role={comment.author.role} /> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatPlainDate(comment.created_at)}
                      </span>
                      {canDelete ? (
                        <form action={deleteAction}>
                          <input type="hidden" name="id" value={comment.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-danger opacity-80 group-hover:opacity-100"
                            disabled={isDeletePending}
                            title="Delete comment"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Add comment form */}
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-border">
          <input type="hidden" name="task_id" value={taskId} />
          <textarea
            name="body"
            rows={2}
            placeholder="Add a comment or update note..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            disabled={isAddPending}
            required
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={!commentBody.trim() || isAddPending}
            >
              <Send className="size-3.5" />
              {isAddPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
