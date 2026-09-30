import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProjectList } from '@/components/sections/project-card';
import { getProjects, groupProjects } from '@/lib/content';
import { routing, type AppLocale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('projects') };
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const tn = await getTranslations('nav');
  const { live, research } = groupProjects(getProjects(locale as AppLocale));

  return (
    <section className="shell pt-32 pb-[var(--space-section)] sm:pt-40">
      <div className="rail-grid">
        {/* Every project, so not the home page's "selected" heading. */}
        <h1 className="label !text-ink">{tn('projects')}</h1>
      </div>

      <div className="mt-[var(--space-block)] space-y-16">
        <ProjectList label={t('liveProjects')} projects={live} level={2} live priorityFirst />
        <ProjectList label={t('researchProjects')} projects={research} level={2} />
      </div>
    </section>
  );
}
