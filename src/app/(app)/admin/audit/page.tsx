// FILE: src/app/(app)/admin/audit/page.tsx
// Read-only view of the audit trail. Writes only ever happen through the guarded
// public.log_audit function, so nothing here can be edited.

import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireActiveProfile } from "@/lib/auth";
import { canViewAudit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Json } from "@/types/database";

export const metadata: Metadata = {
  title: "Audit log",
};

const AUDIT_LIMIT = 100;

/** Plain-language labels for the actions this app writes. Others fall back to the raw key. */
const ACTION_LABELS: Record<string, string> = {
  "approved_email.added": "Approved an email",
  "approved_email.updated": "Changed an approved email",
  "approved_email.revoked": "Revoked an approved email",
  "profile.activated": "Restored access",
  "profile.deactivated": "Paused access",
};

const ENTITY_LABELS: Record<string, string> = {
  approved_email: "Approved email",
  profile: "Profile",
  task: "Task",
  attendance_session: "Attendance session",
  attendance_record: "Attendance record",
};

function JsonBlock({ label, value }: { label: string; value: Json | null }) {
  if (value === null || value === undefined) return null;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-accent">
        {label}
      </summary>
      <pre className="scroll-thin mt-1.5 max-h-56 overflow-auto rounded-lg border border-border bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export default async function AuditPage() {
  const profile = await requireActiveProfile();

  if (!canViewAudit(profile.role)) {
    return (
      <NoAccess message="Only Faculty, the President, the Vice President, the Management Head and the Development Head can read the audit log." />
    );
  }

  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(AUDIT_LIMIT);

  const actorIds = Array.from(
    new Set((entries ?? []).map((entry) => entry.actor_id).filter((id): id is string => id !== null)),
  );

  // Two plain queries instead of an embedded join, so the row types stay simple.
  const actorNames = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds);

    for (const actor of actors ?? []) {
      actorNames.set(actor.id, actor.full_name);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description={`Role changes, access changes and other records of who changed what. Showing the ${AUDIT_LIMIT} most recent entries.`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" />
            Recent activity
          </CardTitle>
          <CardDescription>
            Entries are written by the server and stamped with the signed-in user. They cannot
            be edited or deleted from the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger/5 p-3.5 text-sm text-danger"
            >
              The audit log could not be loaded. Refresh the page to try again.
            </div>
          ) : (entries ?? []).length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No audit entries yet"
              description="Adding or editing an approved email, or pausing a member, will show up here."
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(entries ?? []).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(entry.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {entry.actor_id
                              ? actorNames.get(entry.actor_id) ?? "Unknown member"
                              : "System"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="accent">
                            {ACTION_LABELS[entry.action] ?? entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ENTITY_LABELS[entry.entity] ?? entry.entity}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <JsonBlock label="Before" value={entry.before} />
                          <JsonBlock label="After" value={entry.after} />
                          {entry.before === null && entry.after === null ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="space-y-3 md:hidden">
                {(entries ?? []).map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-border bg-surface-2/50 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant="accent">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm text-foreground">
                      {entry.actor_id
                        ? actorNames.get(entry.actor_id) ?? "Unknown member"
                        : "System"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ENTITY_LABELS[entry.entity] ?? entry.entity}
                    </p>
                    <JsonBlock label="Before" value={entry.before} />
                    <JsonBlock label="After" value={entry.after} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
