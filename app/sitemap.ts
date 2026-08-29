import type { MetadataRoute } from 'next';
import { allProjects, allWriting } from '@/lib/content';
import { locales } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngwkhai.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = (path: string) => ({
    languages: Object.fromEntries(locales.map((locale) => [locale, `${BASE}/${locale}${path}`])),
  });

  const staticPaths = ['', '/work', '/writing', '/resume', '/colophon'];

  return [
    ...locales.flatMap((locale) =>
      staticPaths.map((path) => ({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: path === '' ? 1 : 0.7,
        alternates: alternates(path),
      })),
    ),
    ...allProjects.map((project) => ({
      url: `${BASE}${project.permalink}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
      alternates: alternates(`/work/${project.slug}`),
    })),
    ...allWriting
      .filter((post) => !post.draft)
      .map((post) => ({
        url: `${BASE}${post.permalink}`,
        lastModified: new Date(post.date),
        changeFrequency: 'yearly' as const,
        priority: 0.6,
      })),
  ];
}
