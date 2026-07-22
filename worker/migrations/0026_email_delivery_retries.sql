ALTER TABLE exam_sessions ADD COLUMN result_email_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exam_sessions ADD COLUMN result_email_last_error TEXT;
ALTER TABLE exam_sessions ADD COLUMN result_email_failed_at TEXT;
