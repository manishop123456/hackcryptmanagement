-- Migration: 0011_weekly_reviews.sql
-- Description: Create weekly_reports table for weekly reviews and department status RAG

CREATE TYPE review_rag_status AS ENUM ('green', 'yellow', 'red');

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department department NOT NULL,
  week_start DATE NOT NULL,
  assigned INT NOT NULL DEFAULT 0,
  completed INT NOT NULL DEFAULT 0,
  pending INT NOT NULL DEFAULT 0,
  delayed INT NOT NULL DEFAULT 0,
  participation TEXT,
  attendance_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  problems TEXT,
  support_needed TEXT,
  next_tasks TEXT,
  status_rag review_rag_status NOT NULL DEFAULT 'green',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Read policy: Members can view their own, Leads view their department, Managers/Core/Faculty view all
CREATE POLICY "weekly_reports_select_scope"
  ON weekly_reports FOR SELECT
  USING (
    author_id = auth.uid()
    OR department = (SELECT department FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'faculty', 'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
    )
  );

-- 2. Insert policy: Team Leads, Heads, Pres/VP can insert for their authorized scope
CREATE POLICY "weekly_reports_insert_scope"
  ON weekly_reports FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      department = (SELECT department FROM profiles WHERE id = auth.uid())
      OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
        'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
      )
    )
  );

-- 3. Update policy: Author or Core can update
CREATE POLICY "weekly_reports_update_scope"
  ON weekly_reports FOR UPDATE
  USING (
    author_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reports_dept ON weekly_reports(department);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start);
