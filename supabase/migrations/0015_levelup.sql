-- Migration: 0015_levelup.sql
-- Description: Create lectures table for Level Up lecture pipeline and checklists

CREATE TYPE lecture_stage AS ENUM ('topic', 'speaker', 'date', 'venue', 'preparation', 'lecture', 'review');

CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  speaker TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  stage lecture_stage NOT NULL DEFAULT 'topic',
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback_url TEXT,
  notes TEXT,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectures_select_all"
  ON lectures FOR SELECT
  USING (TRUE);

CREATE POLICY "lectures_write_heads"
  ON lectures FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead'
    )
  );

CREATE POLICY "lectures_update_heads"
  ON lectures FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead'
    )
  );
