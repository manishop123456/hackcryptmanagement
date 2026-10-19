-- Migration: 0014_issues.sql
-- Description: Create issues table for issue tracking and multi-tier escalation chain

CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status AS ENUM ('open', 'escalated', 'resolved');
CREATE TYPE escalation_level AS ENUM ('member', 'team_lead', 'management_head', 'president_vp', 'faculty');

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity issue_severity NOT NULL DEFAULT 'medium',
  department department NOT NULL,
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_level escalation_level NOT NULL DEFAULT 'team_lead',
  status issue_status NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated active profiles can view issues
CREATE POLICY "issues_select_policy"
  ON issues FOR SELECT
  USING (
    raised_by = auth.uid()
    OR department = (SELECT department FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'faculty', 'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
    )
  );

-- Any active member can raise an issue
CREATE POLICY "issues_insert_policy"
  ON issues FOR INSERT
  WITH CHECK (raised_by = auth.uid());

-- Author, assigned leads, or core can update status/escalate issues
CREATE POLICY "issues_update_policy"
  ON issues FOR UPDATE
  USING (
    raised_by = auth.uid()
    OR department = (SELECT department FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'faculty', 'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_issues_status_level ON issues(status, current_level);
