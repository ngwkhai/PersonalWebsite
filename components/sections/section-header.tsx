import { cn } from '@/lib/utils';

/**
 * Every homepage section opens the same way: a mono label in the notebook rail
 * and a display-face lead in the column. Keeping it in one component is what
 * makes seven sections read as one document rather than seven pages stacked.
 */
export function SectionHeader({
  id,
  label,
  lead,
  action,
  className,
}: {
  id?: string;
  label: string;
  lead?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-[var(--rail)_1fr] sm:gap-10', className)}>
      <h2 id={id ? `${id}-heading` : undefined} className="label !text-ink">
        {label}
      </h2>
      {(lead || action) && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          {lead && <p className="font-display text-h3 text-ink-2 max-w-2xl leading-snug">{lead}</p>}
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Sections are scroll targets for the pinned nav, so they carry scroll-margin
 * for the fixed header rather than relying on the smooth-scroll offset alone —
 * a deep link pasted into the address bar has no JavaScript to help it.
 */
export function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn('mx-auto max-w-[88rem] scroll-mt-28 px-5 py-14 sm:px-8 sm:py-20', className)}
    >
      {children}
    </section>
  );
}
