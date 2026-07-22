CREATE TABLE IF NOT EXISTS legal_acceptances (
  user_id TEXT NOT NULL,
  version TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  PRIMARY KEY (user_id, version),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  user_id TEXT PRIMARY KEY,
  requested_at TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_due ON account_deletion_requests(scheduled_for);
