CREATE TABLE IF NOT EXISTS student_plans (
  user_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  mock_limit INTEGER NOT NULL DEFAULT 0,
  granted_by TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS student_mock_unlocks (
  user_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, exam_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_plans_updated ON student_plans(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_mock_unlocks_user ON student_mock_unlocks(user_id, unlocked_at);
