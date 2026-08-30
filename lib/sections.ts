/**
 * The homepage section order, shared by the page and the pinned nav so the two
 * can never disagree about what exists or in what order.
 *
 * `key` indexes the `nav` message namespace.
 */
export const HOME_SECTIONS = [
  { id: 'skills', key: 'skills' },
  { id: 'work', key: 'work' },
  { id: 'achievements', key: 'achievements' },
  { id: 'experience', key: 'experience' },
  { id: 'writing', key: 'writing' },
  { id: 'resume', key: 'resume' },
  { id: 'contact', key: 'contact' },
] as const;

/**
 * Viridis, sampled. The page walks this ramp as you scroll: the colorbar in
 * the margin shows where you are, and each section takes its accent from the
 * same position. Colour therefore encodes depth into the document rather than
 * decorating it.
 *
 * Sampled from the middle of the ramp — the ends are unusable as ink, being
 * either near-black or a yellow that vanishes on a light ground.
 */
export const VIRIDIS = [
  'oklch(0.32 0.11 300)',
  'oklch(0.42 0.13 285)',
  'oklch(0.46 0.11 262)',
  'oklch(0.5 0.09 220)',
  'oklch(0.5 0.09 191)',
  'oklch(0.53 0.11 165)',
  'oklch(0.55 0.13 145)',
] as const;

/** Accent for a section, by its position in the document. */
export function sectionAccent(index: number): string {
  return VIRIDIS[Math.min(VIRIDIS.length - 1, Math.max(0, index))]!;
}

export type SectionId = (typeof HOME_SECTIONS)[number]['id'];
export const SECTION_IDS = HOME_SECTIONS.map((section) => section.id);
