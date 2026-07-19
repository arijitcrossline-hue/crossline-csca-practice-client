ALTER TABLE exams ADD COLUMN is_free_sample INTEGER NOT NULL DEFAULT 0;

UPDATE exams
   SET is_free_sample = CASE
     WHEN id = (
       SELECT id
         FROM exams
        WHERE is_published = 1 AND category = 'official'
        ORDER BY created_at ASC
        LIMIT 1
     ) THEN 1
     ELSE 0
   END;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_exam_submitted
  ON exam_sessions(user_id, exam_id, submitted_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_single_free_sample
  ON exams(is_free_sample)
  WHERE is_free_sample = 1;
