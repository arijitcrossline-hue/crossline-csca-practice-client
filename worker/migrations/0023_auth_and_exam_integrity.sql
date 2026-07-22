ALTER TABLE email_verifications ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE password_resets ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exam_sessions ADD COLUMN pairing_expires_at TEXT;
ALTER TABLE exam_sessions ADD COLUMN deadline_at TEXT;
ALTER TABLE exam_sessions ADD COLUMN exam_snapshot_json TEXT;

UPDATE exam_sessions
   SET pairing_expires_at = datetime(created_at, '+20 minutes')
 WHERE pairing_expires_at IS NULL;
