-- Two exam categories within each subject:
-- official = Official CSCA past papers
-- original = Cross-Line original exams
ALTER TABLE exams ADD COLUMN category TEXT NOT NULL DEFAULT 'original';

-- Existing Math and Physics papers are official CSCA past papers.
UPDATE exams
SET category = 'official',
    updated_at = datetime('now')
WHERE LOWER(COALESCE(subject, '')) IN ('physics', 'mathematics', 'math', 'maths');
