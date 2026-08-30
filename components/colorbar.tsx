'use client';

import { useTranslations } from 'next-intl';
import { HOME_SECTIONS, VIRIDIS, SECTION_IDS } from '@/lib/sections';
import { useScrollSpy } from '@/lib/use-scrollspy';

/**
 * A colorbar, in the margin, as the site's scroll indicator.
 *
 * The premise of this design is that the palette is viridis — the matplotlib
 * default, and therefore the colormap on every attention map and confusion
 * matrix in this field. Stating that in a colophon is an assertion; making the
 * colorbar the interface is the thing itself. An ML reader recognises it on
 * sight, and it costs everyone else nothing: it still reads as a progress bar
 * with jump targets.
 *
 * The ramp runs top to bottom, against colorbar convention, because the labels
 * sit beside it in document order and reading direction has to win: the top of
 * the page is the low end. Only the current section is named — the header
 * already lists them all, and a second full list is noise.
 *
 * Desktop only. On a phone there is no margin, and the nav row carries the
 * same targets.
 */
export function Colorbar() {
  const t = useTranslations('nav');
  // Marker, ticks and label all come from one measurement, so they cannot
  // disagree about where in the document the reader is.
  const { active, progress, positions } = useScrollSpy(SECTION_IDS);

  const label = HOME_SECTIONS.find((section) => section.id === active);
  const key = new Map<string, (typeof HOME_SECTIONS)[number]['key']>(
    HOME_SECTIONS.map((section) => [section.id, section.key]),
  );

  return (
    // aria-hidden, and its links are not tabbable: every target here is
    // already in the header nav, which announces the current section with
    // aria-current. A second complementary landmark saying the same thing
    // would be noise for a screen reader — and would collide with the chat
    // dock's landmark in tests.
    <div aria-hidden className="fixed top-1/2 left-7 z-40 hidden -translate-y-1/2 xl:block">
      <div className="relative" style={{ height: '46vh' }}>
        <div
          aria-hidden
          className="ring-rule h-full w-[6px] rounded-full ring-1"
          style={{ background: `linear-gradient(to bottom, ${VIRIDIS.join(', ')})` }}
        />

        {/* Ticks sit where each section actually starts, not at even
            intervals — otherwise the marker drifts away from the tick of the
            section it claims you are in. */}
        {positions.map((position) => (
          <a
            key={position.id}
            href={`#${position.id}`}
            tabIndex={-1}
            title={key.has(position.id) ? t(key.get(position.id)!) : undefined}
            className="group absolute -left-1 flex h-3 items-center"
            style={{ top: `${position.at * 100}%` }}
          >
            <span className="bg-ink-3 group-hover:bg-ink h-px w-3.5 transition-colors" />
          </a>
        ))}

        {/* Position marker, and the only label — the section you are in. */}
        <div
          className="pointer-events-none absolute -left-[5px] flex items-center gap-2.5 transition-[top] duration-150 ease-out"
          style={{ top: `${progress * 100}%` }}
        >
          <span aria-hidden className="bg-ink h-[2px] w-4" />
          {label && (
            <span className="label !text-ink leading-none whitespace-nowrap">{t(label.key)}</span>
          )}
        </div>

        {/* Axis ends, the way a colorbar is annotated. */}
        <span aria-hidden className="label absolute -top-5 left-0">
          0.0
        </span>
        <span aria-hidden className="label absolute -bottom-5 left-0">
          1.0
        </span>
      </div>
    </div>
  );
}
