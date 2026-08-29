'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { cn } from '@/lib/utils';
import { openChat, openPalette } from '@/lib/ui-events';

const routes = [
  { href: '/work', key: 'work' },
  { href: '/writing', key: 'writing' },
  { href: '/match', key: 'match' },
] as const;

export function SiteHeader() {
  const t = useTranslations('nav');
  const tp = useTranslations('palette');
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        lifted && 'border-rule bg-paper/85 border-b backdrop-blur-xl',
      )}
    >
      <nav className="mx-auto flex h-14 max-w-[88rem] items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="label !text-ink shrink-0 !tracking-[0.2em]">
          NGWKHAI
        </Link>

        <ul className="label hidden items-center gap-6 sm:flex">
          {routes.map((route) => {
            const current = pathname.startsWith(route.href);
            return (
              <li key={route.href}>
                <Link
                  href={route.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn('hover:text-ink transition-colors', current && 'text-ink flare')}
                >
                  {t(route.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={openPalette}
            className="label border-rule hover:border-ink-3 hover:text-ink border px-2.5 py-1 transition-colors"
          >
            {tp('open')}
            <kbd className="text-ink-3 ml-2 hidden font-sans text-[0.65rem] sm:inline">⌘K</kbd>
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
      </nav>
    </header>
  );
}
