'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';
import { locales } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const t = useTranslations('language');
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="label flex items-center gap-1 tabular-nums"
      role="group"
      aria-label={t('toggle')}
    >
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          {index > 0 && <span className="text-rule select-none">/</span>}
          <button
            type="button"
            disabled={pending}
            aria-current={locale === active ? 'true' : undefined}
            onClick={() =>
              startTransition(() => {
                // Keeps the current route, swapping only the locale segment.
                router.replace(pathname, { locale });
              })
            }
            className={cn(
              'transition-colors',
              locale === active ? 'text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            {locale.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
