'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { cn } from '@/lib/utils';
import { openChat, openPalette } from '@/lib/ui-events';
import { HOME_SECTIONS, SECTION_IDS } from '@/lib/sections';
import { useScrollSpy } from '@/lib/use-scrollspy';

/** Routes that are pages of their own rather than sections of the homepage. */
const PAGES = [{ href: '/match', key: 'match' }] as const;

export function SiteHeader() {
  const t = useTranslations('nav');
  const tp = useTranslations('palette');
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);

  const onHome = pathname === '/';
  // The observer only runs on the homepage; elsewhere there is nothing to spy.
  const active = useScrollSpy(onHome ? SECTION_IDS : []);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = [
    ...HOME_SECTIONS.map((section) => ({
      href: onHome ? `#${section.id}` : `/#${section.id}`,
      label: t(section.key),
      current: onHome && active === section.id,
    })),
    ...PAGES.map((page) => ({
      href: page.href,
      label: t(page.key),
      current: pathname.startsWith(page.href),
    })),
  ];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        lifted && 'border-rule bg-paper/85 border-b backdrop-blur-xl',
      )}
    >
      <nav className="shell">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="label !text-ink shrink-0 !tracking-[0.2em]">
            NGWKHAI
          </Link>

          <ul className="label hidden items-center gap-5 lg:flex">
            {items.map((item) => (
              <li key={item.href}>
                <NavItem {...item} />
              </li>
            ))}
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={openPalette}
              className="label border-rule hover:border-ink-3 hover:text-ink hidden border px-2.5 py-1 transition-colors sm:block"
            >
              {tp('open')}
              <kbd className="text-ink-3 ml-2 font-sans text-[0.65rem]">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => openChat()}
              className="label bg-ink !text-paper px-3 py-1.5 transition-opacity hover:opacity-85"
            >
              {t('ask')}
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Eight items do not fit one line below lg, so they get their own row
            and scroll horizontally rather than wrapping into a wall. */}
        <ul className="label scroll-hint -mx-5 flex items-center gap-5 overflow-x-auto px-5 pb-2.5 sm:-mx-10 sm:px-10 lg:hidden">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <NavItem {...item} />
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function NavItem({ href, label, current }: { href: string; label: string; current: boolean }) {
  const className = cn('transition-colors hover:text-ink', current && 'flare text-ink');

  // Anchors within the current page must stay plain <a>, so the smooth-scroll
  // handler in SmoothScroll picks them up instead of the router remounting.
  return href.startsWith('#') ? (
    <a href={href} aria-current={current ? 'true' : undefined} className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} aria-current={current ? 'page' : undefined} className={className}>
      {label}
    </Link>
  );
}
