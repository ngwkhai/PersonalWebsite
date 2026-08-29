import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProjectCard } from '@/components/sections/project-card';
import { getProjects } from '@/lib/content';
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
  const t = await getTranslations({ locale, namespace: 'sections' });
  return { title: t('work'), description: t('workLead') };
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const projects = getProjects(locale as AppLocale);

  return (
    <section className="mx-auto max-w-[88rem] px-5 pt-32 pb-16 sm:px-8 sm:pt-40">
      <div className="grid gap-6 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
        <h1 className="label !text-ink">{t('work')}</h1>
        <p className="font-display text-h2 text-ink max-w-prose leading-[1.1]">{t('workLead')}</p>
      </div>

      <div className="mt-16">
        {projects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
