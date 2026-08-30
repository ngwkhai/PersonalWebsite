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
  return { title: t('work') };
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const projects = getProjects(locale as AppLocale);

  return (
    <section className="shell pt-32 pb-[var(--space-section)] sm:pt-40">
      <div className="rail-grid">
        <h1 className="label !text-ink">{t('work')}</h1>
      </div>

      <div className="border-rule mt-[var(--space-block)] border-b">
        {projects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
