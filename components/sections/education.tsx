import { getLocale, getTranslations } from 'next-intl/server';
import { education } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';
import { InstitutionEntry } from './institution-entry';
import { Section, SectionHeader } from './section-header';

/**
 * Education opens the page, before Skills: it is the first thing a recruiter
 * checks, and it used to be buried as a subgroup inside Experience.
 */
export async function Education() {
  const t = await getTranslations('nav');
  const locale = (await getLocale()) as AppLocale;

  return (
    <Section id="education">
      <SectionHeader id="education" label={t('education')} />

      <ul className="border-rule mt-[var(--space-block)] border-b">
        {education.map((item) => (
          <InstitutionEntry key={item.organisation} item={item} locale={locale} />
        ))}
      </ul>
    </Section>
  );
}
