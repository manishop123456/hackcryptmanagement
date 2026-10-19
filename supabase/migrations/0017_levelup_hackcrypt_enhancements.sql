-- Migration: 0017_levelup_hackcrypt_enhancements.sql
-- Description: Enhancements for Level Up and HackCrypt modules (FK links, delete policies, indexes)

-- Add problem_statement_id reference to teams table
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS problem_statement_id UUID REFERENCES problem_statements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS teams_ps_id_idx ON teams(problem_statement_id);
CREATE INDEX IF NOT EXISTS lectures_created_by_idx ON lectures(created_by);
CREATE INDEX IF NOT EXISTS lectures_session_id_idx ON lectures(session_id);
CREATE INDEX IF NOT EXISTS ps_created_by_idx ON problem_statements(created_by);

-- Delete policies for lectures
CREATE POLICY "lectures_delete_heads"
  ON lectures FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead'
    )
  );

-- Delete policies for problem_statements
CREATE POLICY "ps_delete_heads"
  ON problem_statements FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead'
    )
  );

-- Delete policies for teams
CREATE POLICY "teams_delete_heads"
  ON teams FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN (
      'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head', 'team_lead'
    )
  );
