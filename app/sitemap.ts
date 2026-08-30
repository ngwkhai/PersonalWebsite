import type { MetadataRoute } from 'next';
import { allProjects, allWriting } from '@/lib/content';
import { locales } from '@/i18n/routing';

import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = (path: string) => ({
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
    ),
  });

  const staticPaths = ['', '/work', '/writing', '/resume', '/colophon'];

  return [
    ...locales.flatMap((locale) =>
      staticPaths.map((path) => ({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: path === '' ? 1 : 0.7,
        alternates: alternates(path),
      })),
    ),
    ...allProjects.map((project) => ({
      url: `${SITE_URL}${project.permalink}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
      alternates: alternates(`/work/${project.slug}`),
    })),
    ...allWriting
      .filter((post) => !post.draft)
      .map((post) => ({
        url: `${SITE_URL}${post.permalink}`,
        lastModified: new Date(post.date),
        changeFrequency: 'yearly' as const,
        priority: 0.6,
      })),
  ];
}
