import { getLocale } from 'next-intl/server';
import { profile } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';

/**
 * The bio, immediately after the hero and deliberately without a section
 * label. It reads as the second breath of the opening rather than a stop on
 * the nav — which is why "About" is not one of the pinned items.
 *
 * First sentence in the display face, the rest in the body face: Fraunces is
 * handsome and hard to read at paragraph length.
 */
export async function Intro() {
  const locale = (await getLocale()) as AppLocale;
  const bio = profile.bio[locale];
  const split = bio.indexOf('. ') + 1;

  return (
    <section
      id="about"
      aria-label={locale === 'vi' ? 'Giới thiệu' : 'About'}
      className="shell scroll-mt-28 pb-[var(--space-section)]"
    >
      <div className="rail-grid">
        <div aria-hidden className="hidden md:block" />
        <div>
          <p className="font-display text-h3 text-ink max-w-[44ch] leading-[1.25]">
            {bio.slice(0, split)}
          </p>
          <p className="text-ink-2 mt-6 max-w-[66ch] text-[1.02rem] leading-[1.72]">
            {bio.slice(split).trim()}
          </p>
        </div>
      </div>
    </section>
  );
}
