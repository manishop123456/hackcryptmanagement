-- Migration: 0016_hackcrypt.sql
-- Description: Create problem_statements and teams tables for HackCrypt 2027-28 module

CREATE TYPE ps_status AS ENUM ('submitted', 'under_review', 'changes_requested', 'finalised');
CREATE TYPE team_status AS ENUM ('pending', 'confirmed', 'dropped');

CREATE TABLE IF NOT EXISTS problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  status ps_status NOT NULL DEFAULT 'submitted',
  document_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  college TEXT NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  status team_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_select_all" ON problem_statements FOR SELECT USING (TRUE);
CREATE POLICY "ps_write_heads" ON problem_statements FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead')
);
CREATE POLICY "ps_update_heads" ON problem_statements FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead')
);

CREATE POLICY "teams_select_all" ON teams FOR SELECT USING (TRUE);
CREATE POLICY "teams_write_heads" ON teams FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead')
);
CREATE POLICY "teams_update_heads" ON teams FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead')
);
