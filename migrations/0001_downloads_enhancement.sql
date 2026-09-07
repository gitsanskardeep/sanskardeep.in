-- Migration 0001: Enhancement for Downloads Table (Support External URLs & Metadata)

ALTER TABLE downloads ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE downloads ADD COLUMN description TEXT;
ALTER TABLE downloads ADD COLUMN external_url TEXT NOT NULL DEFAULT 'https://drive.google.com';
ALTER TABLE downloads ADD COLUMN download_url TEXT;
ALTER TABLE downloads ADD COLUMN thumbnail_url TEXT;
ALTER TABLE downloads ADD COLUMN status TEXT NOT NULL DEFAULT 'published'; -- 'draft', 'published'
ALTER TABLE downloads ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE downloads ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Seed Sample Downloads Data into D1 Table
INSERT OR IGNORE INTO downloads (id, class_id, subject_id, category_id, title, description, external_url, file_type, file_size_bytes, status, display_order, download_count) VALUES
(1, 2, NULL, 4, 'Std 10 GSEB Board Model Paper Set 2026 (All Subjects PDF)', 'Official Gujarat Board Std 10 SSC model question paper set with complete blueprints and marking scheme.', 'https://drive.google.com', 'PDF Document', 5033164, 'published', 1, 12450),
(2, 7, NULL, 3, 'Std 12 General Stream GSEB Official Blueprint & Syllabus 2025-26', 'Official HSC Commerce & General stream chapter-wise mark distribution blueprint and updated syllabus copy.', 'https://drive.google.com', 'PDF Document', 2202009, 'published', 2, 8920),
(3, 6, NULL, 6, 'Std 12 Science Physics & Chemistry Most IMP Reaction & Formula Chart', 'Handwritten quick formula cheat-sheet and important chemical reactions for HSC Science board preparation.', 'https://drive.google.com', 'PDF Document', 3670016, 'published', 3, 15100),
(4, 1, NULL, 4, 'Std 9 Science & Maths Half-Yearly Sample Question Papers', 'Practice question papers with solution keys for Std 9 mid-term examinations.', 'https://drive.google.com', 'PDF Document', 1992294, 'published', 4, 6300);
