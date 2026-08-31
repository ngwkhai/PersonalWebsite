import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, Download } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { profile, education, experience, skills } from '@/content/cv';
import { achievements } from '@/content/achievements';
import { getProjects } from '@/lib/content';
import type { AppLocale } from '@/i18n/routing';
import { Section, SectionHeader, SectionBody } from './section-header';

export async function ResumeTeaser() {
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;

  const counts = [
    { value: getProjects(locale).length, label: t('projects') },
    { value: skills.reduce((total, group) => total + group.items.length, 0), label: t('skills') },
    { value: achievements.length, label: t('achievements') },
    { value: education.length + experience.length, label: t('experience') },
  ];

  return (
    <Section id="resume" band>
      <SectionHeader id="resume" label={t('resume')} lead={ts('resumeLead')} />

      <SectionBody>
        <div>
          <dl className="border-rule grid grid-cols-2 gap-x-8 gap-y-6 border-y py-7 sm:grid-cols-4">
            {counts.map((item) => (
              <div key={item.label}>
                <dt className="text-ink font-mono text-3xl tabular-nums">{item.value}</dt>
                <dd className="label mt-1">{item.label}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/resume"
              className="label border-ink !text-ink hover:bg-ink hover:!text-paper inline-flex items-center gap-2 border px-4 py-2.5 transition-colors"
            >
              {ts('resumeView')}
              <ArrowRight size={13} strokeWidth={2} aria-hidden />
            </Link>
            <a
              href={profile.cvPath}
              download
              className="label border-rule hover:border-ink-3 hover:text-ink inline-flex items-center gap-2 border px-4 py-2.5 transition-colors"
            >
              <Download size={13} strokeWidth={2} aria-hidden />
              {ts('resumeDownload')}
            </a>
          </div>
        </div>
      </SectionBody>
    </Section>
  );
}
