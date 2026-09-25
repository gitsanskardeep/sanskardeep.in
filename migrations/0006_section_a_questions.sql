-- Migration: 0006_section_a_questions
-- Extends the questions table to support Section-A Question Tests.
-- Preserves backward compatibility with existing tests and questions.

ALTER TABLE questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'mcq';
ALTER TABLE questions ADD COLUMN question_source TEXT NOT NULL DEFAULT 'text';
ALTER TABLE questions ADD COLUMN image_data TEXT;
ALTER TABLE questions ADD COLUMN image_alt_text TEXT;
ALTER TABLE questions ADD COLUMN correct_answer_text TEXT;
ALTER TABLE questions ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- Indexes for efficient question retrieval and ordering within a test
CREATE INDEX IF NOT EXISTS idx_questions_test_order ON questions(test_id, display_order);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
