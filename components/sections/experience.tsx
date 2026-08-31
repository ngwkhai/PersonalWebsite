import { getLocale, getTranslations } from 'next-intl/server';
import { experience, leadership, type Institution } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';
import { InstitutionEntry } from './institution-entry';
import { Section, SectionHeader } from './section-header';

export async function Experience() {
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;

  // Education is its own section now; what remains are the roles he has held.
  const groups: {
    key: 'work' | 'research' | 'leadership';
    items: readonly Institution[];
  }[] = [
    { key: 'work', items: experience.filter((item) => item.kind !== 'research') },
    { key: 'research', items: experience.filter((item) => item.kind === 'research') },
    { key: 'leadership', items: leadership },
  ];

  return (
    <Section id="experience" band>
      <SectionHeader id="experience" label={t('experience')} />

      <div className="mt-[var(--space-block)] space-y-[var(--space-block)]">
        {groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div key={group.key}>
              <h3 className="label !text-teal">{ts(group.key)}</h3>
              <ul className="mt-3">
                {group.items.map((item) => (
                  <InstitutionEntry key={item.organisation} item={item} locale={locale} />
                ))}
              </ul>
            </div>
          ))}
      </div>
    </Section>
  );
}
