import { profile, socials, education } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';

/**
 * Person schema, so a search engine resolves the site to a named human rather
 * than guessing. Facts come from content/cv.ts, same as everything else.
 */
export function JsonLd({ locale }: { locale: AppLocale }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: profile.nameVi,
    url: `${SITE_URL}/${locale}`,
    // The same face the header, the tab icon and the hero use.
    image: `${SITE_URL}/img/avatar.webp`,
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
