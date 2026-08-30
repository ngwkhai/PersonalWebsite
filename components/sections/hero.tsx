'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { openChat } from '@/lib/ui-events';
import { stripDiacritics, cn } from '@/lib/utils';

const NAME = 'Nguyễn Đình Khải';
const DURATION = 1100;
const HOLD = 180;

const CHARS = Array.from(NAME);

/** Indices where the accented name differs from its stripped form. */
const TARGETS: readonly number[] = CHARS.reduce<number[]>((acc, char, index) => {
  if (stripDiacritics(char) !== char) acc.push(index);
  return acc;
}, []);
const TARGET_SET = new Set(TARGETS);

/**
 * Grouped into words with their absolute character indices. Each glyph needs
 * its own element to animate, but a run of inline-blocks breaks anywhere — the
 * name would wrap as "Kh / ai". Words are the unbreakable unit.
 */
const WORDS: { char: string; index: number }[][] = (() => {
  const words: { char: string; index: number }[][] = [[]];
  CHARS.forEach((char, index) => {
    if (char === ' ') words.push([]);
    else words.at(-1)!.push({ char, index });
  });
  return words;
})();

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The signature of the site.
 *
 * The name arrives stripped of its diacritics and restores itself, character by
 * character — which is the exact task of the Vietnamese diacritic restoration
 * project, performed by the page on its own author's name.
 *
 * Server output is always the correct spelling, so no-JS readers, crawlers and
 * screen readers never see the degraded state; the stripped frame is written in
 * a layout effect, before paint. Under prefers-reduced-motion nothing runs at
 * all.
 */
export function Hero({
  highlights,
  headline,
  bio,
}: {
  highlights: readonly { value: string; label: string }[];
  headline: string;
  bio: string;
}) {
  const t = useTranslations('hero');
  const split = bio.indexOf('. ') + 1;
  const lede = bio.slice(0, split);
  const rest = bio.slice(split).trim();
  const [restored, setRestored] = useState<Set<number>>(() => new Set(TARGETS));
  const [flashing, setFlashing] = useState<Set<number>>(() => new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const play = useCallback(() => {
    clearTimers();
    setRestored(new Set());
    setFlashing(new Set());

    // Restore left to right but with jitter, so it reads as a model decoding
    // rather than a typewriter effect.
    const schedule = TARGETS.map((index, position) => ({
      index,
      at: HOLD + (position / TARGETS.length) * DURATION + Math.random() * 130,
    }));

    let last = 0;
    for (const { index, at } of schedule) {
      last = Math.max(last, at);
      timers.current.push(
        setTimeout(() => {
          setRestored((prev) => new Set(prev).add(index));
          setFlashing((prev) => new Set(prev).add(index));
          timers.current.push(
            setTimeout(() => {
              setFlashing((prev) => {
                const next = new Set(prev);
                next.delete(index);
                return next;
              });
            }, 520),
          );
        }, at),
      );
    }

    // Flagged on completion rather than on start: Strict Mode mounts, cleans up
    // and remounts, and a flag set up front would leave the second mount
    // showing a stripped name with no animation left to restore it.
    timers.current.push(setTimeout(() => sessionStorage.setItem('restored', '1'), last + 600));
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Once per tab. A signature that replays on every navigation is a tic.
    if (sessionStorage.getItem('restored') === '1') return;
    play();
    return clearTimers;
  }, [play]);

  const done = restored.size === TARGETS.length;

  return (
    // id="about" lives here now: the biography moved into the hero, so the
    // separate intro section it used to anchor no longer exists.
    <section id="about" className="shell scroll-mt-28 pt-28 pb-[var(--space-section)] sm:pt-36">
      <div className="rail-grid">
        {/* The lab-notebook margin: metadata lives beside the page, not in it. */}
        <div className="flex flex-row gap-5 md:flex-col md:gap-3 md:pt-4">
          <p className="label flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'inline-block size-1.5 rounded-full transition-colors',
                done ? 'bg-teal' : 'bg-flare animate-pulse',
              )}
            />
            <span aria-live="polite">{done ? t('restored') : t('restoring')}</span>
          </p>
          <button
            type="button"
            onClick={play}
            className="label group hover:text-ink flex w-fit items-center gap-1.5 transition-colors"
          >
            <RotateCw
              size={11}
              strokeWidth={2}
              aria-hidden
              className="transition-transform group-hover:-rotate-180"
            />
            replay
          </button>
        </div>

        {/* items-start so the portrait's top edge lines up with the top of the
            name, rather than floating below it. */}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
          <div>
            <h1 className="font-display text-display text-ink leading-[0.92]">
              {/* The accessible name is the real spelling; spans are visual only. */}
              <span className="sr-only">{NAME}</span>
              <span aria-hidden className="flex flex-wrap gap-x-[0.28em]">
                {WORDS.map((word, wordIndex) => (
                  <span key={wordIndex} className="whitespace-nowrap">
                    {word.map(({ char, index }) => {
                      const show =
                        !TARGET_SET.has(index) || restored.has(index)
                          ? char
                          : stripDiacritics(char);
                      return (
                        <span
                          key={index}
                          className={cn(
                            'inline-block transition-colors duration-500',
                            flashing.has(index) && 'bg-[var(--flare-wash)]',
                          )}
                        >
                          {show}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </span>
            </h1>

            {/* His own words, from the previous site. First sentence as a
                display lede — Fraunces is handsome and hard to read at
                paragraph length. */}
            <p className="font-display text-h3 text-ink mt-8 max-w-[46ch] leading-[1.3]">{lede}</p>
            <p className="measure text-ink-2 mt-6 text-[1.02rem] leading-[1.75]">{rest}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/work"
                className="label border-ink !text-ink hover:bg-ink hover:!text-paper border px-4 py-2.5 transition-colors"
              >
                {t('cta')}
              </Link>
              <button
                type="button"
                onClick={() => openChat()}
                className="label border-rule hover:border-ink-3 hover:text-ink border px-4 py-2.5 transition-colors"
              >
                {t('ctaAsk')}
              </button>
            </div>
          </div>

          <figure className="bg-sunk relative order-first aspect-[4/5] w-40 overflow-hidden sm:w-52 lg:order-none lg:w-full">
            <Image
              src="/img/1.avif"
              alt={`${NAME} — ${headline}`}
              fill
              priority
              sizes="(max-width: 1024px) 13rem, 17rem"
              className="object-cover object-top"
            />
          </figure>
        </div>
      </div>

      <div className="rail-grid mt-[var(--space-block)]">
        <div aria-hidden className="hidden md:block" />
        <dl className="border-rule grid grid-cols-2 gap-x-8 gap-y-8 border-t pt-7 sm:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.value}>
              <dt className="text-ink font-mono text-2xl tabular-nums sm:text-[2rem]">
                {item.value}
              </dt>
              <dd className="label mt-2 !tracking-normal !normal-case">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
