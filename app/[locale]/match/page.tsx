import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MatchForm } from '@/components/sections/match-form';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'match' });
  return { title: t('title'), description: t('lead'), robots: { index: false } };
}

export default async function MatchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('match');

  return (
    <section className="mx-auto max-w-[88rem] px-5 pt-32 pb-16 sm:px-8 sm:pt-40">
      <div className="grid gap-6 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
        <h1 className="label !text-ink">{t('title')}</h1>
        <p className="font-display text-h2 text-ink max-w-2xl leading-[1.12]">{t('lead')}</p>
      </div>

      <div className="mt-14 grid gap-10 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
        <div aria-hidden />
        <MatchForm />
      </div>
    </section>
  );
}
