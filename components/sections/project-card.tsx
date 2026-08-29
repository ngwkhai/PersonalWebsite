import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Project } from '@/lib/content';

/**
 * Card layout follows the notebook rail: year and kicker sit in the margin,
 * the claim and its evidence sit in the column. No 01/02/03 numbering — the
 * projects are not a sequence, but the year is real ordered information.
 */
export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article className="group border-rule border-t">
      <Link
        href={`/work/${project.slug}`}
        className="grid gap-6 py-8 sm:grid-cols-[var(--rail)_1fr] sm:gap-10 sm:py-10"
      >
        <div className="flex gap-4 sm:flex-col sm:gap-2">
          <span className="label !text-ink tabular-nums">{project.year}</span>
          <span className="label">{project.kicker}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_15rem] md:items-start md:gap-10">
          <div>
            <h3 className="font-display text-h2 text-ink group-hover:text-indigo leading-[1.08] transition-colors">
              {project.title}
            </h3>
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

          <div className="bg-sunk relative aspect-4/3 overflow-hidden md:aspect-3/2">
            <Image
              src={project.cover}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 15rem"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
