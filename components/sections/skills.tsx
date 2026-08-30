import { getLocale, getTranslations } from 'next-intl/server';
import { skills } from '@/content/cv';
import { getProjects } from '@/lib/content';
import { tokenize } from '@/lib/ai/tokenize';
import type { AppLocale } from '@/i18n/routing';
import { Section, SectionHeader, SectionBody } from './section-header';

/**
 * The usable middle of the viridis ramp: indigo, teal, green.
 *
 * This is the one place the palette does real work rather than decoration — a
 * bar is coloured by how much of the portfolio evidences that skill, the way a
 * heatmap encodes magnitude, which is the whole reason the site is built on
 * this colormap.
 *
 * The ends are deliberately excluded. viridis-0 is so dark it reads as "no
 * colour", and since most skills sit at the bottom of the range the section
 * came out monotone; viridis-4 is a bright yellow that disappears against a
 * light ground.
 */
const RAMP = [
  'var(--color-viridis-1)',
  'var(--color-viridis-2)',
  'var(--color-viridis-3)',
] as const;

function rampColour(count: number, max: number): string {
  if (count <= 0) return 'transparent';
  const position = max <= 1 ? 1 : (count - 1) / (max - 1);
  return RAMP[Math.round(position * (RAMP.length - 1))]!;
}

export async function Skills() {
  const t = await getTranslations('nav');
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

  const counted = skills.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ name: item, count: usage(item) })),
  }));
  const max = Math.max(1, ...counted.flatMap((g) => g.items.map((i) => i.count)));

  return (
    <Section id="skills" band>
      <SectionHeader id="skills" label={t('skills')} />

      <SectionBody>
        <div className="grid gap-x-14 gap-y-[var(--space-block)] md:grid-cols-2">
          {counted.map((group) => (
            <div key={group.id}>
              <h3 className="label border-rule !text-ink border-b pb-2.5">{group.label[locale]}</h3>
              <ul className="max-w-[27rem]">
                {group.items.map((item) => {
                  const ratio = item.count / max;
                  const colour = rampColour(item.count, max);
                  return (
                    <li
                      key={item.name}
                      className="border-rule/50 grid grid-cols-[1fr_4.5rem_2rem] items-center gap-3 border-b py-2"
                    >
                      <span className="text-ink-2 font-mono text-[0.82rem]">{item.name}</span>
                      <span aria-hidden className="bg-rule/70 h-[3px] w-full rounded-full">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(ratio * 100, item.count > 0 ? 14 : 0)}%`,
                            background: colour,
                          }}
                        />
                      </span>
                      <span className="label justify-self-end tabular-nums">
                        {item.count > 0 ? `${item.count}×` : '—'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </SectionBody>
    </Section>
  );
}
