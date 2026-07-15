ALTER TABLE users ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE exam_sessions ADD COLUMN result_released_at TEXT;

UPDATE exam_sessions
   SET result_released_at = COALESCE(result_emailed_at, submitted_at)
 WHERE submitted_at IS NOT NULL
   AND result_released_at IS NULL;
