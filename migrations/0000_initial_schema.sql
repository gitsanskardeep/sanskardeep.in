-- Initial Schema Migration for Sanskar Deep Educational Portal (D1 SQLite)

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Streams Table (Flexible Streams support)
CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name_english TEXT NOT NULL,
    name_gujarati TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Classes Table (Std 9 to 12 Streams)
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    standard_number INTEGER NOT NULL,
    stream_id INTEGER REFERENCES streams(id),
    code TEXT UNIQUE NOT NULL,
    title_english TEXT NOT NULL,
    title_gujarati TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_english TEXT NOT NULL,
    name_gujarati TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Material Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title_english TEXT NOT NULL,
    title_gujarati TEXT NOT NULL
);

-- 6. Study Materials Table
CREATE TABLE IF NOT EXISTS study_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title_english TEXT NOT NULL,
    title_gujarati TEXT,
    description TEXT,
    pdf_r2_key TEXT,
    file_size_bytes INTEGER DEFAULT 0,
    badge TEXT,
    status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'archived'
    download_count INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title_english TEXT NOT NULL,
    title_gujarati TEXT,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    content_markdown TEXT,
    cover_image_r2_key TEXT,
    read_time TEXT,
    status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'archived'
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Downloads Repository Table
CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'PDF Document',
    pdf_r2_key TEXT NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tests Table
CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 50,
    test_type TEXT NOT NULL DEFAULT 'printable_pdf', -- 'mcq_online', 'printable_pdf', 'board_model'
    pdf_r2_key TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Questions Bank Table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text_english TEXT NOT NULL,
    question_text_gujarati TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT,
    marks INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_classes_std ON classes(standard_number);
CREATE INDEX IF NOT EXISTS idx_subjects_class ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_class_subject ON study_materials(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON study_materials(status);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_tests_class ON tests(class_id);
CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id);

-- Initial Seed Insert Statements for Streams
INSERT OR IGNORE INTO streams (id, code, name_english, name_gujarati, display_order) VALUES
(1, 'foundation', 'Foundation', 'સંસ્કૃતિ અને પાયો', 1),
(2, 'board_gseb', 'GSEB Board', 'એસ.એસ.સી. બોર્ડ', 2),
(3, 'science', 'Science Stream', 'વિજ્ઞાન પ્રવાહ', 3),
(4, 'commerce', 'Commerce Stream', 'વાણિજ્ય પ્રવાહ', 4),
(5, 'arts', 'Arts Stream', 'કલા પ્રવાહ', 5);

-- Initial Seed Insert Statements for Classes (Std 9, 10, 11 Sci/Com/Arts, 12 Sci/Com/Arts)
INSERT OR IGNORE INTO classes (id, standard_number, stream_id, code, title_english, title_gujarati, description, badge, display_order) VALUES
(1, 9, 1, 'std-9', 'Std 9', 'ધોરણ ૯ સંસ્કૃતિ અને પાયો', 'Build strong foundational concepts for High School in Science, Maths, Social Science, Gujarati, and English.', 'Foundation Level', 1),
(2, 10, 2, 'std-10', 'Std 10', 'ધોરણ ૧૦ એસ.એસ.સી. બોર્ડ', 'Complete GSEB Board exam preparation with chapter-wise IMP notes, sample papers, and blueprint guidance.', 'GSEB Board Exam', 2),
(3, 11, 3, 'std-11-sci', 'Std 11 Science', 'ધોરણ ૧૧ વિજ્ઞાન પ્રવાહ', 'In-depth concept notes, diagrams, and formula sheets for Group A (PCM) and Group B (PCB).', 'Science Stream', 3),
(4, 11, 4, 'std-11-com', 'Std 11 Commerce', 'ધોરણ ૧૧ કોમર્સ', 'Clear explanations, step-by-step accountancy solutions, economics graphs, and statistics notes.', 'Commerce Stream', 4),
(5, 11, 5, 'std-11-arts', 'Std 11 Arts', 'ધોરણ ૧૧ આર્ટ્સ', 'Comprehensive humanities & arts notes, social studies analysis, and exam guides.', 'Arts Stream', 5),
(6, 12, 3, 'std-12-sci', 'Std 12 Science', 'ધોરણ ૧૨ વિજ્ઞાન પ્રવાહ', 'Comprehensive Board & Entrance preparation material (GUJCET/NEET/JEE base) with previous year papers.', 'HSC Board & Competitive', 6),
(7, 12, 4, 'std-12-com', 'Std 12 Commerce', 'ધોરણ ૧૨ કોમર્સ', 'GSEB HSC Commerce stream exam packages, chapter-wise IMP questions, paper presentation tips, and blueprints.', 'HSC Commerce Board', 7),
(8, 12, 5, 'std-12-arts', 'Std 12 Arts', 'ધોરણ ૧૨ આર્ટ્સ', 'GSEB HSC Arts stream question banks, geography maps, and history revision notes.', 'HSC Arts Board', 8);

-- Initial Seed Insert Statements for Material Categories
INSERT OR IGNORE INTO categories (id, code, title_english, title_gujarati) VALUES
(1, 'notes', 'Chapter Revision Notes', 'પ્રકરણવાર રિવિઝન નોટ્સ'),
(2, 'imp-questions', 'IMP Question Banks', 'મોસ્ટ આઈએમપી પ્રશ્ન બેંક'),
(3, 'blueprints', 'GSEB Blueprints & Weightage', 'બ્લુપ્રિન્ટ અને ગુણભાર'),
(4, 'paper-solutions', 'Board Model Paper Solutions', 'બોર્ડ પેપર સોલ્યુશન'),
(5, 'textbooks', 'GSEB Textbooks & Digests', 'પાઠ્યપુસ્તકો અને સાહિત્ય'),
(6, 'formula-sheets', 'Formulas & Quick Charts', 'સૂત્રો અને ક્વિક ચાર્ટ');
