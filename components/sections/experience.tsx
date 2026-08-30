import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { education, experience, leadership, type Institution } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';
import { formatMonth } from '@/lib/utils';
import { Section, SectionHeader } from './section-header';

function Entry({ item, locale }: { item: Institution; locale: AppLocale }) {
  const from = formatMonth(item.start, locale);
  const to = item.end ? formatMonth(item.end, locale) : locale === 'vi' ? 'Nay' : 'Present';

  return (
    <li className="border-rule grid gap-4 border-t py-6 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
      <p className="label tabular-nums">
        {from} — {to}
      </p>
      <div className="flex gap-5">
        <span className="ring-rule mt-0.5 grid h-10 w-20 shrink-0 place-items-center rounded-sm bg-white px-2 ring-1">
          <Image
            src={item.logo}
            alt=""
            width={112}
            height={48}
            className="max-h-7 w-auto object-contain"
          />
        </span>
        <div>
          <h4 className="text-ink text-[1.02rem] font-semibold">{item.organisation}</h4>
          <p className="text-teal mt-0.5 text-[0.94rem]">{item.role[locale]}</p>
          <ul className="mt-2.5 space-y-2">
            {item.detail.map((line) => (
              <li key={line.en} className="text-ink-2 max-w-prose text-[0.94rem] leading-relaxed">
                {line[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

export async function Experience() {
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;

  // The section is already headed "Experience"; naming the first subgroup the
  // same thing printed the word twice. "Research" is what the NLP Lab entry is.
  const groups: {
    key: 'research' | 'education' | 'leadership';
    items: readonly Institution[];
  }[] = [
    { key: 'research', items: experience },
    { key: 'education', items: education },
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
                  <Entry key={item.organisation} item={item} locale={locale} />
                ))}
              </ul>
            </div>
          ))}
      </div>
    </Section>
  );
}
