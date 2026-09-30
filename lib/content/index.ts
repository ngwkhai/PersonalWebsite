import { projects as allProjects, writing as allWriting } from '#content';
import type { AppLocale } from '@/i18n/routing';

export type Project = (typeof allProjects)[number];
export type Post = (typeof allWriting)[number];

const byOrder = (a: Project, b: Project) => a.order - b.order;

export function getProjects(locale: AppLocale): Project[] {
  return allProjects.filter((p) => p.locale === locale).sort(byOrder);
}

export function getFeaturedProjects(locale: AppLocale): Project[] {
  return getProjects(locale).filter((p) => p.featured);
}

/**
 * Deployed products first, then the research. The two are shown apart because
 * they are proved differently: one by a link that works, the other by a number.
 */
export function groupProjects(projects: Project[]): { live: Project[]; research: Project[] } {
  return {
    live: projects.filter((p) => p.live),
    research: projects.filter((p) => !p.live),
  };
}

export function getProject(locale: AppLocale, slug: string): Project | undefined {
  return allProjects.find((p) => p.locale === locale && p.slug === slug);
}

/** Every slug in every locale — used by generateStaticParams. */
export function allProjectParams(): { locale: AppLocale; slug: string }[] {
  return allProjects.map((p) => ({ locale: p.locale as AppLocale, slug: p.slug }));
}

/** Wraps around, so the last case study still offers somewhere to go next. */
export function getNextProject(locale: AppLocale, slug: string): Project | undefined {
  const list = getProjects(locale);
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return undefined;
  return list[(index + 1) % list.length];
}

export function getPosts(locale: AppLocale): Post[] {
  return allWriting
    .filter((p) => p.locale === locale && !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(locale: AppLocale, slug: string): Post | undefined {
  return allWriting.find((p) => p.locale === locale && p.slug === slug);
}

/** Both locales, for the knowledge index and the sitemap. */
export { allProjects, allWriting };
