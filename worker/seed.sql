INSERT OR IGNORE INTO exams (id, title, description, duration_minutes, is_published, created_at, updated_at)
VALUES
  ('math-physics', 'CSCA Mathematics and Physics Mock', 'Full practice paper covering mathematics and physics fundamentals.', 90, 1, datetime('now'), datetime('now')),
  ('math-short', 'CSCA Mathematics Quick Practice', 'A shorter warm-up paper for testing the examination workflow.', 35, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO questions (id, exam_id, position, type, instruction, text, answers_json, diagram, created_at, updated_at)
VALUES
  ('math-physics-q1', 'math-physics', 1, 'Single choice', 'Each question has four options, among which only one is correct.', 'As shown in the figure, if two objects A and B with equal mass are placed on a horizontal disk rotating uniformly around the vertical axis, and the two objects remain stationary relative to the disk, then ( )', '["the angular velocity of A is the same as B","the angular velocity of A is greater than that of B","the linear velocity of A is the same as B","the angular velocity of A is smaller than that of B"]', 1, datetime('now'), datetime('now')),
  ('math-physics-q2', 'math-physics', 2, 'Single choice', 'Choose the best answer.', 'A particle moves with constant acceleration. Its velocity changes from 2 m/s to 10 m/s in 4 seconds. What is its acceleration?', '["1 m/s²","2 m/s²","3 m/s²","4 m/s²"]', 0, datetime('now'), datetime('now')),
  ('math-physics-q3', 'math-physics', 3, 'Single choice', 'Choose the best answer.', 'Which expression is equivalent to (x + 3)(x - 3)?', '["x² - 9","x² + 9","x² - 6x + 9","x² + 6x + 9"]', 0, datetime('now'), datetime('now')),
  ('math-physics-q4', 'math-physics', 4, 'Single choice', 'Choose the best answer.', 'If f(x) = 2x + 1, what is the value of f(4)?', '["7","8","9","10"]', 0, datetime('now'), datetime('now')),
  ('math-short-q1', 'math-short', 1, 'Single choice', 'Choose the best answer.', 'A particle moves with constant acceleration. Its velocity changes from 2 m/s to 10 m/s in 4 seconds. What is its acceleration?', '["1 m/s²","2 m/s²","3 m/s²","4 m/s²"]', 0, datetime('now'), datetime('now')),
  ('math-short-q2', 'math-short', 2, 'Single choice', 'Choose the best answer.', 'Which expression is equivalent to (x + 3)(x - 3)?', '["x² - 9","x² + 9","x² - 6x + 9","x² + 6x + 9"]', 0, datetime('now'), datetime('now')),
  ('math-short-q3', 'math-short', 3, 'Single choice', 'Choose the best answer.', 'If f(x) = 2x + 1, what is the value of f(4)?', '["7","8","9","10"]', 0, datetime('now'), datetime('now'));

UPDATE questions SET subject = 'Physics', chapter = 'Circular motion', topic = 'Angular and linear velocity', correct_index = 0, marks = 2, explanation_text = 'Objects fixed to the same rigidly rotating disk have the same angular velocity.' WHERE id = 'math-physics-q1';
UPDATE questions SET subject = 'Physics', chapter = 'Kinematics', topic = 'Constant acceleration', correct_index = 1, marks = 2, explanation_text = 'Use a = (v - u) / t = (10 - 2) / 4 = 2 m/s².' WHERE id IN ('math-physics-q2', 'math-short-q1');
UPDATE questions SET subject = 'Mathematics', chapter = 'Algebra', topic = 'Difference of squares', correct_index = 0, marks = 2, explanation_text = 'Use a² - b² = (a - b)(a + b).' WHERE id IN ('math-physics-q3', 'math-short-q2');
UPDATE questions SET subject = 'Mathematics', chapter = 'Functions', topic = 'Function evaluation', correct_index = 2, marks = 2, explanation_text = 'Substitute x = 4 to get 2(4) + 1 = 9.' WHERE id IN ('math-physics-q4', 'math-short-q3');
