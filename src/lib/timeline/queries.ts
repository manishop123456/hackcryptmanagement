// FILE: src/lib/timeline/queries.ts
// Real database query helpers to compile chronological activity feed across tasks, attendance, phases, and audit logs.

import { createClient } from "@/lib/supabase/server";

export type TimelineEventType = "task" | "attendance" | "phase" | "audit";

export interface TimelineItem {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  actorName?: string;
  actorRole?: string;
  badgeText?: string;
  link?: string;
}

export async function getTimelineEvents(limit = 50): Promise<TimelineItem[]> {
  const supabase = await createClient();

  // 1. Fetch Task History
  const { data: taskHistory } = await supabase
    .from("task_history")
    .select(`
      id,
      field,
      old_value,
      new_value,
      created_at,
      changed_by,
      task:tasks(id, title, department)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  // 2. Fetch Attendance Sessions
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select(`
      id,
      title,
      type,
      department,
      starts_at,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  // 3. Fetch Phases
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .order("sort_order", { ascending: true });

  // 4. Fetch Audit Logs
  const { data: auditLogs } = await supabase
    .from("audit_log")
    .select(`
      id,
      action,
      entity,
      entity_id,
      created_at,
      actor:profiles!audit_log_actor_id_fkey(full_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  const items: TimelineItem[] = [];

  // Map Task History
  if (taskHistory) {
    for (const h of taskHistory) {
      const taskTitle = (h.task as unknown as { title: string } | null)?.title || "Task";
      const taskId = (h.task as unknown as { id: string } | null)?.id;

      let desc = `Updated ${h.field}`;
      if (h.field === "status") {
        desc = `Status changed from '${h.old_value || "not_started"}' to '${h.new_value}'`;
      } else if (h.field === "owner_id") {
        desc = `Reassigned task owner`;
      }

      items.push({
        id: `th-${h.id}`,
        type: "task",
        title: `Task: ${taskTitle}`,
        description: desc,
        timestamp: h.created_at,
        badgeText: h.field.toUpperCase(),
        link: taskId ? `/tasks/${taskId}` : "/tasks",
      });
    }
  }

  // Map Attendance Sessions
  if (sessions) {
    for (const s of sessions) {
      items.push({
        id: `att-${s.id}`,
        type: "attendance",
        title: `Attendance Session: ${s.title}`,
        description: `Session type: ${s.type.replace("_", " ")} (${s.department ? s.department.toUpperCase() : "ALL DEPTS"})`,
        timestamp: s.created_at,
        badgeText: s.type.toUpperCase(),
        link: `/attendance/${s.id}`,
      });
    }
  }

  // Map Phases
  if (phases) {
    for (const p of phases) {
      items.push({
        id: `phase-${p.id}`,
        type: "phase",
        title: `Phase: ${p.name}`,
        description: `Scheduled from ${p.starts_on} to ${p.ends_on}`,
        timestamp: `${p.starts_on}T00:00:00Z`,
        badgeText: "PHASE",
        link: "/#phases",
      });
    }
  }

  // Map Audit Logs
  if (auditLogs) {
    for (const a of auditLogs) {
      const actor = a.actor as unknown as { full_name: string; role: string } | null;
      items.push({
        id: `audit-${a.id}`,
        type: "audit",
        title: `Audit: ${a.action.replace("_", " ").toUpperCase()}`,
        description: `Action on ${a.entity} (${a.entity_id})`,
        timestamp: a.created_at,
        actorName: actor?.full_name || "System",
        actorRole: actor?.role,
        badgeText: "SECURITY",
        link: "/admin/audit",
      });
    }
  }

  // Sort descending by timestamp
  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
