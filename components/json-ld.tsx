import { profile, socials, education } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';

/**
 * Person schema, so a search engine resolves the site to a named human rather
 * than guessing. Facts come from content/cv.ts, same as everything else.
 */
export function JsonLd({ locale }: { locale: AppLocale }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngwkhai.dev';

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: profile.nameVi,
    url: `${base}/${locale}`,
    jobTitle: profile.headline[locale],
    description: profile.bio[locale].slice(0, 300),
    knowsLanguage: ['vi', 'en'],
    sameAs: socials.map((s) => s.href),
    alumniOf: education.map((e) => ({
      '@type': 'CollegeOrUniversity',
      name: e.organisation,
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
