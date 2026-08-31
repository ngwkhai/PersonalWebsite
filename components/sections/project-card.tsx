import { ResolvingImage } from '@/components/resolving-image';
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
      <Link href={`/projects/${project.slug}`} className="rail-grid py-7">
        <div className="flex flex-row gap-4 md:flex-col md:gap-2">
          <span className="label !text-ink tabular-nums">{project.year}</span>
          <span className="label">{project.kicker}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start md:gap-10">
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

          <ResolvingImage
            src={project.cover}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 15rem"
            wrapperClassName="aspect-4/3 md:aspect-[5/4] bg-sunk"
            className="object-cover group-hover:scale-[1.03]"
          />
        </div>
      </Link>
    </article>
  );
}
