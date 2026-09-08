import type { StudyMaterialRecord } from '../db/schema';
import { getClasses, getCategories, getSubjects, getOrCreateSubject } from './downloads';

export type { StudyMaterialRecord };
export { getClasses, getCategories, getSubjects, getOrCreateSubject };

type D1Database = import('@cloudflare/workers-types').D1Database;

export interface CreateStudyMaterialDTO {
  title_english: string;
  title_gujarati?: string | null;
  class_id?: number | null;
  subject_id?: number | null;
  category_id?: number | null;
  chapter?: string | null;
  description?: string | null;
  external_url?: string | null;
  download_url?: string | null;
  thumbnail_url?: string | null;
  status?: 'draft' | 'published';
  display_order?: number;
}

export interface UpdateStudyMaterialDTO extends CreateStudyMaterialDTO {
  id: number;
}

/**
 * Fetches published study materials from D1 for public display.
 */
export async function getPublishedStudyMaterials(db?: D1Database): Promise<StudyMaterialRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT
          sm.*,
          c.title_english as className,
          s.name_english as subjectName,
          cat.title_english as categoryName
        FROM study_materials sm
        LEFT JOIN classes c ON sm.class_id = c.id
        LEFT JOIN subjects s ON sm.subject_id = s.id
        LEFT JOIN categories cat ON sm.category_id = cat.id
        WHERE sm.status = 'published'
        ORDER BY sm.display_order ASC, sm.id DESC
      `).all<StudyMaterialRecord>();
      if (results) return results;
    } catch (e) {
      console.warn('D1 study_materials query warning:', e);
    }
  }
  return [];
}

/**
 * Fetches ALL study materials (published + draft) for admin management.
 */
export async function getAllAdminStudyMaterials(db?: D1Database): Promise<StudyMaterialRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT
          sm.*,
          c.title_english as className,
          s.name_english as subjectName,
          cat.title_english as categoryName
        FROM study_materials sm
        LEFT JOIN classes c ON sm.class_id = c.id
        LEFT JOIN subjects s ON sm.subject_id = s.id
        LEFT JOIN categories cat ON sm.category_id = cat.id
        ORDER BY sm.display_order ASC, sm.id DESC
      `).all<StudyMaterialRecord>();
      if (results) return results;
    } catch (e) {
      console.warn('D1 admin study_materials query warning:', e);
    }
  }
  return [];
}

/**
 * Fetches a single study material record by ID for edit mode.
 */
export async function getStudyMaterialById(db: D1Database, id: number): Promise<StudyMaterialRecord | null> {
  try {
    const item = await db.prepare(`
      SELECT
        sm.*,
        c.title_english as className,
        s.name_english as subjectName,
        cat.title_english as categoryName
      FROM study_materials sm
      LEFT JOIN classes c ON sm.class_id = c.id
      LEFT JOIN subjects s ON sm.subject_id = s.id
      LEFT JOIN categories cat ON sm.category_id = cat.id
      WHERE sm.id = ?
    `).bind(id).first<StudyMaterialRecord>();
    return item || null;
  } catch (e) {
    console.warn('Failed to fetch study material by ID:', e);
    return null;
  }
}

/**
 * Inserts a new study material record into D1.
 */
export async function createStudyMaterial(db: D1Database, dto: CreateStudyMaterialDTO): Promise<boolean> {
  const result = await db.prepare(`
    INSERT INTO study_materials (
      title_english, title_gujarati, class_id, subject_id, category_id,
      chapter, description, external_url, download_url, thumbnail_url,
      status, display_order, download_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    dto.title_english,
    dto.title_gujarati || null,
    dto.class_id || null,
    dto.subject_id || null,
    dto.category_id || null,
    dto.chapter || null,
    dto.description || null,
    dto.external_url || null,
    dto.download_url || null,
    dto.thumbnail_url || null,
    dto.status || 'published',
    dto.display_order ?? 0
  ).run();

  return result.success;
}

/**
 * Updates an existing study material record in D1.
 */
export async function updateStudyMaterial(db: D1Database, dto: UpdateStudyMaterialDTO): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE study_materials SET
      title_english = ?,
      title_gujarati = ?,
      class_id = ?,
      subject_id = ?,
      category_id = ?,
      chapter = ?,
      description = ?,
      external_url = ?,
      download_url = ?,
      thumbnail_url = ?,
      status = ?,
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    dto.title_english,
    dto.title_gujarati || null,
    dto.class_id || null,
    dto.subject_id || null,
    dto.category_id || null,
    dto.chapter || null,
    dto.description || null,
    dto.external_url || null,
    dto.download_url || null,
    dto.thumbnail_url || null,
    dto.status || 'published',
    dto.display_order ?? 0,
    dto.id
  ).run();

  return result.success;
}

/**
 * Toggles study material publication status between 'published' and 'draft'.
 */
export async function toggleStudyMaterialStatus(db: D1Database, id: number, newStatus: 'published' | 'draft'): Promise<boolean> {
  const result = await db.prepare(
    `UPDATE study_materials SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(newStatus, id).run();
  return result.success;
}

/**
 * Permanently deletes a study material record.
 */
export async function deleteStudyMaterial(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare(
    `DELETE FROM study_materials WHERE id = ?`
  ).bind(id).run();
  return result.success;
}
