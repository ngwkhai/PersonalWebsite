/**
 * Single source of truth for everything factual about Khai.
 *
 * Three consumers read this file, which is why it is typed data and not JSX:
 *   1. the UI (hero, education, experience, contact)
 *   2. scripts/build-knowledge.ts, which chunks + embeds it for the agent
 *   3. the tailored-CV PDF generator
 *
 * If a fact is not here or in content/projects/*.mdx, the agent must not claim it.
 */

export type Locale = 'en' | 'vi';

/** Prose that differs per locale. Identifiers, metrics and names never do. */
export type Localized = Readonly<Record<Locale, string>>;

export interface Social {
  readonly label: string;
  readonly href: string;
  readonly handle: string;
  /** Shown in the footer/contact rail. Hidden entries stay available to the agent. */
  readonly primary: boolean;
}

export interface Institution {
  readonly organisation: string;
  readonly role: Localized;
  readonly start: string;
  readonly end: string | null;
  readonly logo: string;
  readonly detail: readonly Localized[];
}

export interface SkillGroup {
  readonly id: string;
  readonly label: Localized;
  readonly items: readonly string[];
}

export const profile = {
  name: 'Nguyen Dinh Khai',
  nameVi: 'Nguyễn Đình Khải',
  /** Rendered as three stacked lines in the hero, as on the previous site. */
  nameLines: ['Dinh', 'Khai', 'Nguyen'] as const,
  headline: {
    en: 'AI Researcher · AI Engineer',
    vi: 'Nghiên cứu viên AI · Kỹ sư AI',
  } satisfies Localized,
  location: { en: 'Hanoi, Vietnam', vi: 'Hà Nội, Việt Nam' } satisfies Localized,
  /**
   * Deliberately not a mailto address: the previous site published no email and
   * routed everything through the contact form. Set CONTACT_EMAIL in the
   * environment to enable direct mail.
   */
  contactNote: {
    en: 'Whenever you want to contact me, please email me and I will reply.',
    vi: 'Bất cứ khi nào bạn muốn liên hệ, hãy gửi email cho tôi và tôi sẽ phản hồi.',
  } satisfies Localized,
  bio: {
    en: 'Based in Vietnam, I am an AI researcher and AI engineer with a strong passion for artificial intelligence and data-driven technologies. My academic background in computer science and hands-on experience with projects in machine learning, deep learning, natural language processing, and financial technology have equipped me with both theoretical knowledge and practical skills. I have worked on projects ranging from image recognition and fraud detection to building intelligent chatbots and real-time systems. This journey has given me valuable expertise in data analysis, programming, and problem-solving. I am deeply motivated to create AI solutions that not only advance technology but also deliver real-world impact. Innovation, continuous learning, and pushing the boundaries of what AI can achieve are at the core of my work, and I aspire to build impactful projects that shape the future of intelligent systems.',
    vi: 'Sống và làm việc tại Việt Nam, tôi là một nghiên cứu viên và kỹ sư AI với niềm đam mê mạnh mẽ dành cho trí tuệ nhân tạo và các công nghệ dựa trên dữ liệu. Nền tảng học thuật về khoa học máy tính cùng kinh nghiệm thực chiến qua các dự án học máy, học sâu, xử lý ngôn ngữ tự nhiên và công nghệ tài chính đã cho tôi cả chiều sâu lý thuyết lẫn kỹ năng triển khai. Tôi đã làm việc với những bài toán trải rộng từ nhận dạng ảnh, phát hiện gian lận cho tới xây dựng chatbot thông minh và hệ thống thời gian thực. Hành trình đó mang lại cho tôi kinh nghiệm quý giá về phân tích dữ liệu, lập trình và giải quyết vấn đề. Tôi luôn được thôi thúc bởi mong muốn tạo ra những giải pháp AI không chỉ tiến bộ về mặt công nghệ mà còn tạo tác động thật trong đời sống. Đổi mới, học hỏi không ngừng và mở rộng giới hạn của những gì AI có thể làm là cốt lõi trong công việc của tôi.',
  } satisfies Localized,
  cvPath: '/Dinh-Khai-Nguyen-CV.pdf',
} as const;

export const socials: readonly Social[] = [
  { label: 'GitHub', href: 'https://github.com/ngwkhai', handle: 'ngwkhai', primary: true },
  {
    label: 'Kaggle',
    href: 'https://www.kaggle.com/ngwdinhkhai',
    handle: 'ngwdinhkhai',
    primary: true,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/ngw.dinh.khai/',
    handle: 'ngw.dinh.khai',
    primary: false,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/ngw.dinh.khai/',
    handle: 'ngw.dinh.khai',
    primary: false,
  },
];

export const education: readonly Institution[] = [
  {
    organisation: 'VNU University of Engineering and Technology',
    role: {
      en: 'Bachelor of Artificial Intelligence',
      vi: 'Cử nhân Trí tuệ Nhân tạo',
    },
    start: '2023-08',
    end: null,
    logo: '/img/vnu-university-logo.avif',
    detail: [{ en: 'GPA: 3.5/4', vi: 'GPA: 3.5/4' }],
  },
];

export const experience: readonly Institution[] = [
  {
    organisation: 'NLP Lab',
    role: { en: 'Member', vi: 'Thành viên' },
    start: '2025-06',
    end: null,
    logo: '/img/nlp-lab-logo.avif',
    detail: [
      {
        en: 'Participated in research and development activities in natural language processing, including exploring AI models, experimenting with text data, and contributing ideas to group projects.',
        vi: 'Tham gia các hoạt động nghiên cứu và phát triển trong lĩnh vực xử lý ngôn ngữ tự nhiên, bao gồm khảo sát các mô hình AI, thực nghiệm trên dữ liệu văn bản và đóng góp ý tưởng cho các dự án nhóm.',
      },
    ],
  },
];

export const leadership: readonly Institution[] = [
  {
    organisation: 'Institute for Artificial Intelligence',
    role: {
      en: 'Class Vice-President & Executive Committee Member',
      vi: 'Lớp phó & Thành viên Ban Chấp hành',
    },
    start: '2024-09',
    end: null,
    logo: '/img/uet-ai-logo.avif',
    detail: [
      {
        en: 'Served as Class Vice-President and an active member of the Executive Committee, coordinating student projects, organizing meetings, and contributing to strategic planning within the institute.',
        vi: 'Đảm nhiệm vai trò lớp phó và thành viên tích cực của Ban Chấp hành, điều phối các dự án sinh viên, tổ chức họp và tham gia hoạch định chiến lược của viện.',
      },
    ],
  },
];

/**
 * Derived from what the projects actually demonstrate — every entry here is
 * evidenced by at least one case study in content/projects.
 */
export const skills: readonly SkillGroup[] = [
  {
    id: 'ml',
    label: { en: 'Machine Learning', vi: 'Học máy' },
    items: [
      'PyTorch',
      'Transformer',
      'Seq2Seq',
      'YOLOv5 / YOLOv1',
      'CBAM',
      'XGBoost',
      'SMOTE / ADASYN',
      'scikit-learn',
    ],
  },
  {
    id: 'nlp',
    label: { en: 'NLP', vi: 'Xử lý ngôn ngữ tự nhiên' },
    items: ['Vietnamese NLP', 'Diacritic restoration', 'BLEU / ChrF++', 'Sentiment classification'],
  },
  {
    id: 'systems',
    label: { en: 'Systems & Deployment', vi: 'Hệ thống & Triển khai' },
    items: ['FastAPI', 'Docker', 'PostgreSQL', 'React', 'Apache Spark', 'Apache Hadoop'],
  },
  {
    id: 'perf',
    label: { en: 'Inference & Performance', vi: 'Suy luận & Hiệu năng' },
    items: [
      'TensorRT',
      'ONNX Runtime',
      'TorchScript',
      'torch.compile',
      'FP16 / INT8',
      'CUDA profiling',
    ],
  },
];

/** Headline numbers, surfaced in the hero and reusable by the agent. */
export const highlights = [
  { value: '12.5M', label: { en: 'sentence pairs curated', vi: 'cặp câu được xây dựng' } },
  {
    value: '81.31',
    label: { en: 'BLEU, Vietnamese restoration', vi: 'BLEU, khôi phục dấu tiếng Việt' },
  },
  { value: '4×', label: { en: 'inference throughput gain', vi: 'tăng thông lượng suy luận' } },
  { value: '7', label: { en: 'shipped ML systems', vi: 'hệ thống ML đã hoàn thiện' } },
] as const satisfies readonly { value: string; label: Localized }[];
