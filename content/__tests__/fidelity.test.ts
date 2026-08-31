import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { projects } from '#content';
import { profile, education, experience, leadership } from '../cv';

/**
 * The rewrite must not quietly change what the previous site said about him.
 *
 * These exist because it already happened twice: seven project titles were
 * replaced with editorial headlines, and an education entry gained a coursework
 * line that appears nowhere in the original. A project's name is a fact — it
 * matches his repositories, and a recruiter who searches one should find the
 * other — not copy to be improved.
 */
const legacy = readFileSync('legacy/index.html', 'utf8');
const legacyText = legacy.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** Verbatim from legacy/index.html. */
const PROJECT_NAMES: Record<string, string> = {
  'neural-machine-translation': 'Neural Machine Translation',
  'license-plate-recognition': 'License Plate Recognition System',
  'quantitative-trading-system': 'Quantitative Trading System',
  'credit-card-fraud-detection': 'Credit Card Fraud Detection',
  'text-sentiment-classification': 'Large-Scale Text Sentiment Classification',
  'yolov1-cbam': 'YOLOv1 With CBAM From Scratch',
  'gpu-inference-optimization': 'Optimization for AI Inference Engines on GPUs',
};

/**
 * Entries Khai added after the rewrite, from his own account rather than from
 * the previous site. They are listed here by name so the fidelity checks below
 * still hold every legacy entry to the original wording: a new organisation
 * has to be declared here deliberately, it cannot slip in by being unmatched.
 */
const ADDED_SINCE_LEGACY = new Set(['Viettel Networks', 'VinSmart Feature']);

/** Every headline figure the previous site published. */
const METRICS = [
  '12.5M',
  '81.31',
  '88.57',
  '12 FPS',
  '3.4M',
  '92.75%',
  '92.50%',
  '284,807',
  '492',
  '0.172%',
  '0.9817',
  '0.735',
  '0.816',
  '0.9744',
  '1.6M',
  '269,168,434',
  '0.8829',
  '0.6994',
  '1202',
];

describe('fidelity to the previous site', () => {
  it('keeps every project under its original name, in both locales', () => {
    for (const project of projects) {
      expect(
        project.title,
        `${project.locale}/${project.slug} was renamed — project names are facts, not copy`,
      ).toBe(PROJECT_NAMES[project.slug]);
    }
  });

  it('covers all seven projects and no others', () => {
    const slugs = [...new Set(projects.map((p) => p.slug))].sort();
    expect(slugs).toEqual(Object.keys(PROJECT_NAMES).sort());
  });

  it('still publishes every metric the previous site did', () => {
    const site = [
      ...projects.map((p) => `${p.summary} ${p.raw} ${p.metrics.map((m) => m.value).join(' ')}`),
      JSON.stringify([profile, education, experience, leadership]),
    ]
      .join(' ')
      .replace(/\s+/g, ' ');

    const missing = METRICS.filter((metric) => !site.includes(metric));
    expect(missing, 'a figure from the original site is no longer published').toEqual([]);
  });

  it('does not invent biography that the original never claimed', () => {
    // Each factual detail line must be traceable to the previous site.
    const claims = [...education, ...experience, ...leadership]
      .filter((entry) => !ADDED_SINCE_LEGACY.has(entry.organisation))
      .flatMap((entry) => entry.detail.map((line) => line.en));

    const unsupported = claims.filter((claim) => {
      // Compare on the distinctive opening of the claim; the original wraps
      // and punctuates differently, so a whole-string match would be brittle.
      const probe = claim.replace(/\s+/g, ' ').slice(0, 40);
      return !legacyText.includes(probe);
    });

    expect(unsupported, 'this detail appears nowhere in legacy/index.html').toEqual([]);
  });

  it('keeps the organisations and roles the original listed', () => {
    for (const entry of [...education, ...experience, ...leadership]) {
      if (ADDED_SINCE_LEGACY.has(entry.organisation)) continue;
      expect(legacyText, `${entry.organisation} is not in the original`).toContain(
        entry.organisation,
      );
    }
  });

  it('reproduces every project description line, word for word', () => {
    // The rewrite compressed four to six bullets per project into a single
    // summary sentence, so from the site it looked as though the detail had
    // been deleted. These are his own words about his own work.
    const legacyPoints = [...legacy.matchAll(/projects__description">([\s\S]*?)<\/p>/g)].map(
      (match) =>
        match[1]!
          .split(/<br\s*\/?>/)
          .map((line) =>
            line
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
          )
          .filter(Boolean),
    );

    const order = [
      'neural-machine-translation',
      'license-plate-recognition',
      'quantitative-trading-system',
      'credit-card-fraud-detection',
      'text-sentiment-classification',
      'yolov1-cbam',
      'gpu-inference-optimization',
    ];

    expect(legacyPoints).toHaveLength(order.length);

    for (const [index, slug] of order.entries()) {
      const project = projects.find((p) => p.slug === slug && p.locale === 'en')!;
      expect(project.points, `${slug} lost description lines`).toEqual(legacyPoints[index]);
    }
  });

  it('keeps the same number of description lines in both locales', () => {
    for (const slug of [...new Set(projects.map((p) => p.slug))]) {
      const en = projects.find((p) => p.slug === slug && p.locale === 'en')!;
      const vi = projects.find((p) => p.slug === slug && p.locale === 'vi')!;
      expect(vi.points.length, `${slug} is missing a translated line`).toBe(en.points.length);
    }
  });

  it('still shows the contact line the original ended on', () => {
    expect(legacyText).toContain(profile.contactNote.en);
  });
});
