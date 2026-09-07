// TypeScript Interface Definitions for Sanskar Deep Cloudflare D1 Database

export interface AdminRecord {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'editor';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface StreamRecord {
  id: number;
  code: string;
  name_english: string;
  name_gujarati: string;
  display_order: number;
}

export interface ClassRecord {
  id: number;
  standard_number: number;
  stream_id: number | null;
  code: string;
  title_english: string;
  title_gujarati: string;
  description: string | null;
  badge: string | null;
  display_order: number;
  is_active: number;
  created_at: string;
}

export interface SubjectRecord {
  id: number;
  class_id: number;
  code: string;
  name_english: string;
  name_gujarati: string;
  display_order: number;
  is_active: number;
  created_at: string;
}

export interface CategoryRecord {
  id: number;
  code: string;
  title_english: string;
  title_gujarati: string;
}

export interface StudyMaterialRecord {
  id: number;
  class_id: number | null;
  subject_id: number | null;
  category_id: number | null;
  title_english: string;
  title_gujarati: string | null;
  description: string | null;
  pdf_r2_key: string | null;
  file_size_bytes: number;
  badge: string | null;
  status: 'draft' | 'published' | 'archived';
  download_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostRecord {
  id: number;
  slug: string;
  title_english: string;
  title_gujarati: string | null;
  category: string;
  summary: string;
  content_markdown: string | null;
  cover_image_r2_key: string | null;
  read_time: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadRecord {
  id: number;
  class_id: number | null;
  subject_id: number | null;
  title: string;
  file_type: string;
  pdf_r2_key: string;
  file_size_bytes: number;
  download_count: number;
  created_at: string;
}

export interface TestRecord {
  id: number;
  class_id: number | null;
  subject_id: number | null;
  title: string;
  duration_minutes: number;
  total_marks: number;
  test_type: 'mcq_online' | 'printable_pdf' | 'board_model';
  pdf_r2_key: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

export interface QuestionRecord {
  id: number;
  test_id: number;
  question_number: number;
  question_text_english: string;
  question_text_gujarati: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: 'A' | 'B' | 'C' | 'D' | null;
  marks: number;
  explanation: string | null;
  created_at: string;
}
