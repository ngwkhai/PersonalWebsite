import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { MDXContent } from '@/components/mdx';
import { getPost, allWriting } from '@/lib/content';
import type { AppLocale } from '@/i18n/routing';

export function generateStaticParams() {
  return allWriting.map((p) => ({ locale: p.locale, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(locale as AppLocale, slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPost(locale as AppLocale, slug);
  if (!post) notFound();

  return (
    <article className="shell pt-32 pb-[var(--space-section)] sm:pt-40">
      <div className="rail-grid">
        <time dateTime={post.date} className="label tabular-nums">
          {post.date}
        </time>
        <div>
          <h1 className="font-display text-h1 text-ink max-w-3xl leading-[1.05]">{post.title}</h1>
          <div className="prose-notebook mt-10">
            <MDXContent code={post.body} />
          </div>
        </div>
      </div>
    </article>
  );
}
