-- Migration: 0002_study_materials_enhancement
-- Adds external URL, chapter/topic, thumbnail, and display_order columns.
-- Uses ADD COLUMN (safe — only applies once per column).

ALTER TABLE study_materials ADD COLUMN external_url TEXT;
ALTER TABLE study_materials ADD COLUMN download_url TEXT;
ALTER TABLE study_materials ADD COLUMN thumbnail_url TEXT;
ALTER TABLE study_materials ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE study_materials ADD COLUMN chapter TEXT;
