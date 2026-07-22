ALTER TABLE exams ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE exams ADD COLUMN archived_at TEXT;
CREATE INDEX IF NOT EXISTS idx_exams_publication ON exams(is_published, archived_at, created_at);
