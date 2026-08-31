import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MDXContent } from '@/components/mdx';
import { MetricStrip } from '@/components/sections/metric-strip';
import { ExplainAtDepth } from '@/components/explain-at-depth';
import { allProjectParams, getProject, getNextProject } from '@/lib/content';
import type { AppLocale } from '@/i18n/routing';

export function generateStaticParams() {
  return allProjectParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(locale as AppLocale, slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    alternates: {
      canonical: `/${locale}/projects/${slug}`,
      languages: { en: `/en/projects/${slug}`, vi: `/vi/projects/${slug}` },
    },
    openGraph: {
      type: 'article',
      title: project.title,
      description: project.summary,
      images: [{ url: `/api/og?slug=${slug}&locale=${locale}`, width: 1200, height: 630 }],
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const l = locale as AppLocale;
  const project = getProject(l, slug);
  if (!project) notFound();

  const t = await getTranslations('project');
  const next = getNextProject(l, slug);

  const links = [
    { href: project.repo, label: t('repo') },
    { href: project.demo, label: t('demo') },
    { href: project.paper, label: t('paper') },
  ].filter((link): link is { href: string; label: string } => Boolean(link.href));

  return (
    <article className="shell pt-28 pb-8 sm:pt-36">
      <Link href="/projects" className="label hover:text-ink inline-flex items-center gap-2">
        <ArrowLeft size={12} strokeWidth={2} aria-hidden />
        {t('backToProjects')}
      </Link>

      {/* On mobile the rail stacks above the title, which put a screenful of
          metadata in front of what the project actually is. Ordered so the
          claim comes first there, and returns to the margin at sm. */}
      <header className="rail-grid mt-10">
        <div className="order-2 flex flex-col gap-5 sm:order-1">
          <div>
            <p className="label">{t('year')}</p>
            <p className="text-ink font-mono text-sm tabular-nums">{project.year}</p>
          </div>
          <div>
            <p className="label">{t('role')}</p>
            <p className="text-ink-2 text-[0.85rem] leading-relaxed">{project.role}</p>
          </div>
          <div>
            <p className="label">{t('stack')}</p>
            <ul className="mt-1 space-y-0.5">
              {project.stack.map((item) => (
                <li key={item} className="text-ink-2 font-mono text-[0.78rem]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {links.length > 0 && (
            <ul className="space-y-1.5">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="label hover:text-ink inline-flex items-center gap-1.5"
                  >
                    {link.label}
                    <ExternalLink size={10} strokeWidth={2} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-1 sm:order-2">
          <p className="label !text-teal">{project.kicker}</p>
          <h1 className="font-display text-h1 text-ink mt-3 max-w-4xl leading-[1.03]">
            {project.title}
          </h1>
          <p className="text-ink-2 mt-6 max-w-2xl text-lg leading-relaxed">{project.summary}</p>
          {project.points.length > 0 && (
            <ul className="border-rule mt-8 space-y-3 border-l-2 pl-5">
              {project.points.map((point) => (
                <li key={point} className="text-ink-2 max-w-[68ch] text-[0.95rem] leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          )}

          <ExplainAtDepth slug={project.slug} original={project.summary} />
        </div>
      </header>

      <div className="bg-sunk relative mt-14 aspect-21/9 overflow-hidden">
        <Image
          src={project.cover}
          alt=""
          fill
          priority
          sizes="(max-width: 1408px) 100vw, 1408px"
          className="object-cover"
        />
      </div>

      <MetricStrip metrics={project.metrics} />

      <div className="rail-grid mt-4">
        <div aria-hidden />
        <div className="prose-notebook">
          <MDXContent code={project.body} />
        </div>
      </div>

      {next && (
        <nav className="border-rule mt-28 border-t pt-8">
          <Link href={`/projects/${next.slug}`} className="rail-grid group">
            <span className="label">{t('next')}</span>
            <span className="font-display text-h3 text-ink group-hover:text-indigo flex items-center gap-3 transition-colors">
              {next.title}
              <ArrowRight
                size={18}
                strokeWidth={1.75}
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        </nav>
      )}
    </article>
  );
}
