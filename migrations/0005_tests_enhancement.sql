-- Migration: 0005_tests_enhancement
-- Enhances tests table for Phase 1 PDF-based Tests CMS.
-- Safe column additions without altering the questions table.

ALTER TABLE tests ADD COLUMN external_url TEXT;
ALTER TABLE tests ADD COLUMN download_url TEXT;
ALTER TABLE tests ADD COLUMN thumbnail_url TEXT;
ALTER TABLE tests ADD COLUMN description TEXT;
ALTER TABLE tests ADD COLUMN chapter TEXT;
ALTER TABLE tests ADD COLUMN medium TEXT DEFAULT 'Gujarati';
ALTER TABLE tests ADD COLUMN difficulty TEXT DEFAULT 'Medium';
ALTER TABLE tests ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE tests ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_tests_display_order ON tests(display_order);
