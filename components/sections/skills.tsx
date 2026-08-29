import { getLocale, getTranslations } from 'next-intl/server';
import { skills } from '@/content/cv';
import { getProjects } from '@/lib/content';
import { tokenize } from '@/lib/ai/tokenize';
import type { AppLocale } from '@/i18n/routing';
import { Section, SectionHeader } from './section-header';

/**
 * Skills, with the receipts attached.
 *
 * A tag cloud claims; this counts. Each skill shows how many of the seven case
 * studies actually use it, computed from their `stack` and `tags` rather than
 * asserted — so the section cannot drift from the work it summarises, and a
 * skill nothing evidences shows a zero instead of quietly passing.
 */
export async function Skills() {
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;
  const projects = getProjects(locale);

  // Everything a project says about itself, tokenised once. Matching only
  // against `stack` and `tags` under-counted badly: "Diacritic restoration" is
  // the entire subject of a case study but appears in its title and summary
  // rather than its tag list.
  const evidence = projects.map(
    (project) =>
      new Set(
        tokenize(
          [
            project.title,
            project.summary,
            project.kicker,
            ...project.stack,
            ...project.tags,
            ...project.metrics.map((metric) => metric.label),
            // The case study body is evidence too — "CUDA profiling" is a
            // finding in the prose, not a frontmatter tag.
            project.raw,
          ].join(' '),
        ),
      ),
  );

  const usage = (skill: string) => {
    // A slash means "or" — "YOLOv5 / YOLOv1" is two skills sharing a row, and
    // requiring both would score it zero.
    const alternatives = skill
      .split('/')
      .map((part) => tokenize(part))
      .filter((tokens) => tokens.length > 0);
    if (alternatives.length === 0) return 0;

    return evidence.filter((blob) =>
      alternatives.some((tokens) => tokens.every((token) => blob.has(token))),
    ).length;
  };

  return (
    <Section id="skills">
      <SectionHeader id="skills" label={t('skills')} lead={ts('skillsLead')} />

      <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-[var(--rail)_1fr] sm:gap-y-12">
        <div aria-hidden className="hidden sm:block" />
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {skills.map((group) => (
            <div key={group.id}>
              <h3 className="label border-rule !text-teal border-b pb-2">{group.label[locale]}</h3>
              <ul className="mt-3">
                {group.items.map((item) => {
                  const count = usage(item);
                  return (
                    <li
                      key={item}
                      className="border-rule/60 flex items-baseline justify-between gap-4 border-b py-1.5"
                    >
                      <span className="text-ink-2 font-mono text-[0.84rem]">{item}</span>
                      <span className="label shrink-0 tabular-nums" title={ts('usedIn', { count })}>
                        {count > 0 ? `${count}×` : '—'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="label mt-8 !tracking-normal !normal-case sm:ml-[calc(var(--rail)+3rem)]">
        {ts('skillsFootnote')}
      </p>
    </Section>
  );
}
