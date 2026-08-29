/**
 * Achievements, certificates and awards.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * TO ADD YOUR OWN: append entries to the array below. Everything else — the
 * homepage section, the agent's knowledge index, the HTML resume — reads from
 * here, so one edit updates all three.
 *
 * Only three entries are seeded, because those are the only ones evidenced
 * anywhere in this repository. Nothing here is invented: an agent that cites a
 * certificate you do not hold is worse than no agent.
 * ────────────────────────────────────────────────────────────────────────────
 */
import type { Localized } from './cv';

export type AchievementKind = 'award' | 'certificate' | 'publication' | 'academic' | 'role';

export interface Achievement {
  readonly id: string;
  readonly kind: AchievementKind;
  readonly title: Localized;
  /** Awarding body, publisher or institution. */
  readonly issuer: string;
  /** ISO year-month. Used for ordering and display. */
  readonly date: string;
  readonly detail?: Localized;
  /** Verification link — a credential URL, a published notebook, a certificate. */
  readonly href?: string;
}

export const achievements: readonly Achievement[] = [
  {
    id: 'gpa',
    kind: 'academic',
    title: {
      en: 'GPA 3.5 / 4.0, Bachelor of Artificial Intelligence',
      vi: 'GPA 3.5 / 4.0, Cử nhân Trí tuệ Nhân tạo',
    },
    issuer: 'VNU University of Engineering and Technology',
    date: '2023-08',
  },
  {
    id: 'kaggle-yolov1-cbam',
    kind: 'publication',
    title: {
      en: 'Published notebook: YOLOv1 with CBAM, from scratch',
      vi: 'Notebook đã công bố: YOLOv1 kèm CBAM, viết từ đầu',
    },
    issuer: 'Kaggle',
    date: '2024-01',
    detail: {
      en: 'A ground-up YOLOv1 reimplementation with channel-and-spatial attention, published publicly. Train mAP 0.8829, best validation mAP 0.6994.',
      vi: 'Bản cài đặt lại YOLOv1 từ con số không kèm attention theo kênh và không gian, công bố công khai. mAP huấn luyện 0,8829, mAP validation tốt nhất 0,6994.',
    },
    href: 'https://www.kaggle.com/code/ngwdinhkhai/yolov1-cbam-from-scratch-for-test-label',
  },
  {
    id: 'uet-ai-committee',
    kind: 'role',
    title: {
      en: 'Class Vice-President & Executive Committee Member',
      vi: 'Lớp phó & Thành viên Ban Chấp hành',
    },
    issuer: 'Institute for Artificial Intelligence, VNU-UET',
    date: '2024-09',
    detail: {
      en: 'Elected to coordinate student projects, organise meetings and contribute to the institute’s planning.',
      vi: 'Được bầu để điều phối các dự án sinh viên, tổ chức họp và tham gia hoạch định của viện.',
    },
  },
];

/** Newest first. */
export const achievementsByDate = [...achievements].sort((a, b) => b.date.localeCompare(a.date));
