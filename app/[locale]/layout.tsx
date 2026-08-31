import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Fraunces, Archivo, IBM_Plex_Mono } from 'next/font/google';
import { routing, type AppLocale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';
import { profile } from '@/content/cv';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ThemeScript } from '@/components/theme-script';
import { CommandPalette } from '@/components/command-palette';
import { ChatDock } from '@/components/chat/chat-dock';
import { ChatFab } from '@/components/chat/chat-fab';
import { getProjects } from '@/lib/content';
import { JsonLd } from '@/components/json-ld';
import '../globals.css';

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
});

const sans = Archivo({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-archivo',
  axes: ['wdth'],
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The legacy site set maximum-scale=1 and user-scalable=no, blocking
  // pinch-zoom. Deliberately omitted here.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0d14' },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as AppLocale;
  const bio = profile.bio[l];
  const summary = bio.slice(0, bio.indexOf('. ') + 1);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${profile.name} — ${profile.headline[l]}`,
      template: `%s — ${profile.name}`,
    },
    // His own first sentence, rather than a line written for him.
    description: summary,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', vi: '/vi', 'x-default': '/en' },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: `/${locale}`,
      siteName: profile.name,
      title: `${profile.name} — ${profile.headline[l]}`,
      // His own first sentence, rather than a line written for him.
      description: summary,
      images: [{ url: `/api/og?locale=${locale}`, width: 1200, height: 630, alt: profile.name }],
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'nav' });

  // The dock renders real project cards inline, so it needs the catalogue.
  const projects = getProjects(locale as AppLocale).map((project) => ({
    slug: project.slug,
    title: project.title,
    kicker: project.kicker,
    year: project.year,
    cover: project.cover,
    coverSquare: project.coverSquare,
    href: `/projects/${project.slug}`,
  }));

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider>
          <SmoothScroll />
          <a
            href="#main"
            className="focus:bg-ink focus:text-paper sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:px-4 focus:py-2"
          >
            {t('skipToContent')}
          </a>
          <SiteHeader />
          {/* Narrowed rather than covered when the chat dock opens. */}
          <div className="site-flow">
            <main id="main">{children}</main>
            <SiteFooter />
          </div>
          <CommandPalette projects={projects} />
          <ChatDock projects={projects} />
          <ChatFab />
          <JsonLd locale={locale as AppLocale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
