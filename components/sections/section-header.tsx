import { cn } from '@/lib/utils';

/**
 * The page was previously a single unbroken field of off-white, so seven
 * sections read as one long undifferentiated scroll. Alternating the ground
 * gives the eye a place to rest and makes the structure legible without adding
 * any decoration.
 */
export function Section({
  id,
  band = false,
  children,
  className,
}: {
  id: string;
  band?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        'scroll-mt-28 py-[var(--space-section)]',
        band && 'border-rule bg-sunk border-y',
        className,
      )}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

/**
 * Every section opens the same way: a mono label in the notebook rail, a
 * display-face lead in the column. One component so seven sections read as one
 * document rather than seven pages stacked.
 */
export function SectionHeader({
  id,
  label,
  lead,
  action,
}: {
  id?: string;
  label: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rail-grid">
      <h2 id={id ? `${id}-heading` : undefined} className="label !text-ink pt-1.5">
        {label}
      </h2>
      {(lead || action) && (
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          {lead && (
            // A display-face lead needs a tighter measure than body prose:
            // 62ch at this size runs the full column and strands orphans.
            <p className="text-h3 font-display text-ink-2 max-w-[42ch] leading-[1.3]">{lead}</p>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/** The body of a section, aligned to the content column of the rail grid. */
export function SectionBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rail-grid mt-[var(--space-block)]', className)}>
      <div aria-hidden className="hidden md:block" />
      <div>{children}</div>
    </div>
  );
}
