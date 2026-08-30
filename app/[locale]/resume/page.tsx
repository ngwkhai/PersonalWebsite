import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Download } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  profile,
  socials,
  education,
  experience,
  leadership,
  skills,
  type Institution,
} from '@/content/cv';
import { achievementsByDate } from '@/content/achievements';
import { getProjects } from '@/lib/content';
import { routing, type AppLocale } from '@/i18n/routing';
import { formatMonth } from '@/lib/utils';

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
  const l = locale as AppLocale;
  return {
    title: t('resume'),
    description: `${profile.name} — ${profile.headline[l]}`,
    alternates: { canonical: `/${locale}/resume` },
  };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-rule grid gap-3 border-t py-7 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
      <h2 className="label !text-ink">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Role({ item, locale }: { item: Institution; locale: AppLocale }) {
  const to = item.end ? formatMonth(item.end, locale) : locale === 'vi' ? 'Nay' : 'Present';
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="text-ink text-[1.02rem] font-semibold">{item.organisation}</h3>
        <p className="label tabular-nums">
          {formatMonth(item.start, locale)} — {to}
        </p>
      </div>
      <p className="text-teal mt-0.5 text-[0.94rem]">{item.role[locale]}</p>
      <ul className="mt-2 space-y-1.5">
        {item.detail.map((line) => (
          <li key={line.en} className="text-ink-2 max-w-prose text-[0.93rem] leading-relaxed">
            {line[locale]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The résumé as a real page rather than only a PDF.
 *
 * The PDF in the repository is a scan with no text layer, so it is invisible
 * to search engines, unreadable by screen readers and uncitable by the agent.
 * This page is generated from content/cv.ts, which fixes all three, and prints
 * cleanly. The PDF stays available for anyone who wants a file.
 */
export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const l = locale as AppLocale;
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const projects = getProjects(l);

  return (
    <article className="shell pt-32 pb-[var(--space-section)] sm:pt-40">
      <header className="rail-grid pb-10">
        <p className="label">{t('resume')}</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-h1 text-ink leading-[1.05]">{profile.nameVi}</h1>
            <p className="text-ink-2 mt-2 text-lg">{profile.headline[l]}</p>
            <p className="label mt-3 !tracking-normal !normal-case">
              {profile.location[l]} ·{' '}
              {socials
                .filter((social) => social.primary)
                .map((social) => social.label)
                .join(' · ')}
            </p>
          </div>
          <a
            href={profile.cvPath}
            download
            className="label border-ink !text-ink hover:bg-ink hover:!text-paper inline-flex items-center gap-2 border px-4 py-2.5 transition-colors print:hidden"
          >
            <Download size={13} strokeWidth={2} aria-hidden />
            {ts('resumeDownload')}
          </a>
        </div>
      </header>

      <Block title={ts('about')}>
        <p className="text-ink-2 max-w-prose text-[0.98rem] leading-relaxed">{profile.bio[l]}</p>
      </Block>

      {experience.length > 0 && (
        <Block title={ts('experience')}>
          {experience.map((item) => (
            <Role key={item.organisation} item={item} locale={l} />
          ))}
        </Block>
      )}

      <Block title={ts('education')}>
        {education.map((item) => (
          <Role key={item.organisation} item={item} locale={l} />
        ))}
      </Block>

      <Block title={t('skills')}>
        <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {skills.map((group) => (
            <div key={group.id}>
              <dt className="label !text-teal">{group.label[l]}</dt>
              <dd className="text-ink-2 mt-1 font-mono text-[0.82rem] leading-relaxed">
                {group.items.join(' · ')}
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title={t('work')}>
        <ul className="space-y-5">
          {projects.map((project) => (
            <li key={project.slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <Link
                  href={`/work/${project.slug}`}
                  className="text-ink hover:text-indigo text-[1.02rem] font-semibold transition-colors"
                >
                  {project.title}
                </Link>
                <span className="label tabular-nums">{project.year}</span>
              </div>
              <p className="text-ink-2 mt-1 max-w-prose text-[0.93rem] leading-relaxed">
                {project.summary}
              </p>
              {project.metrics.length > 0 && (
                <p className="text-ink-3 mt-1.5 font-mono text-[0.8rem]">
                  {project.metrics.map((m) => `${m.label} ${m.value}`).join('  ·  ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Block>

      <Block title={t('achievements')}>
        <ul className="space-y-3">
          {achievementsByDate.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="text-ink text-[0.96rem]">
                {item.title[l]}
                <span className="text-ink-3"> — {item.issuer}</span>
              </span>
              <span className="label tabular-nums">{formatMonth(item.date, l)}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title={ts('leadership')}>
        {leadership.map((item) => (
          <Role key={item.organisation} item={item} locale={l} />
        ))}
      </Block>
    </article>
  );
}
