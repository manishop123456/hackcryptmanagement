-- Migration: 0012_contribution.sql
-- Description: Create contribution_ratings table for lead rating component of member contribution formula

CREATE TABLE IF NOT EXISTS contribution_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- e.g. "2026-W42" or "Phase 1"
  rating INT NOT NULL CHECK (rating >= 0 AND rating <= 100),
  major_contribution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, period)
);

-- Enable RLS
ALTER TABLE contribution_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Read: Members view their own ratings; Leads view department members; Core/Faculty view all
CREATE POLICY "contribution_ratings_select_scope"
  ON contribution_ratings FOR SELECT
  USING (
    member_id = auth.uid()
    OR (SELECT department FROM profiles WHERE id = member_id) = (SELECT department FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'faculty', 'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
    )
  );

-- 2. Insert/Update: Leads for department members, or Core for any member
CREATE POLICY "contribution_ratings_write_scope"
  ON contribution_ratings FOR INSERT
  WITH CHECK (
    rated_by = auth.uid()
    AND (
      (SELECT department FROM profiles WHERE id = member_id) = (SELECT department FROM profiles WHERE id = auth.uid())
      OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
        'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
      )
    )
  );

CREATE POLICY "contribution_ratings_update_scope"
  ON contribution_ratings FOR UPDATE
  USING (
    rated_by = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contribution_ratings_member ON contribution_ratings(member_id);
