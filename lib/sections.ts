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

export type SectionId = (typeof HOME_SECTIONS)[number]['id'];
export const SECTION_IDS = HOME_SECTIONS.map((section) => section.id);
