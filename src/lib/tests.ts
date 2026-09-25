import type { TestRecord, QuestionRecord, SectionAQuestionType, SectionAQuestionSource } from '../db/schema';

type D1Database = import('@cloudflare/workers-types').D1Database;

export const TEST_TYPES = [
  'Question Paper',
  'Chapter / Unit Test',
  'MCQ Practice',
  'Practice Questions',
  'Worksheet',
  'Revision Test',
  'Previous Year Paper',
  'Board Model Paper',
  'Section-A Question Test'
] as const;

export const SECTION_A_QUESTION_TYPES = [
  { key: 'mcq', label: 'MCQ (Multiple Choice)' },
  { key: 'fill_blank', label: 'Fill in the Blank' },
  { key: 'fill_blank_options', label: 'Fill in the Blank with Options' },
  { key: 'true_false', label: 'True / False' },
  { key: 'one_word', label: 'One Word Answer' },
  { key: 'one_line', label: 'One Line Answer' }
] as const;

export const SECTION_A_QUESTION_SOURCES = [
  { key: 'text', label: 'Text Question' },
  { key: 'image', label: 'Image Question' },
  { key: 'text_image', label: 'Text + Image Question' }
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
 * Fetches published tests from D1 database.
 * Returns empty array if no tests are published or if database is unavailable.
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

      if (results) {
        return results;
      }
    } catch (e) {
      console.warn('D1 published tests query warning:', e);
    }
  }

  return [];
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

  return [];
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

// ============================================================================
// Section-A Question Data Access & Validation
// ============================================================================

export interface CreateQuestionDTO {
  test_id: number;
  question_number?: number;
  question_type: SectionAQuestionType | string;
  question_source?: SectionAQuestionSource | string;
  question_text_english?: string | null;
  question_text_gujarati?: string | null;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_option?: 'A' | 'B' | 'C' | 'D' | null;
  correct_answer_text?: string | null;
  marks?: number;
  explanation?: string | null;
  image_data?: string | null;
  image_alt_text?: string | null;
  display_order?: number;
}

export interface UpdateQuestionDTO extends CreateQuestionDTO {
  id: number;
}

export interface QuestionValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates logical combinations of question_type and question_source.
 * Non-destructive and safe for legacy records.
 */
export function validateQuestion(dto: Partial<CreateQuestionDTO>): QuestionValidationResult {
  const errors: string[] = [];
  const type = dto.question_type || 'mcq';
  const source = dto.question_source || 'text';

  const hasText = Boolean(dto.question_text_english?.trim() || dto.question_text_gujarati?.trim());
  const hasImage = Boolean(dto.image_data?.trim());

  // Question Source validation
  if (source === 'text' && !hasText) {
    errors.push('Question text (English or Gujarati) is required when question source is Text.');
  } else if (source === 'image' && !hasImage && !hasText) {
    errors.push('Question content (image or description) is required for Image question source.');
  }

  // Question Type validation
  if (type === 'mcq') {
    if (!dto.option_a?.trim() || !dto.option_b?.trim()) {
      errors.push('At least Option A and Option B are required for MCQ.');
    }
    if (dto.correct_option && !['A', 'B', 'C', 'D'].includes(dto.correct_option)) {
      errors.push('Correct option must be A, B, C, or D.');
    }
  } else if (type === 'fill_blank') {
    if (!dto.correct_answer_text?.trim() && !dto.correct_option) {
      errors.push('Correct answer text is required for Fill in the Blank.');
    }
  } else if (type === 'fill_blank_options') {
    if (!dto.option_a?.trim() || !dto.option_b?.trim()) {
      errors.push('At least Option A and Option B are required for Fill in the Blank with Options.');
    }
    if (!dto.correct_answer_text?.trim() && !dto.correct_option) {
      errors.push('Correct answer or option is required.');
    }
  } else if (type === 'true_false') {
    const ans = (dto.correct_answer_text || '').trim().toLowerCase();
    if (!ans && !dto.correct_option) {
      errors.push('Answer (True or False) is required for True/False question.');
    }
  } else if (type === 'one_word' || type === 'one_line') {
    if (!dto.correct_answer_text?.trim()) {
      errors.push('Correct answer text is required.');
    }
  }

  if (dto.marks !== undefined && (isNaN(dto.marks) || dto.marks <= 0)) {
    errors.push('Marks must be a positive number.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Fetches all questions for a specific test, ordered by display_order.
 */
export async function getQuestionsByTestId(db: D1Database, testId: number): Promise<QuestionRecord[]> {
  try {
    const { results } = await db.prepare(`
      SELECT * FROM questions
      WHERE test_id = ?
      ORDER BY display_order ASC, question_number ASC, id ASC
    `).bind(testId).all<QuestionRecord>();

    return results || [];
  } catch (e) {
    console.warn('Could not fetch questions from D1:', e);
    return [];
  }
}

/**
 * Fetches a single question by ID.
 */
export async function getQuestionById(db: D1Database, id: number): Promise<QuestionRecord | null> {
  try {
    const question = await db.prepare(`
      SELECT * FROM questions WHERE id = ? LIMIT 1
    `).bind(id).first<QuestionRecord>();

    return question || null;
  } catch (e) {
    console.warn('Could not fetch question by id from D1:', e);
    return null;
  }
}

/**
 * Inserts a new question into D1 database.
 */
export async function createQuestion(db: D1Database, dto: CreateQuestionDTO): Promise<boolean> {
  try {
    let qNum = dto.question_number;
    let orderNum = dto.display_order;

    if (!qNum || orderNum === undefined) {
      const stats = await db.prepare(`
        SELECT MAX(question_number) as maxNum, MAX(display_order) as maxOrder
        FROM questions WHERE test_id = ?
      `).bind(dto.test_id).first<{ maxNum: number | null; maxOrder: number | null }>();

      if (!qNum) qNum = (stats?.maxNum || 0) + 1;
      if (orderNum === undefined) orderNum = (stats?.maxOrder || 0) + 1;
    }

    const result = await db.prepare(`
      INSERT INTO questions (
        test_id, question_number, question_type, question_source,
        question_text_english, question_text_gujarati,
        option_a, option_b, option_c, option_d,
        correct_option, correct_answer_text,
        marks, explanation, image_data, image_alt_text,
        display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      dto.test_id,
      qNum,
      dto.question_type || 'mcq',
      dto.question_source || 'text',
      dto.question_text_english ?? '',
      dto.question_text_gujarati || null,
      dto.option_a || null,
      dto.option_b || null,
      dto.option_c || null,
      dto.option_d || null,
      dto.correct_option || null,
      dto.correct_answer_text || null,
      dto.marks !== undefined ? dto.marks : 1,
      dto.explanation || null,
      dto.image_data || null,
      dto.image_alt_text || null,
      orderNum
    ).run();

    return result.success;
  } catch (e) {
    console.warn('Error creating question in D1:', e);
    return false;
  }
}

/**
 * Updates an existing question in D1 database.
 */
export async function updateQuestion(db: D1Database, dto: UpdateQuestionDTO): Promise<boolean> {
  try {
    const result = await db.prepare(`
      UPDATE questions SET
        question_number = COALESCE(?, question_number),
        question_type = ?,
        question_source = ?,
        question_text_english = ?,
        question_text_gujarati = ?,
        option_a = ?,
        option_b = ?,
        option_c = ?,
        option_d = ?,
        correct_option = ?,
        correct_answer_text = ?,
        marks = ?,
        explanation = ?,
        image_data = ?,
        image_alt_text = ?,
        display_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND test_id = ?
    `).bind(
      dto.question_number || null,
      dto.question_type || 'mcq',
      dto.question_source || 'text',
      dto.question_text_english ?? '',
      dto.question_text_gujarati || null,
      dto.option_a || null,
      dto.option_b || null,
      dto.option_c || null,
      dto.option_d || null,
      dto.correct_option || null,
      dto.correct_answer_text || null,
      dto.marks !== undefined ? dto.marks : 1,
      dto.explanation || null,
      dto.image_data || null,
      dto.image_alt_text || null,
      dto.display_order !== undefined ? dto.display_order : 0,
      dto.id,
      dto.test_id
    ).run();

    return result.success;
  } catch (e) {
    console.warn('Error updating question in D1:', e);
    return false;
  }
}

/**
 * Deletes a question by ID.
 */
export async function deleteQuestion(db: D1Database, id: number): Promise<boolean> {
  try {
    const result = await db.prepare(`
      DELETE FROM questions WHERE id = ?
    `).bind(id).run();

    return result.success;
  } catch (e) {
    console.warn('Error deleting question from D1:', e);
    return false;
  }
}

/**
 * Reorders questions within a test.
 */
export async function reorderQuestions(db: D1Database, testId: number, orderedIds: number[]): Promise<boolean> {
  try {
    const statements = orderedIds.map((id, index) =>
      db.prepare(`
        UPDATE questions SET display_order = ?, question_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND test_id = ?
      `).bind(index + 1, index + 1, id, testId)
    );

    await db.batch(statements);
    return true;
  } catch (e) {
    console.warn('Error reordering questions in D1:', e);
    return false;
  }
}
