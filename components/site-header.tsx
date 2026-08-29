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

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const current = pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn('transition-colors hover:text-ink', current && 'flare text-ink')}
    >
      {label}
    </Link>
  );
}

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
        lifted && 'border-b border-rule bg-paper/85 backdrop-blur-xl',
      )}
    >
      {/* Two rows on mobile. The links cannot simply be hidden there, or the
          only route to Work and Writing is a keyboard shortcut. */}
      <nav className="mx-auto max-w-[88rem] px-5 sm:px-8">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="label shrink-0 !tracking-[0.2em] !text-ink">
            NGWKHAI
          </Link>

          <ul className="label hidden items-center gap-6 sm:flex">
            {routes.map((route) => (
              <li key={route.href}>
                <NavLink href={route.href} label={t(route.key)} pathname={pathname} />
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={openPalette}
              className="label hidden border border-rule px-2.5 py-1 transition-colors hover:border-ink-3 hover:text-ink sm:block"
            >
              {tp('open')}
              <kbd className="ml-2 font-sans text-[0.65rem] text-ink-3">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => openChat()}
              className="label bg-ink px-3 py-1.5 !text-paper transition-opacity hover:opacity-85"
            >
              {t('ask')}
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <ul className="label flex items-center gap-5 pb-2.5 sm:hidden">
          {routes.map((route) => (
            <li key={route.href}>
              <NavLink href={route.href} label={t(route.key)} pathname={pathname} />
            </li>
          ))}
          <li className="ml-auto">
            <button type="button" onClick={openPalette} className="label hover:text-ink">
              {tp('open')}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
