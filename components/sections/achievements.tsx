import { getLocale, getTranslations } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import { achievementsByDate, type AchievementKind } from '@/content/achievements';
import type { AppLocale } from '@/i18n/routing';
import { formatMonth } from '@/lib/utils';
import { Section, SectionHeader } from './section-header';

const KIND_LABEL: Record<AchievementKind, { en: string; vi: string }> = {
  award: { en: 'Award', vi: 'Giải thưởng' },
  certificate: { en: 'Certificate', vi: 'Chứng chỉ' },
  publication: { en: 'Published', vi: 'Công bố' },
  academic: { en: 'Academic', vi: 'Học thuật' },
  role: { en: 'Role', vi: 'Vai trò' },
};

/** The list spans the full width; each row carries the rail internally. */
function SectionBodyList({ children }: { children: React.ReactNode }) {
  return <ul className="border-rule mt-[var(--space-block)] border-b">{children}</ul>;
}

export async function Achievements() {
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;

  return (
    <Section id="achievements">
      <SectionHeader id="achievements" label={t('achievements')} lead={ts('achievementsLead')} />

      {achievementsByDate.length === 0 ? (
        <p className="text-ink-3 mt-10 sm:ml-[calc(var(--rail)+2.5rem)]">
          {ts('achievementsEmpty')}
        </p>
      ) : (
        <SectionBodyList>
          {achievementsByDate.map((item) => {
            const Wrapper = item.href ? 'a' : 'div';
            return (
              <li key={item.id} className="border-rule border-t">
                <Wrapper
                  {...(item.href ? { href: item.href, target: '_blank', rel: 'noreferrer' } : {})}
                  className="rail-grid group py-5"
                >
                  <div className="flex flex-row gap-4 md:flex-col md:gap-1.5">
                    <span className="label !text-ink tabular-nums">
                      {formatMonth(item.date, locale)}
                    </span>
                    <span className="label !text-teal">{KIND_LABEL[item.kind][locale]}</span>
                  </div>

                  <div>
                    <h3 className="text-ink group-hover:text-indigo flex items-baseline gap-2 text-[1.02rem] font-medium transition-colors">
                      {item.title[locale]}
                      {item.href && (
                        <ExternalLink
                          size={12}
                          strokeWidth={2}
                          aria-hidden
                          className="text-ink-3 shrink-0"
                        />
                      )}
                    </h3>
                    <p className="label mt-1 !tracking-normal !normal-case">{item.issuer}</p>
                    {item.detail && (
                      <p className="text-ink-2 mt-2.5 max-w-prose text-[0.94rem] leading-relaxed">
                        {item.detail[locale]}
                      </p>
                    )}
                  </div>
                </Wrapper>
              </li>
            );
          })}
        </SectionBodyList>
      )}
    </Section>
  );
}
