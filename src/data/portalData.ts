export interface ClassInfo {
  id: string;
  standard: string;
  titleGujarati: string;
  description: string;
  subjects: string[];
  badge?: string;
  link: string;
}

export interface MaterialCategory {
  id: string;
  title: string;
  titleGujarati: string;
  description: string;
  icon: string;
  badge?: string;
  itemCount: number;
}

export interface TestItem {
  id: string;
  title: string;
  standard: string;
  subject: string;
  totalMarks: number;
  duration: string;
  type: string;
}

export interface BlogPost {
  id: string;
  title: string;
  titleGujarati: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  image: string;
}

export interface DownloadItem {
  id: string;
  title: string;
  standard: string;
  subject: string;
  fileType: string;
  fileSize: string;
  downloadCount: string;
}

export const SITE_INFO = {
  name: "Sanskar Deep",
  title: "SANSKAR DEEP Educational Portal",
  domain: "sanskardeep.in",
  tagline: "Nothing Is Hard Against Your Will",
  taglineGujarati: "તમારી ઈચ્છાશક્તિ આગળ કાંઈ જ અશક્ય નથી",
  subheading: "Gujarat Board (GSEB) Std 9 to 12 Dedicated Learning Companion",
  description: "Free and high-quality educational resources, study notes, IMP question banks, paper solutions, blueprints, and online practice tests for Std 9, 10, 11, and 12 GSEB students.",
  contactEmail: "info@sanskardeep.in",
  supportPhone: "+91 98765 43210",
  location: "Gujarat, India"
};

export const NAV_LINKS = [
  { label: "HOME", href: "#home" },
  { label: "CLASSES", href: "#classes" },
  { label: "STUDY MATERIAL", href: "#study-material" },
  { label: "TESTS & PRACTICE", href: "#tests" },
  { label: "BLOG", href: "#blog" },
  { label: "DOWNLOADS", href: "#downloads" },
  { label: "ABOUT", href: "#about" },
  { label: "CONTACT", href: "#footer" }
];

export const CLASSES_DATA: ClassInfo[] = [
  {
    id: "std-9",
    standard: "Std 9 (ધોરણ ૯)",
    titleGujarati: "ધોરણ ૯ સંસ્કૃતિ અને પાયો",
    description: "Build strong foundational concepts for High School in Science, Maths, Social Science, Gujarati, and English.",
    subjects: ["Mathematics", "Science & Tech", "Social Science", "Gujarati", "English", "Sanskrit"],
    badge: "Foundation Level",
    link: "#classes"
  },
  {
    id: "std-10",
    standard: "Std 10 (ધોરણ ૧૦)",
    titleGujarati: "ધોરણ ૧૦ એસ.એસ.સી. બોર્ડ",
    description: "Complete GSEB Board exam preparation with chapter-wise IMP notes, sample papers, and blueprint guidance.",
    subjects: ["Mathematics (Basic/Standard)", "Science", "Social Science", "Gujarati (FL/SL)", "English", "Sanskrit"],
    badge: "GSEB Board Exam",
    link: "#classes"
  },
  {
    id: "std-11-sci",
    standard: "Std 11 Science (ધોરણ ૧૧ વિજ્ઞાન પ્રવાહ)",
    titleGujarati: "ધોરણ ૧૧ સાયન્સ",
    description: "In-depth concept notes, diagrams, and formula sheets for Group A (PCM) and Group B (PCB).",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer"],
    badge: "Science Stream",
    link: "#classes"
  },
  {
    id: "std-11-com",
    standard: "Std 11 Commerce & Arts (ધોરણ ૧૧ સામાન્ય પ્રવાહ)",
    titleGujarati: "ધોરણ ૧૧ કોમર્સ અને આર્ટ્સ",
    description: "Clear explanations, step-by-step accountancy solutions, economics graphs, and statistics notes.",
    subjects: ["Elements of Accounts", "Statistics", "Economics", "Business Admin (B.A.)", "English", "Gujarati"],
    badge: "General Stream",
    link: "#classes"
  },
  {
    id: "std-12-sci",
    standard: "Std 12 Science (ધોરણ ૧૨ વિજ્ઞાન પ્રવાહ)",
    titleGujarati: "ધોરણ ૧૨ એચ.એસ.સી. સાયન્સ બોર્ડ",
    description: "Comprehensive Board & Entrance preparation material (GUJCET/NEET/JEE base) with previous year papers.",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Studies"],
    badge: "HSC Board & Competitive",
    link: "#classes"
  },
  {
    id: "std-12-com",
    standard: "Std 12 Commerce & Arts (ધોરણ ૧૨ સામાન્ય પ્રવાહ)",
    titleGujarati: "ધોરણ ૧૨ એચ.એસ.સી. સામાન્ય પ્રવાહ બોર્ડ",
    description: "GSEB HSC General stream exam packages, chapter-wise IMP questions, paper presentation tips, and blueprints.",
    subjects: ["Accountancy", "Statistics", "Economics", "B.A. / Organisation", "SP & CC", "English"],
    badge: "HSC General Board",
    link: "#classes"
  }
];

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: "notes",
    title: "Chapter Revision Notes",
    titleGujarati: "પ્રકરણવાર રિવિઝન નોટ્સ",
    description: "Handwritten and typed quick revision notes designed according to latest GSEB textbook patterns.",
    icon: "book-open",
    badge: "Most Popular",
    itemCount: 140
  },
  {
    id: "imp-questions",
    title: "IMP Question Banks",
    titleGujarati: "મોસ્ટ આઈએમપી પ્રશ્ન બેંક",
    description: "Marks-wise (Section A, B, C, D, E) curated important questions for upcoming mid-term and board exams.",
    icon: "award",
    badge: "Board Focused",
    itemCount: 95
  },
  {
    id: "blueprints",
    title: "GSEB Blueprints & Weightage",
    titleGujarati: "બ્લુપ્રિન્ટ અને ગુણભાર",
    description: "Official and expert-analyzed chapter weightage and question format guide for Std 9 to 12.",
    icon: "layout",
    badge: "Updated 2025-26",
    itemCount: 32
  },
  {
    id: "paper-solutions",
    title: "Board Model Paper Solutions",
    titleGujarati: "બોર્ડ પેપર સોલ્યુશન",
    description: "Detailed step-by-step written solutions for previous year board papers and model test papers.",
    icon: "check-circle",
    badge: "Step-by-Step",
    itemCount: 64
  },
  {
    id: "textbooks",
    title: "GSEB Textbooks & Digests",
    titleGujarati: "પાઠ્યપુસ્તકો અને સાહિત્ય",
    description: "Direct reference links and chapter summaries for Gujarat Board prescribed textbooks.",
    icon: "folder",
    badge: "Official GSEB",
    itemCount: 48
  },
  {
    id: "formula-sheets",
    title: "Formulas & Quick Charts",
    titleGujarati: "સૂત્રો અને ક્વિક ચાર્ટ",
    description: "Mathematics formulas, Physics equations, Chemistry reactions, and Accountancy journal entry rules.",
    icon: "cpu",
    badge: "Quick Review",
    itemCount: 28
  }
];

export const TESTS_DATA: TestItem[] = [
  {
    id: "t1",
    title: "Std 10 Maths Basic & Standard - Chapter 1 to 5 Unit Test",
    standard: "Std 10",
    subject: "Mathematics",
    totalMarks: 50,
    duration: "1 Hr 30 Mins",
    type: "Offline/Printable Test"
  },
  {
    id: "t2",
    title: "Std 12 Commerce Accountancy Part-1 Full Chapter Practice Set",
    standard: "Std 12 Commerce",
    subject: "Accounts",
    totalMarks: 100,
    duration: "3 Hours",
    type: "Board Model Test"
  },
  {
    id: "t3",
    title: "Std 10 Science - Chemical Reactions & Equations Quiz",
    standard: "Std 10",
    subject: "Science",
    totalMarks: 25,
    duration: "30 Mins",
    type: "Online MCQ Quiz"
  },
  {
    id: "t4",
    title: "Std 12 Science Physics Chapter-Wise Numericals & Formula Quiz",
    standard: "Std 12 Science",
    subject: "Physics",
    totalMarks: 40,
    duration: "45 Mins",
    type: "Practice Test"
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "How to Score 90%+ in GSEB Std 10 Board Exams: Proven Strategy",
    titleGujarati: "ધોરણ ૧૦ બોર્ડ પરીક્ષામાં ૯૦% થી વધુ માર્ક્સ મેળવવાની સરળ રીત",
    category: "Exam Strategy",
    date: "Sep 02, 2026",
    readTime: "5 min read",
    summary: "Essential advice on time management, answer sheet presentation, blueprint analysis, and daily revision routines for Gujarat Board students.",
    image: "/blog-1.jpg"
  },
  {
    id: "b2",
    title: "GSEB Paper Style & Section-wise Time Allocation Guide",
    titleGujarati: "ગુજરાત બોર્ડ પેપર સ્ટાઇલ અને સમય વ્યવસ્થાપન",
    category: "Paper Presentation",
    date: "Aug 28, 2026",
    readTime: "4 min read",
    summary: "Learn how to write clean answers, draw diagrams neatly, and finish your 100-mark paper 15 minutes before time.",
    image: "/blog-2.jpg"
  },
  {
    id: "b3",
    title: "Std 11 Science vs Commerce: Choosing the Right Stream After Std 10",
    titleGujarati: "ધોરણ ૧૦ પછી પ્રવાહની પસંદગી: સાયન્સ કે કોમર્સ?",
    category: "Career Guidance",
    date: "Aug 15, 2026",
    readTime: "6 min read",
    summary: "A practical guide for parents and students to understand career prospects, subjects, and difficulty levels of each stream.",
    image: "/blog-3.jpg"
  }
];

export const DOWNLOADS_DATA: DownloadItem[] = [
  {
    id: "d1",
    title: "Std 10 GSEB Board Model Paper Set 2026 (All Subjects PDF)",
    standard: "Std 10",
    subject: "All Subjects",
    fileType: "PDF Document",
    fileSize: "4.8 MB",
    downloadCount: "12,450+"
  },
  {
    id: "d2",
    title: "Std 12 General Stream GSEB Official Blueprint & Syllabus 2025-26",
    standard: "Std 12 Commerce",
    subject: "Accounts / Stat / Eco",
    fileType: "PDF Document",
    fileSize: "2.1 MB",
    downloadCount: "8,920+"
  },
  {
    id: "d3",
    title: "Std 12 Science Physics & Chemistry Most IMP Reaction & Formula Chart",
    standard: "Std 12 Science",
    subject: "Physics & Chemistry",
    fileType: "PDF Document",
    fileSize: "3.5 MB",
    downloadCount: "15,100+"
  },
  {
    id: "d4",
    title: "Std 9 Science & Maths Half-Yearly Sample Question Papers",
    standard: "Std 9",
    subject: "Maths & Science",
    fileType: "PDF Document",
    fileSize: "1.9 MB",
    downloadCount: "6,300+"
  }
];
