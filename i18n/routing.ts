import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'vi'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Both locales carry a prefix so /en and /vi are symmetric — no locale is
  // the "real" site with the other bolted on.
  localePrefix: 'always',
  localeDetection: true,
});
