import type { BlogPostRecord } from '../db/schema';
import { BLOG_POSTS } from '../data/portalData';
import { getClasses, getCategories } from './downloads';

export type { BlogPostRecord };
export { getClasses, getCategories };

type D1Database = import('@cloudflare/workers-types').D1Database;

export interface CreateBlogPostDTO {
  slug: string;
  title_english: string;
  title_gujarati?: string | null;
  category: string;
  category_id?: number | null;
  class_id?: number | null;
  summary: string;
  content_markdown?: string | null;
  thumbnail_url?: string | null;
  read_time?: string | null;
  status?: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  display_order?: number;
}

export interface UpdateBlogPostDTO extends CreateBlogPostDTO {
  id: number;
}

/**
 * Generates an educational blog post slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fallback blog posts based on static portalData.ts
 */
function getStaticBlogFallback(): BlogPostRecord[] {
  return BLOG_POSTS.map((item, index) => ({
    id: index + 1,
    slug: `post-${item.id}`,
    title_english: item.title,
    title_gujarati: item.titleGujarati,
    category: item.category,
    summary: item.summary,
    content_markdown: `# ${item.title}\n\n${item.summary}\n\n## Overview\n\nGujarat Secondary and Higher Secondary Education Board (GSEB) syllabus requires structured preparation and regular practice.\n\n### Key Preparation Tips\n- Consistent revision of formulas and blueprints.\n- Regular solving of previous years' board papers.\n- Proper time distribution during examinations.`,
    cover_image_r2_key: null,
    read_time: item.readTime,
    status: 'published',
    published_at: item.date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    class_id: null,
    category_id: null,
    thumbnail_url: item.image,
    display_order: index + 1,
    className: undefined,
    categoryName: item.category
  }));
}

/**
 * Fetches published blog posts from D1 database for public listing.
 */
export async function getPublishedBlogPosts(db?: D1Database): Promise<BlogPostRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT 
          b.*,
          c.title_english as className,
          cat.title_english as categoryName
        FROM blog_posts b
        LEFT JOIN classes c ON b.class_id = c.id
        LEFT JOIN categories cat ON b.category_id = cat.id
        WHERE b.status = 'published'
        ORDER BY b.display_order ASC, b.id DESC
      `).all<BlogPostRecord>();

      if (results && results.length > 0) {
        return results;
      }
    } catch (e) {
      console.warn('D1 published blog_posts query warning, falling back to static data:', e);
    }
  }

  return getStaticBlogFallback();
}

/**
 * Fetches all blog posts (published + drafts) for Admin dashboard.
 */
export async function getAllAdminBlogPosts(db?: D1Database): Promise<BlogPostRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT 
          b.*,
          c.title_english as className,
          cat.title_english as categoryName
        FROM blog_posts b
        LEFT JOIN classes c ON b.class_id = c.id
        LEFT JOIN categories cat ON b.category_id = cat.id
        ORDER BY b.display_order ASC, b.id DESC
      `).all<BlogPostRecord>();

      if (results) {
        return results;
      }
    } catch (e) {
      console.warn('D1 admin blog_posts query warning:', e);
    }
  }

  return getStaticBlogFallback();
}

/**
 * Fetches a single blog post by slug for the public article page.
 */
export async function getBlogPostBySlug(db: D1Database | undefined, slug: string): Promise<BlogPostRecord | null> {
  if (db) {
    try {
      const item = await db.prepare(`
        SELECT 
          b.*,
          c.title_english as className,
          cat.title_english as categoryName
        FROM blog_posts b
        LEFT JOIN classes c ON b.class_id = c.id
        LEFT JOIN categories cat ON b.category_id = cat.id
        WHERE b.slug = ? AND b.status = 'published'
        LIMIT 1
      `).bind(slug).first<BlogPostRecord>();

      if (item) return item;
    } catch (e) {
      console.warn('Failed to fetch blog post by slug from D1:', e);
    }
  }

  // Fallback to static items
  const staticItem = getStaticBlogFallback().find(p => p.slug === slug);
  return staticItem || null;
}

/**
 * Fetches a single blog post by ID for Admin editing.
 */
export async function getBlogPostById(db: D1Database, id: number): Promise<BlogPostRecord | null> {
  try {
    const item = await db.prepare(`
      SELECT 
        b.*,
        c.title_english as className,
        cat.title_english as categoryName
      FROM blog_posts b
      LEFT JOIN classes c ON b.class_id = c.id
      LEFT JOIN categories cat ON b.category_id = cat.id
      WHERE b.id = ?
    `).bind(id).first<BlogPostRecord>();

    return item || null;
  } catch (e) {
    console.warn('Failed to fetch blog post by ID:', e);
    return null;
  }
}

/**
 * Creates a new blog post in D1.
 */
export async function createBlogPost(db: D1Database, dto: CreateBlogPostDTO): Promise<boolean> {
  const result = await db.prepare(`
    INSERT INTO blog_posts (
      slug, title_english, title_gujarati, category, category_id,
      class_id, summary, content_markdown, thumbnail_url, read_time,
      status, published_at, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    dto.slug,
    dto.title_english,
    dto.title_gujarati || null,
    dto.category,
    dto.category_id || null,
    dto.class_id || null,
    dto.summary,
    dto.content_markdown || null,
    dto.thumbnail_url || null,
    dto.read_time || '5 min read',
    dto.status || 'published',
    dto.published_at || new Date().toISOString().split('T')[0],
    dto.display_order ?? 0
  ).run();

  return result.success;
}

/**
 * Updates an existing blog post in D1.
 */
export async function updateBlogPost(db: D1Database, dto: UpdateBlogPostDTO): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE blog_posts SET
      slug = ?,
      title_english = ?,
      title_gujarati = ?,
      category = ?,
      category_id = ?,
      class_id = ?,
      summary = ?,
      content_markdown = ?,
      thumbnail_url = ?,
      read_time = ?,
      status = ?,
      published_at = ?,
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    dto.slug,
    dto.title_english,
    dto.title_gujarati || null,
    dto.category,
    dto.category_id || null,
    dto.class_id || null,
    dto.summary,
    dto.content_markdown || null,
    dto.thumbnail_url || null,
    dto.read_time || '5 min read',
    dto.status || 'published',
    dto.published_at || null,
    dto.display_order ?? 0,
    dto.id
  ).run();

  return result.success;
}

/**
 * Toggles status between 'published' and 'draft'.
 */
export async function toggleBlogPostStatus(db: D1Database, id: number, newStatus: 'published' | 'draft'): Promise<boolean> {
  const result = await db.prepare(
    `UPDATE blog_posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(newStatus, id).run();

  return result.success;
}

/**
 * Permanently deletes a blog post by ID.
 */
export async function deleteBlogPost(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare(
    `DELETE FROM blog_posts WHERE id = ?`
  ).bind(id).run();

  return result.success;
}
