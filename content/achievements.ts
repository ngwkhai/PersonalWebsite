/**
 * Achievements, certificates and awards.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * TO ADD YOUR OWN: append entries to the array below. Everything else — the
 * homepage section, the agent's knowledge index, the HTML resume — reads from
 * here, so one edit updates all three.
 *
 * Nothing here is invented: an agent that cites a certificate you do not hold
 * is worse than no agent. Entries carry the granularity they were awarded at —
 * a bare year where only a year is known, `YYYY-MM` where the month is.
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
  /** `YYYY` or `YYYY-MM`. Used for ordering and display. */
  readonly date: string;
  readonly detail?: Localized;
  /** Verification link — a credential URL, a published notebook, a certificate. */
  readonly href?: string;
}

export const achievements: readonly Achievement[] = [
  {
    id: 'ssr-ai-2026',
    kind: 'award',
    title: {
      en: 'Third Prize, Student Scientific Research Award — Artificial Intelligence',
      vi: 'Giải Ba, Giải thưởng Nghiên cứu khoa học sinh viên — Trí tuệ Nhân tạo',
    },
    issuer: 'VNU University of Engineering and Technology',
    date: '2026',
  },
  {
    id: 'humanitarian-logistics-hackathon-2026',
    kind: 'award',
    title: {
      en: 'Third Prize, Student Track — Humanitarian Logistics Hackathon',
      vi: 'Giải Ba, Bảng Sinh viên — Humanitarian Logistics Hackathon',
    },
    issuer: 'Humanitarian Logistics Hackathon',
    date: '2026',
  },
  {
    id: 'uet-encouragement-scholarship-2024',
    kind: 'academic',
    title: {
      en: 'Academic Encouragement Scholarship',
      vi: 'Học bổng Khuyến khích học tập',
    },
    issuer: 'University of Engineering and Technology',
    date: '2024',
  },
  {
    id: 'thai-nguyen-physics-2023',
    kind: 'award',
    title: {
      en: 'Second Prize, Provincial Excellent Student Contest in Physics',
      vi: 'Giải Nhì, Kỳ thi Học sinh giỏi cấp tỉnh môn Vật lý',
    },
    issuer: 'Thai Nguyen Province',
    date: '2023',
  },
  {
    id: 'thai-nguyen-informatics-2021',
    kind: 'award',
    title: {
      en: 'Third Prize, Provincial Excellent Student Contest in Informatics',
      vi: 'Giải Ba, Kỳ thi Học sinh giỏi cấp tỉnh môn Tin học',
    },
    issuer: 'Thai Nguyen Province',
    date: '2021',
  },
];

/** Newest first. */
export const achievementsByDate = [...achievements].sort((a, b) => b.date.localeCompare(a.date));
