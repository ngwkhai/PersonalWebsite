import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { profile, education, experience, leadership, skills, type Institution } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';
import { formatMonth } from '@/lib/utils';

function Entry({ item, locale }: { item: Institution; locale: AppLocale }) {
  const from = formatMonth(item.start, locale);
  const to = item.end ? formatMonth(item.end, locale) : locale === 'vi' ? 'Nay' : 'Present';

  return (
    <li className="border-rule grid gap-4 border-t py-7 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
      <p className="label tabular-nums">
        {from} — {to}
      </p>
      <div className="flex gap-5">
        <Image
          src={item.logo}
          alt=""
          width={44}
          height={44}
          className="mt-0.5 size-11 shrink-0 object-contain"
        />
        <div>
          <h3 className="text-ink text-[1.05rem] font-semibold">{item.organisation}</h3>
          <p className="text-teal mt-0.5 text-[0.95rem]">{item.role[locale]}</p>
          <ul className="mt-3 space-y-2">
            {item.detail.map((line) => (
              <li key={line.en} className="text-ink-2 max-w-prose text-[0.95rem] leading-relaxed">
                {line[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

export async function About() {
  const t = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;

  const bio = profile.bio[locale];
  const split = bio.indexOf('. ') + 1;
  const lede = bio.slice(0, split);
  const rest = bio.slice(split).trim();

  const groups = [
    { key: 'education', items: education },
    { key: 'experience', items: experience },
    { key: 'leadership', items: leadership },
  ] as const;

  return (
    <section id="about" className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-[var(--rail)_1fr]">
        <h2 className="label !text-ink">{t('about')}</h2>
        <div>
          {/* First sentence as a display lede, the rest in the body face —
              Fraunces at paragraph length is handsome and hard to read. */}
          <p className="font-display text-h3 text-ink max-w-[42ch] leading-[1.25]">{lede}</p>
          <p className="text-ink-2 mt-6 max-w-[64ch] text-[1.02rem] leading-[1.72]">{rest}</p>

          <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {skills.map((group) => (
              <div key={group.id}>
                <h3 className="label !text-teal">{group.label[locale]}</h3>
                {/* Interpuncts, not whitespace: an unseparated run of mono
                    terms reads as one long string. */}
                <ul className="mt-3 flex flex-wrap items-center gap-y-1.5">
                  {group.items.map((item, index) => (
                    <li key={item} className="text-ink-2 font-mono text-[0.8rem]">
                      {index > 0 && <span className="text-rule mx-2">·</span>}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="mt-16 grid gap-6 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
          <h2 className="label !text-ink">{t(group.key)}</h2>
          <ul className="sm:col-span-2 sm:col-start-1">
            {group.items.map((item) => (
              <Entry key={item.organisation} item={item} locale={locale} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
