-- Migration: 0004_blog_rich_content  
-- Adds content_rich column to blog_posts for Tiptap rich text HTML storage.  
-- The existing content_markdown column is preserved for backward compatibility.  
-- content_rich takes priority on the public article page when present.  
  
ALTER TABLE blog_posts ADD COLUMN content_rich TEXT; 
