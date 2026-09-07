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

/**
 * Fetches published downloads from D1 database.
 * Fallbacks to portalData.ts static data if D1 is unavailable or empty.
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

      if (results && results.length > 0) {
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
 * Inserts a new download record into D1 database.
 */
export async function createDownloadRecord(db: D1Database, dto: CreateDownloadDTO): Promise<boolean> {
  const result = await db.prepare(`
    INSERT INTO downloads (
      title, class_id, subject_id, category_id, description, 
      external_url, download_url, thumbnail_url, file_type, 
      file_size_bytes, status, display_order, download_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
