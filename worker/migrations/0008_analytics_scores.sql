ALTER TABLE exam_sessions ADD COLUMN score_earned REAL;
ALTER TABLE exam_sessions ADD COLUMN score_total REAL;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_leaderboard
  ON exam_sessions(exam_id, score_earned DESC, score_total DESC);
