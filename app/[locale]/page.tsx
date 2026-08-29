import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Hero } from '@/components/sections/hero';
import { About } from '@/components/sections/about';
import { ProjectCard } from '@/components/sections/project-card';
import { ContactForm } from '@/components/sections/contact-form';
import { getFeaturedProjects } from '@/lib/content';
import { highlights } from '@/content/cv';
import { routing, type AppLocale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const l = locale as AppLocale;
  const t = await getTranslations('sections');
  const tn = await getTranslations('nav');
  const featured = getFeaturedProjects(l);

  return (
    <>
      <Hero highlights={highlights.map((h) => ({ value: h.value, label: h.label[l] }))} />

      <section id="work" className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
          <h2 className="label !text-ink">{t('work')}</h2>
          <p className="font-display text-h3 text-ink-2 max-w-prose leading-snug">
            {t('workLead')}
          </p>
        </div>

        <div className="mt-10">
          {featured.map((project, index) => (
            <ProjectCard key={project.slug} project={project} priority={index === 0} />
          ))}
        </div>

        <div className="border-rule border-t pt-8">
          <Link
            href="/work"
            className="label border-rule hover:border-ink-3 hover:text-ink border px-4 py-2.5 transition-colors"
          >
            {tn('work')} →
          </Link>
        </div>
      </section>

      <About />
      <ContactForm />
    </>
  );
}
