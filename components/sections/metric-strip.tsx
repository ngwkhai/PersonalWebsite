import type { Project } from '@/lib/content';

/**
 * The result, given the weight the result deserves. A case study without its
 * numbers above the fold is a blog post; this is the difference.
 */
export function MetricStrip({ metrics }: { metrics: Project['metrics'] }) {
  if (metrics.length === 0) return null;

  return (
    <dl className="border-rule mt-14 grid gap-x-10 gap-y-8 border-y py-8 sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <div key={metric.label}>
          <dt className="label">{metric.label}</dt>
          <dd
            className={
              index === 0
                ? 'text-ink flare mt-1.5 w-fit font-mono text-3xl tabular-nums'
                : 'text-ink mt-1.5 font-mono text-3xl tabular-nums'
            }
          >
            {metric.value}
          </dd>
          {metric.note && <dd className="text-ink-3 mt-1.5 text-[0.82rem]">{metric.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
