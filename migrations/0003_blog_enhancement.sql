-- Migration: 0003_blog_enhancement
-- Enhances blog_posts table with class_id, category_id, thumbnail_url, and display_order.

ALTER TABLE blog_posts ADD COLUMN class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN thumbnail_url TEXT;
ALTER TABLE blog_posts ADD COLUMN display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_blog_display_order ON blog_posts(display_order);
CREATE INDEX IF NOT EXISTS idx_blog_class ON blog_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category_id);
