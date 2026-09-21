import type { TestRecord } from '../db/schema';
import { TESTS_DATA, CLASSES_DATA } from '../data/portalData';

type D1Database = import('@cloudflare/workers-types').D1Database;

export const TEST_TYPES = [
  'Question Paper',
  'Chapter / Unit Test',
  'MCQ Practice',
  'Practice Questions',
  'Worksheet',
  'Revision Test',
  'Previous Year Paper',
  'Board Model Paper'
] as const;

export const DIFFICULTY_LEVELS = [
  'Easy',
  'Medium',
  'Hard',
  'Board Standard'
] as const;

export const MEDIUM_OPTIONS = [
  'Gujarati',
  'English',
  'Both'
] as const;

export interface CreateTestDTO {
  title: string;
  class_id?: number | null;
  subject_id?: number | null;
  chapter?: string | null;
  duration_minutes: number;
  total_marks: number;
  test_type: string;
  medium?: string;
  difficulty?: string;
  description?: string | null;
  external_url?: string | null;
  download_url?: string | null;
  thumbnail_url?: string | null;
  status?: 'draft' | 'published';
  display_order?: number;
}

export interface UpdateTestDTO extends CreateTestDTO {
  id: number;
}

export interface ClassOption {
  id: number;
  title_english: string;
}

export interface SubjectOption {
  id: number;
  class_id?: number;
  name_english: string;
}

/**
 * Fallback mapping from portalData.ts static data if D1 is unavailable.
 */
function getStaticTestsFallback(): TestRecord[] {
  return TESTS_DATA.map((item, index) => {
    const classMatch = CLASSES_DATA.find(c => c.standard.includes(item.standard)) || CLASSES_DATA[0];
    return {
      id: index + 1,
      class_id: null,
      subject_id: null,
      title: item.title,
      duration_minutes: parseInt(item.duration.replace(/[^0-9]/g, '')) || 60,
      total_marks: item.totalMarks || 50,
      test_type: item.type || 'Question Paper',
      pdf_r2_key: null,
      external_url: 'https://drive.google.com',
      download_url: null,
      thumbnail_url: null,
      description: `Official GSEB practice test paper for ${item.standard} ${item.subject}.`,
      chapter: 'Unit Test / Blueprint',
      medium: 'Gujarati',
      difficulty: 'Board Standard',
      status: 'published',
      display_order: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      className: item.standard,
      subjectName: item.subject
    };
  });
}

/**
 * Fetches published tests from D1 database.
 * Fallbacks to portalData.ts static data if D1 is unavailable.
 */
export async function getPublishedTests(db?: D1Database): Promise<TestRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT 
          t.*,
          c.title_english as className,
          s.name_english as subjectName
        FROM tests t
        LEFT JOIN classes c ON t.class_id = c.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.status = 'published'
        ORDER BY t.display_order ASC, t.id DESC
      `).all<TestRecord>();

      if (results && results.length > 0) {
        return results;
      }
    } catch (e) {
      console.warn('D1 published tests query warning, falling back to static data:', e);
    }
  }

  return getStaticTestsFallback();
}

/**
 * Fetches all tests (published & draft) for Admin dashboard.
 */
export async function getAllAdminTests(db?: D1Database): Promise<TestRecord[]> {
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT 
          t.*,
          c.title_english as className,
          s.name_english as subjectName
        FROM tests t
        LEFT JOIN classes c ON t.class_id = c.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        ORDER BY t.display_order ASC, t.id DESC
      `).all<TestRecord>();

      if (results) {
        return results;
      }
    } catch (e) {
      console.warn('D1 admin tests query warning:', e);
    }
  }

  return getPublishedTests(db);
}

/**
 * Fetches a single test record by ID.
 */
export async function getTestById(db: D1Database, id: number): Promise<TestRecord | null> {
  try {
    const item = await db.prepare(`
      SELECT 
        t.*,
        c.title_english as className,
        s.name_english as subjectName
      FROM tests t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ?
    `).bind(id).first<TestRecord>();

    return item || null;
  } catch (e) {
    console.warn('Failed to fetch test by ID:', e);
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
    console.warn('Subject creation/lookup warning in tests:', e);
    return null;
  }
}

/**
 * Inserts a new test record into D1 database.
 */
export async function createTest(db: D1Database, dto: CreateTestDTO): Promise<boolean> {
  const result = await db.prepare(`
    INSERT INTO tests (
      title, class_id, subject_id, chapter, duration_minutes, total_marks,
      test_type, medium, difficulty, description, external_url, download_url,
      thumbnail_url, status, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    dto.title,
    dto.class_id || null,
    dto.subject_id || null,
    dto.chapter || null,
    dto.duration_minutes || 60,
    dto.total_marks || 50,
    dto.test_type || 'Question Paper',
    dto.medium || 'Gujarati',
    dto.difficulty || 'Medium',
    dto.description || null,
    dto.external_url || null,
    dto.download_url || null,
    dto.thumbnail_url || null,
    dto.status || 'published',
    dto.display_order || 0
  ).run();

  return result.success;
}

/**
 * Updates an existing test record in D1 database.
 */
export async function updateTest(db: D1Database, dto: UpdateTestDTO): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE tests SET
      title = ?,
      class_id = ?,
      subject_id = ?,
      chapter = ?,
      duration_minutes = ?,
      total_marks = ?,
      test_type = ?,
      medium = ?,
      difficulty = ?,
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
    dto.chapter || null,
    dto.duration_minutes || 60,
    dto.total_marks || 50,
    dto.test_type || 'Question Paper',
    dto.medium || 'Gujarati',
    dto.difficulty || 'Medium',
    dto.description || null,
    dto.external_url || null,
    dto.download_url || null,
    dto.thumbnail_url || null,
    dto.status || 'published',
    dto.display_order || 0,
    dto.id
  ).run();

  return result.success;
}

/**
 * Toggles test status between 'published' and 'draft'.
 */
export async function toggleTestStatus(db: D1Database, id: number, newStatus: 'published' | 'draft'): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE tests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newStatus, id).run();

  return result.success;
}

/**
 * Deletes a test record by ID.
 */
export async function deleteTest(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare(`
    DELETE FROM tests WHERE id = ?
  `).bind(id).run();

  return result.success;
}
