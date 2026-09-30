import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { ResolvingImage } from '@/components/resolving-image';
import { Link } from '@/i18n/navigation';
import type { Project } from '@/lib/content';

type Level = 2 | 3 | 4;

/**
 * Card layout follows the notebook rail: year and kicker sit in the margin,
 * the claim and its evidence sit in the column. No 01/02/03 numbering — the
 * projects are not a sequence, but the year is real ordered information.
 *
 * The title's link is stretched over the whole card rather than the card being
 * one link, so a live project can carry a second, real link to its demo — an
 * anchor inside an anchor is invalid, and browsers split it apart.
 */
export function ProjectCard({
  project,
  priority = false,
  level = 3,
}: {
  project: Project;
  priority?: boolean;
  level?: Level;
}) {
  const t = useTranslations('project');
  const Heading = `h${level}` as const;

  return (
    <article className="group border-rule relative border-t">
      <div className="rail-grid py-7">
        <div className="flex flex-row flex-wrap items-baseline gap-x-4 gap-y-2 md:flex-col md:gap-2">
          <span className="label !text-ink tabular-nums">{project.year}</span>
          <span className="label">{project.kicker}</span>
          {project.live && project.demo && (
            // The label is 17px tall, and a thumb that misses it lands on the
            // card's own link and opens the case study instead. The pseudo
            // element widens what can be tapped to 33px without moving layout.
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${t('tryLive')} — ${new URL(project.demo).host}`}
              className="label !text-teal hover:!text-ink relative z-10 inline-flex items-center gap-1.5 transition-colors after:absolute after:-inset-x-2 after:-inset-y-2 md:mt-1"
            >
              <span aria-hidden className="bg-teal inline-block size-1.5 rounded-full" />
              {t('tryLive')}
              <ArrowUpRight size={11} strokeWidth={2} aria-hidden />
            </a>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start md:gap-10">
          <div>
            <Heading className="font-display text-h2 text-ink group-hover:text-indigo leading-[1.08] transition-colors">
              {/* z-1 lifts the overlay over the cover, whose wrapper is
                  positioned and would otherwise swallow clicks on the image. */}
              <Link
                href={`/projects/${project.slug}`}
                className="after:absolute after:inset-0 after:z-1"
              >
                {project.title}
              </Link>
            </Heading>
            <p className="text-ink-2 mt-3 max-w-prose text-[0.95rem] leading-relaxed">
              {project.summary}
            </p>

            {project.metrics.length > 0 && (
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {project.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt className="label">{metric.label}</dt>
                    <dd className="text-ink font-mono text-lg tabular-nums">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <ResolvingImage
            src={project.cover}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 15rem"
            wrapperClassName="aspect-3/2 bg-sunk"
            className="object-cover group-hover:scale-[1.03]"
          />
        </div>
      </div>
    </article>
  );
}

/**
 * One group of cards under its own label. Headings step down from the page's,
 * so the outline reads page → group → project wherever the list is placed.
 */
export function ProjectList({
  label,
  projects,
  level,
  live = false,
  priorityFirst = false,
  className,
}: {
  label: string;
  projects: Project[];
  level: 2 | 3;
  /** Marks the group with the same dot its cards' demo links carry. */
  live?: boolean;
  priorityFirst?: boolean;
  className?: string;
}) {
  if (projects.length === 0) return null;
  const Heading = `h${level}` as const;

  return (
    <div className={className}>
      <Heading className="label mb-5 flex items-center gap-2">
        {live && <span aria-hidden className="bg-teal inline-block size-1.5 rounded-full" />}
        {label} <span className="text-ink-3 tabular-nums">· {projects.length}</span>
      </Heading>
      <div className="border-rule border-b">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            level={(level + 1) as Level}
            priority={priorityFirst && index === 0}
          />
        ))}
      </div>
    </div>
  );
}
