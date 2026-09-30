import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Hero } from '@/components/sections/hero';
import { Education } from '@/components/sections/education';
import { Skills } from '@/components/sections/skills';
import { Achievements } from '@/components/sections/achievements';
import { Experience } from '@/components/sections/experience';
import { WritingList } from '@/components/sections/writing-list';
import { ResumeTeaser } from '@/components/sections/resume-teaser';
import { ProjectList } from '@/components/sections/project-card';
import { ContactForm } from '@/components/sections/contact-form';
import { Section, SectionHeader } from '@/components/sections/section-header';
import { getFeaturedProjects, groupProjects } from '@/lib/content';
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
  const featured = groupProjects(getFeaturedProjects(l));

  return (
    <>
      <Hero
        highlights={highlights.map((h) => ({ value: h.value, label: h.label[l] }))}
        headline={profile.headline[l]}
        bio={profile.bio[l]}
      />
      <Education />
      <Skills />
      <Experience />

      <Section id="projects">
        <SectionHeader
          id="projects"
          label={tn('projects')}
          action={
            <Link
              href="/projects"
              className="label border-rule hover:border-ink-3 hover:text-ink border px-3.5 py-2 transition-colors"
            >
              {t('viewAll')} →
            </Link>
          }
        />
        <div className="mt-[var(--space-block)] space-y-16">
          <ProjectList
            label={t('liveProjects')}
            projects={featured.live}
            level={3}
            live
            priorityFirst
          />
          <ProjectList label={t('researchProjects')} projects={featured.research} level={3} />
        </div>
      </Section>

      <Achievements />
      <WritingList limit={4} />
      <ResumeTeaser />
      <ContactForm note={profile.contactNote[l]} />
    </>
  );
}
