import type { DownloadRecord } from '../db/schema';
import { DOWNLOADS_DATA, CLASSES_DATA } from '../data/portalData';

type D1Database = import('@cloudflare/workers-types').D1Database;

export interface CreateDownloadDTO {
  title: string;
  class_id?: number | null;
  subject_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  external_url: string;
  download_url?: string | null;
  thumbnail_url?: string | null;
  file_type?: string;
  file_size_bytes?: number;
  status?: 'draft' | 'published';
  display_order?: number;
}

export interface UpdateDownloadDTO extends CreateDownloadDTO {
  id: number;
}

export interface ClassOption {
  id: number;
  title_english: string;
}

export interface CategoryOption {
  id: number;
  title_english: string;
}

export interface SubjectOption {
  id: number;
  class_id?: number;
  name_english: string;
}

/**
 * Fetches published downloads from D1 database.
 * Fallbacks to portalData.ts static data if D1 is unavailable.
 */
export async function getPublishedDownloads(db?: D1Database): Promise<DownloadRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT 
          d.*,
          c.title_english as className,
          s.name_english as subjectName,
          cat.title_english as categoryName
        FROM downloads d
        LEFT JOIN classes c ON d.class_id = c.id
        LEFT JOIN subjects s ON d.subject_id = s.id
        LEFT JOIN categories cat ON d.category_id = cat.id
        WHERE d.status = 'published'
        ORDER BY d.display_order ASC, d.id DESC
      `).all<DownloadRecord>();

      if (results) {
        return results;
      }
    } catch (e) {
      console.warn('D1 downloads query warning, falling back to static data:', e);
    }
  }

  // Fallback mapping from portalData.ts
  return DOWNLOADS_DATA.map((item, index) => {
    const classMatch = CLASSES_DATA.find(c => c.standard.includes(item.standard)) || CLASSES_DATA[0];
    return {
      id: index + 1,
      class_id: null,
      subject_id: null,
      category_id: null,
      title: item.title,
      description: `Official Gujarat Board ${item.standard} study document and question paper set.`,
      external_url: 'https://drive.google.com',
      download_url: null,
      thumbnail_url: null,
      file_type: item.fileType,
      pdf_r2_key: null,
      file_size_bytes: 3500000,
      status: 'published',
      display_order: index + 1,
      download_count: parseInt(item.downloadCount.replace(/[^0-9]/g, '')) || 5000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      className: item.standard,
      subjectName: item.subject,
      categoryName: 'PDF Resource'
    };
  });
}

/**
 * Fetches all downloads (published & draft) for Admin dashboard.
 */
export async function getAllAdminDownloads(db?: D1Database): Promise<DownloadRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT 
          d.*,
          c.title_english as className,
          s.name_english as subjectName,
          cat.title_english as categoryName
        FROM downloads d
        LEFT JOIN classes c ON d.class_id = c.id
        LEFT JOIN subjects s ON d.subject_id = s.id
        LEFT JOIN categories cat ON d.category_id = cat.id
        ORDER BY d.display_order ASC, d.id DESC
      `).all<DownloadRecord>();

      if (results) {
        return results;
      }
    } catch (e) {
      console.warn('D1 admin downloads query warning:', e);
    }
  }

  // Fallback to published array if DB offline
  return getPublishedDownloads(db);
}

/**
 * Fetches a single download record by ID.
 */
export async function getDownloadById(db: D1Database, id: number): Promise<DownloadRecord | null> {
  try {
    const item = await db.prepare(`
      SELECT 
        d.*,
        c.title_english as className,
        s.name_english as subjectName,
        cat.title_english as categoryName
      FROM downloads d
      LEFT JOIN classes c ON d.class_id = c.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      LEFT JOIN categories cat ON d.category_id = cat.id
      WHERE d.id = ?
    `).bind(id).first<DownloadRecord>();

    return item || null;
  } catch (e) {
    console.warn('Failed to fetch download by ID:', e);
    return null;
  }
}

/**
 * Fetches class options for dropdowns.
 */
export async function getClasses(db?: D1Database): Promise<ClassOption[]> {
  if (db) {
    try {
      const { results } = await db.prepare(
        'SELECT id, title_english FROM classes ORDER BY display_order ASC, id ASC'
      ).all<ClassOption>();
      if (results && results.length > 0) return results;
    } catch (e) {
      console.warn('Could not fetch classes from D1:', e);
    }
  }
  return [
    { id: 1, title_english: 'Std 9' },
    { id: 2, title_english: 'Std 10' },
    { id: 3, title_english: 'Std 11 Science' },
    { id: 4, title_english: 'Std 11 Commerce' },
    { id: 5, title_english: 'Std 11 Arts' },
    { id: 6, title_english: 'Std 12 Science' },
    { id: 7, title_english: 'Std 12 Commerce' },
    { id: 8, title_english: 'Std 12 Arts' }
  ];
}

/**
 * Fetches category options for dropdowns.
 */
export async function getCategories(db?: D1Database): Promise<CategoryOption[]> {
  if (db) {
    try {
      const { results } = await db.prepare(
        'SELECT id, title_english FROM categories ORDER BY id ASC'
      ).all<CategoryOption>();
      if (results && results.length > 0) return results;
    } catch (e) {
      console.warn('Could not fetch categories from D1:', e);
    }
  }
  return [
    { id: 1, title_english: 'Chapter Revision Notes' },
    { id: 2, title_english: 'IMP Question Banks' },
    { id: 3, title_english: 'GSEB Blueprints & Weightage' },
    { id: 4, title_english: 'Board Model Paper Solutions' },
    { id: 5, title_english: 'GSEB Textbooks & Digests' },
    { id: 6, title_english: 'Formulas & Quick Charts' }
  ];
}

/**
 * Fetches existing subjects for suggestions/dropdown.
 */
export async function getSubjects(db?: D1Database): Promise<SubjectOption[]> {
  if (db) {
    try {
      const { results } = await db.prepare(
        'SELECT id, class_id, name_english FROM subjects ORDER BY name_english ASC'
      ).all<SubjectOption>();
      if (results) return results;
    } catch (e) {
      console.warn('Could not fetch subjects from D1:', e);
    }
  }
  return [];
}

/**
 * Looks up an existing subject by name or creates a new one in D1.
 */
export async function getOrCreateSubject(db: D1Database, subjectName: string, classId?: number | null): Promise<number | null> {
  const trimmed = subjectName.trim();
  if (!trimmed) return null;
  try {
    const existing = await db.prepare('SELECT id FROM subjects WHERE LOWER(name_english) = LOWER(?) LIMIT 1')
      .bind(trimmed)
      .first<{ id: number }>();
    if (existing) {
      return existing.id;
    }
    const code = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'sub';
    const insertRes = await db.prepare(`
      INSERT INTO subjects (class_id, code, name_english, name_gujarati, display_order, is_active)
      VALUES (?, ?, ?, ?, 0, 1)
    `).bind(classId || 1, code, trimmed, trimmed).run();
    return (insertRes.meta?.last_row_id as number) || null;
  } catch (e) {
    console.warn('Subject creation/lookup warning:', e);
    return null;
  }
}

/**
 * Inserts a new download record into D1 database.
 */
export async function createDownloadRecord(db: D1Database, dto: CreateDownloadDTO): Promise<boolean> {
  const result = await db.prepare(`
    INSERT INTO downloads (
      title, class_id, subject_id, category_id, description, 
      external_url, download_url, thumbnail_url, file_type, 
      pdf_r2_key, file_size_bytes, status, display_order, download_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    dto.title,
    dto.class_id || null,
    dto.subject_id || null,
    dto.category_id || null,
    dto.description || null,
    dto.external_url,
    dto.download_url || null,
    dto.thumbnail_url || null,
    dto.file_type || 'PDF Document',
    dto.file_size_bytes || 0,
    dto.status || 'published',
    dto.display_order || 0
  ).run();

  return result.success;
}

/**
 * Updates an existing download record in D1 database.
 */
export async function updateDownloadRecord(db: D1Database, dto: UpdateDownloadDTO): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE downloads SET
      title = ?,
      class_id = ?,
      subject_id = ?,
      category_id = ?,
      description = ?,
      external_url = ?,
      download_url = ?,
      thumbnail_url = ?,
      status = ?,
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    dto.title,
    dto.class_id || null,
    dto.subject_id || null,
    dto.category_id || null,
    dto.description || null,
    dto.external_url,
    dto.download_url || null,
    dto.thumbnail_url || null,
    dto.status || 'published',
    dto.display_order || 0,
    dto.id
  ).run();

  return result.success;
}

/**
 * Toggles download status between 'published' and 'draft'.
 */
export async function toggleDownloadStatus(db: D1Database, id: number, newStatus: 'published' | 'draft'): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE downloads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newStatus, id).run();

  return result.success;
}

/**
 * Deletes a download record by ID.
 */
export async function deleteDownloadRecord(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare(`
    DELETE FROM downloads WHERE id = ?
  `).bind(id).run();

  return result.success;
}
