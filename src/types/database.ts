// FILE: src/types/database.ts
// Hand-written database types matching supabase/migrations/*.sql.

import type {
  AppRole,
  AttendanceFlag,
  AttendanceStatus,
  Department,
  Priority,
  ReviewStatus,
  SessionType,
  TaskStatus,
} from "@/lib/constants";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AttendanceMethod = "self" | "manual";

export type DailyReportStatus = "draft" | "submitted" | "reviewed" | "changes_requested";
export type SocialPostStatus = "draft" | "in_review" | "revisions_requested" | "approved" | "scheduled" | "published";

export type WorkEntryItem = {
  task_id?: string | null;
  task_title?: string | null;
  category: "task_work" | "meeting" | "cross_team_help" | "event_prep" | "other";
  description: string;
  duration_minutes: number;
  deliverable_urls?: string[];
  progress_notes?: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  department: Department | null;
  reporting_head_id?: string | null;
  co_head_department?: Department | null;
  joining_date?: string;
  account_status?: string;
  is_active: boolean;
  created_at: string;
};

export type ApprovedEmailRow = {
  email: string;
  full_name: string;
  role: AppRole;
  department: Department | null;
  reporting_head_id?: string | null;
  co_head_department?: Department | null;
  created_by: string | null;
  created_at: string;
};

export type PhaseRow = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  sort_order: number;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: Json;
  updated_at: string;
  updated_by: string | null;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  department: Department;
  owner_id: string;
  assigned_by: string | null;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  output: string | null;
  remarks: string | null;
  phase_id: string | null;
  blocked_by: string[];
  collaborator_ids?: string[];
  project_name?: string | null;
  acknowledged_at?: string | null;
  deliverable_requirements?: string | null;
  proof_urls?: string[];
  reassignment_reason?: string | null;
  extension_reason?: string | null;
  extended_deadline?: string | null;
  extension_status?: "none" | "requested" | "approved" | "rejected" | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type TaskCommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type TaskHistoryRow = {
  id: string;
  task_id: string;
  changed_by: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

export type AttendanceSessionRow = {
  id: string;
  title: string;
  type: SessionType;
  department: Department | null;
  starts_at: string;
  ends_at: string;
  grace_minutes: number;
  venue_name: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  radius_m: number;
  require_code: boolean;
  purpose?: string | null;
  created_by: string;
  created_at: string;
  closed_at: string | null;
};

export type AttendanceRecordRow = {
  id: string;
  session_id: string;
  member_id: string;
  status: AttendanceStatus;
  checked_in_at: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  distance_m: number | null;
  method: AttendanceMethod;
  marked_by: string | null;
  remark: string | null;
  flags: AttendanceFlag[];
  review: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type DailyReportRow = {
  id: string;
  user_id: string;
  report_date: string;
  summary: string;
  work_entries: WorkEntryItem[];
  other_work: string | null;
  total_time_minutes: number;
  proof_links: string[];
  blockers: string | null;
  next_priorities: string | null;
  optional_notes: string | null;
  is_excused: boolean;
  excused_reason: string | null;
  status: DailyReportStatus;
  submitted_at: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyReportHistoryRow = {
  id: string;
  report_id: string;
  changed_by: string | null;
  action: string;
  before: Json | null;
  after: Json | null;
  created_at: string;
};

export type SocialMediaPostRow = {
  id: string;
  title: string;
  campaign: string | null;
  platform: string;
  content_owner_id: string | null;
  designer_id: string | null;
  copywriter_id: string | null;
  reviewer_id: string | null;
  task_id: string | null;
  approval_deadline: string | null;
  publishing_deadline: string;
  status: SocialPostStatus;
  caption: string | null;
  creative_urls: string[];
  publication_url: string | null;
  proof_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: Json | null;
  after: Json | null;
  created_at: string;
};

type TableDef<Row, Insert, Update, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        {
          id: string;
          full_name: string;
          email: string;
          role?: AppRole;
          department?: Department | null;
          reporting_head_id?: string | null;
          co_head_department?: Department | null;
          joining_date?: string;
          account_status?: string;
          is_active?: boolean;
          created_at?: string;
        },
        {
          full_name?: string;
          email?: string;
          role?: AppRole;
          department?: Department | null;
          reporting_head_id?: string | null;
          co_head_department?: Department | null;
          account_status?: string;
          is_active?: boolean;
        }
      >;
      approved_emails: TableDef<
        ApprovedEmailRow,
        {
          email: string;
          full_name: string;
          role: AppRole;
          department?: Department | null;
          reporting_head_id?: string | null;
          co_head_department?: Department | null;
          created_by?: string | null;
          created_at?: string;
        },
        {
          full_name?: string;
          role?: AppRole;
          department?: Department | null;
          reporting_head_id?: string | null;
          co_head_department?: Department | null;
        }
      >;
      phases: TableDef<
        PhaseRow,
        {
          id?: string;
          name: string;
          starts_on: string;
          ends_on: string;
          sort_order?: number;
          created_at?: string;
        },
        {
          name?: string;
          starts_on?: string;
          ends_on?: string;
          sort_order?: number;
        }
      >;
      settings: TableDef<
        SettingRow,
        { key: string; value: Json; updated_at?: string; updated_by?: string | null },
        { value?: Json; updated_at?: string; updated_by?: string | null }
      >;
      tasks: TableDef<
        TaskRow,
        {
          id?: string;
          title: string;
          description?: string | null;
          department: Department;
          owner_id: string;
          assigned_by?: string | null;
          deadline: string;
          priority?: Priority;
          status?: TaskStatus;
          output?: string | null;
          remarks?: string | null;
          phase_id?: string | null;
          blocked_by?: string[];
          collaborator_ids?: string[];
          project_name?: string | null;
          acknowledged_at?: string | null;
          deliverable_requirements?: string | null;
          proof_urls?: string[];
          reassignment_reason?: string | null;
          extension_reason?: string | null;
          extended_deadline?: string | null;
          extension_status?: "none" | "requested" | "approved" | "rejected" | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        },
        {
          title?: string;
          description?: string | null;
          department?: Department;
          owner_id?: string;
          assigned_by?: string | null;
          deadline?: string;
          priority?: Priority;
          status?: TaskStatus;
          output?: string | null;
          remarks?: string | null;
          phase_id?: string | null;
          blocked_by?: string[];
          collaborator_ids?: string[];
          project_name?: string | null;
          acknowledged_at?: string | null;
          deliverable_requirements?: string | null;
          proof_urls?: string[];
          reassignment_reason?: string | null;
          extension_reason?: string | null;
          extended_deadline?: string | null;
          extension_status?: "none" | "requested" | "approved" | "rejected" | null;
          completed_at?: string | null;
        }
      >;
      daily_reports: TableDef<
        DailyReportRow,
        {
          id?: string;
          user_id: string;
          report_date: string;
          summary: string;
          work_entries?: WorkEntryItem[];
          other_work?: string | null;
          total_time_minutes?: number;
          proof_links?: string[];
          blockers?: string | null;
          next_priorities?: string | null;
          optional_notes?: string | null;
          is_excused?: boolean;
          excused_reason?: string | null;
          status?: DailyReportStatus;
          submitted_at?: string | null;
          reviewer_id?: string | null;
          reviewed_at?: string | null;
          review_comments?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          summary?: string;
          work_entries?: WorkEntryItem[];
          other_work?: string | null;
          total_time_minutes?: number;
          proof_links?: string[];
          blockers?: string | null;
          next_priorities?: string | null;
          optional_notes?: string | null;
          is_excused?: boolean;
          excused_reason?: string | null;
          status?: DailyReportStatus;
          submitted_at?: string | null;
          reviewer_id?: string | null;
          reviewed_at?: string | null;
          review_comments?: string | null;
        }
      >;
      daily_report_history: TableDef<
        DailyReportHistoryRow,
        {
          id?: string;
          report_id: string;
          changed_by?: string | null;
          action: string;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        },
        Record<string, never>
      >;
      social_media_posts: TableDef<
        SocialMediaPostRow,
        {
          id?: string;
          title: string;
          campaign?: string | null;
          platform: string;
          content_owner_id?: string | null;
          designer_id?: string | null;
          copywriter_id?: string | null;
          reviewer_id?: string | null;
          task_id?: string | null;
          approval_deadline?: string | null;
          publishing_deadline: string;
          status?: SocialPostStatus;
          caption?: string | null;
          creative_urls?: string[];
          publication_url?: string | null;
          proof_url?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          title?: string;
          campaign?: string | null;
          platform?: string;
          content_owner_id?: string | null;
          designer_id?: string | null;
          copywriter_id?: string | null;
          reviewer_id?: string | null;
          task_id?: string | null;
          approval_deadline?: string | null;
          publishing_deadline?: string;
          status?: SocialPostStatus;
          caption?: string | null;
          creative_urls?: string[];
          publication_url?: string | null;
          proof_url?: string | null;
        }
      >;
      task_comments: TableDef<
        TaskCommentRow,
        { id?: string; task_id: string; author_id: string; body: string; created_at?: string },
        { body?: string }
      >;
      task_history: TableDef<
        TaskHistoryRow,
        {
          id?: string;
          task_id: string;
          changed_by?: string | null;
          field: string;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        },
        Record<string, never>
      >;
      attendance_sessions: TableDef<
        AttendanceSessionRow,
        {
          id?: string;
          title: string;
          type: SessionType;
          department?: Department | null;
          starts_at: string;
          ends_at: string;
          grace_minutes?: number;
          venue_name?: string | null;
          venue_lat?: number | null;
          venue_lng?: number | null;
          radius_m?: number;
          require_code?: boolean;
          purpose?: string | null;
          created_by: string;
          created_at?: string;
          closed_at?: string | null;
        },
        {
          title?: string;
          type?: SessionType;
          department?: Department | null;
          starts_at?: string;
          ends_at?: string;
          grace_minutes?: number;
          venue_name?: string | null;
          venue_lat?: number | null;
          venue_lng?: number | null;
          radius_m?: number;
          require_code?: boolean;
          purpose?: string | null;
          closed_at?: string | null;
        }
      >;
      attendance_session_secrets: TableDef<
        { session_id: string; secret: string; created_at: string },
        { session_id: string; secret: string; created_at?: string },
        { secret?: string }
      >;
      attendance_records: TableDef<
        AttendanceRecordRow,
        {
          id?: string;
          session_id: string;
          member_id: string;
          status: AttendanceStatus;
          checked_in_at?: string | null;
          lat?: number | null;
          lng?: number | null;
          accuracy_m?: number | null;
          distance_m?: number | null;
          method?: AttendanceMethod;
          marked_by?: string | null;
          remark?: string | null;
          flags?: AttendanceFlag[];
          review?: ReviewStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        },
        {
          status?: AttendanceStatus;
          remark?: string | null;
          method?: AttendanceMethod;
          marked_by?: string | null;
          review?: ReviewStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        }
      >;
      audit_log: TableDef<
        AuditLogRow,
        {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        },
        Record<string, never>
      >;
      weekly_reports: TableDef<
        {
          id: string;
          author_id: string;
          department: Department;
          week_start: string;
          assigned: number;
          completed: number;
          pending: number;
          delayed: number;
          participation: string | null;
          attendance_rate: number;
          problems: string | null;
          support_needed: string | null;
          next_tasks: string | null;
          status_rag: "green" | "yellow" | "red";
          submitted_at: string;
          created_at: string;
        },
        {
          id?: string;
          author_id: string;
          department: Department;
          week_start: string;
          assigned?: number;
          completed?: number;
          pending?: number;
          delayed?: number;
          participation?: string | null;
          attendance_rate?: number;
          problems?: string | null;
          support_needed?: string | null;
          next_tasks?: string | null;
          status_rag?: "green" | "yellow" | "red";
          submitted_at?: string;
          created_at?: string;
        },
        {
          participation?: string | null;
          problems?: string | null;
          support_needed?: string | null;
          next_tasks?: string | null;
          status_rag?: "green" | "yellow" | "red";
        }
      >;
      contribution_ratings: TableDef<
        {
          id: string;
          member_id: string;
          rated_by: string;
          period: string;
          rating: number;
          major_contribution: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          member_id: string;
          rated_by: string;
          period: string;
          rating: number;
          major_contribution?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          rating?: number;
          major_contribution?: string | null;
          updated_at?: string;
        }
      >;
      notifications: TableDef<
        {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          message: string;
          link: string | null;
          read_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          kind: string;
          title: string;
          message: string;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        },
        {
          read_at?: string | null;
        }
      >;
      issues: TableDef<
        {
          id: string;
          title: string;
          description: string;
          severity: "low" | "medium" | "high" | "critical";
          department: Department;
          raised_by: string;
          current_level: "member" | "team_lead" | "management_head" | "president_vp" | "faculty";
          status: "open" | "escalated" | "resolved";
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description: string;
          severity?: "low" | "medium" | "high" | "critical";
          department: Department;
          raised_by: string;
          current_level?: "member" | "team_lead" | "management_head" | "president_vp" | "faculty";
          status?: "open" | "escalated" | "resolved";
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          severity?: "low" | "medium" | "high" | "critical";
          current_level?: "member" | "team_lead" | "management_head" | "president_vp" | "faculty";
          status?: "open" | "escalated" | "resolved";
          resolved_at?: string | null;
          updated_at?: string;
        }
      >;
      lectures: TableDef<
        {
          id: string;
          topic: string;
          speaker: string;
          starts_at: string;
          venue: string;
          stage: "topic" | "speaker" | "date" | "venue" | "preparation" | "lecture" | "review";
          checklist: Json;
          feedback_url: string | null;
          notes: string | null;
          session_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          topic: string;
          speaker: string;
          starts_at: string;
          venue: string;
          stage?: "topic" | "speaker" | "date" | "venue" | "preparation" | "lecture" | "review";
          checklist?: Json;
          feedback_url?: string | null;
          notes?: string | null;
          session_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          stage?: "topic" | "speaker" | "date" | "venue" | "preparation" | "lecture" | "review";
          checklist?: Json;
          feedback_url?: string | null;
          notes?: string | null;
          session_id?: string | null;
          updated_at?: string;
        },
        [
          {
            foreignKeyName: "lectures_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lectures_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "attendance_sessions";
            referencedColumns: ["id"];
          }
        ]
      >;
      problem_statements: TableDef<
        {
          id: string;
          title: string;
          source: string;
          status: "submitted" | "under_review" | "changes_requested" | "finalised";
          document_url: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          source: string;
          status?: "submitted" | "under_review" | "changes_requested" | "finalised";
          document_url?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          title?: string;
          source?: string;
          status?: "submitted" | "under_review" | "changes_requested" | "finalised";
          document_url?: string | null;
          notes?: string | null;
          updated_at?: string;
        },
        [
          {
            foreignKeyName: "problem_statements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ]
      >;
      teams: TableDef<
        {
          id: string;
          name: string;
          college: string;
          members: Json;
          status: "pending" | "confirmed" | "dropped";
          problem_statement_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          college: string;
          members?: Json;
          status?: "pending" | "confirmed" | "dropped";
          problem_statement_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          college?: string;
          members?: Json;
          status?: "pending" | "confirmed" | "dropped";
          problem_statement_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        },
        [
          {
            foreignKeyName: "teams_problem_statement_id_fkey";
            columns: ["problem_statement_id"];
            isOneToOne: false;
            referencedRelation: "problem_statements";
            referencedColumns: ["id"];
          }
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      log_audit: {
        Args: {
          p_action: string;
          p_entity: string;
          p_entity_id?: string | null;
          p_before?: Json | null;
          p_after?: Json | null;
        };
        Returns: undefined;
      };
      can_review_daily_report: {
        Args: { p_report_user_id: string; p_report_dept: Department };
        Returns: boolean;
      };
      checkin_coordinates: {
        Args: { p_session_id: string };
        Returns: {
          checked_in_member_id: string;
          latitude: number | null;
          longitude: number | null;
        }[];
      };
      is_active_member: { Args: Record<string, never>; Returns: boolean };
      auth_role: { Args: Record<string, never>; Returns: AppRole };
      auth_department: { Args: Record<string, never>; Returns: Department | null };
      can_manage_users: { Args: Record<string, never>; Returns: boolean };
      can_view_audit: { Args: Record<string, never>; Returns: boolean };
      sync_delayed_tasks: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: {
      app_role: AppRole;
      department: Department;
      task_status: TaskStatus;
      priority: Priority;
      session_type: SessionType;
      attendance_status: AttendanceStatus;
      attendance_method: AttendanceMethod;
      attendance_flag: AttendanceFlag;
      review_status: ReviewStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
