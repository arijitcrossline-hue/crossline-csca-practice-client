CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  context TEXT,
  app_version TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status_created ON bug_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_created ON bug_reports(user_id, created_at DESC);
