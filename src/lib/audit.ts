// FILE: src/lib/audit.ts
// Audit trail writes.
//
// Rows are inserted through the SECURITY DEFINER function public.log_audit, which always
// stamps the real caller as the actor. Clients have no INSERT permission on audit_log at
// all, so an audit entry cannot be forged from the browser.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type AuditEntity =
  | "approved_email"
  | "profile"
  | "task"
  | "attendance_session"
  | "attendance_record"
  | "lecture"
  | "problem_statement"
  | "team"
  | "weekly_report"
  | "issue";

export type AuditEntry = {
  action: string;
  entity: AuditEntity;
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
};

export async function writeAudit(
  supabase: SupabaseClient<Database>,
  entry: AuditEntry,
): Promise<void> {
  const { error } = await supabase.rpc("log_audit", {
    p_action: entry.action,
    p_entity: entry.entity,
    p_entity_id: entry.entityId ?? null,
    p_before: entry.before ?? null,
    p_after: entry.after ?? null,
  });

  if (error) {
    // Deliberately logs only the action and the database message: never row contents,
    // coordinates, tokens or keys.
    console.error(`[audit] failed to record ${entry.entity}.${entry.action}: ${error.message}`);
  }
}
