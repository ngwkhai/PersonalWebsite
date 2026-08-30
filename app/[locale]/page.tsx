import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Hero } from '@/components/sections/hero';
import { Skills } from '@/components/sections/skills';
import { Achievements } from '@/components/sections/achievements';
import { Experience } from '@/components/sections/experience';
import { WritingList } from '@/components/sections/writing-list';
import { ResumeTeaser } from '@/components/sections/resume-teaser';
import { ProjectCard } from '@/components/sections/project-card';
import { ContactForm } from '@/components/sections/contact-form';
import { Section, SectionHeader } from '@/components/sections/section-header';
import { getFeaturedProjects } from '@/lib/content';
import { highlights, profile } from '@/content/cv';
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
      <Hero
        highlights={highlights.map((h) => ({ value: h.value, label: h.label[l] }))}
        headline={profile.headline[l]}
        bio={profile.bio[l]}
      />
      <Skills />

      <Section id="work">
        <SectionHeader
          id="work"
          label={tn('work')}
          action={
            <Link
              href="/work"
              className="label border-rule hover:border-ink-3 hover:text-ink border px-3.5 py-2 transition-colors"
            >
              {t('viewAll')} →
            </Link>
          }
        />
        <div className="border-rule mt-[var(--space-block)] border-b">
          {featured.map((project, index) => (
            <ProjectCard key={project.slug} project={project} priority={index === 0} />
          ))}
        </div>
      </Section>

      <Achievements />
      <Experience />
      <WritingList limit={4} />
      <ResumeTeaser />
      <ContactForm note={profile.contactNote[l]} />
    </>
  );
}
