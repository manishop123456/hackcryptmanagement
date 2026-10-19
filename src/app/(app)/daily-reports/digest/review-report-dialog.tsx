// FILE: src/app/(app)/daily-reports/digest/review-report-dialog.tsx
"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_REPORT_STATE } from "@/lib/daily-reports/constants";
import { reviewDailyReportAction } from "@/lib/daily-reports/actions";
import type { DailyReportWithProfile } from "@/lib/daily-reports/queries";
import type { ProfileRow } from "@/types/database";

export function ReviewReportDialog({
  report,
}: {
  report: DailyReportWithProfile;
  currentUser: ProfileRow;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(reviewDailyReportAction, INITIAL_REPORT_STATE);
  const [comments, setComments] = useState(report.review_comments ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          Review Report
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Daily Log: {report.profile?.full_name}</DialogTitle>
          <DialogDescription>
            Date: {report.report_date} • {report.summary}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="report_id" value={report.id} />

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          {state.status === "success" ? (
            <Alert variant="default" className="border-success/50 bg-success/10 text-success">
              <CheckCircle2 className="size-4 text-success" />
              <AlertTitle>Decision Saved</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="comments">Reviewer Comments / Remarks</Label>
            <Input
              id="comments"
              name="comments"
              placeholder="e.g. Good work on poster design; please update task #12"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="submit"
              name="decision"
              value="changes_requested"
              variant="outline"
              disabled={isPending}
            >
              Request Changes
            </Button>
            <Button
              type="submit"
              name="decision"
              value="reviewed"
              variant="default"
              disabled={isPending}
            >
              Approve Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
