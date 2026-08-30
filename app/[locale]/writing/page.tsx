import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getPosts } from '@/lib/content';
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
  return { title: t('writing') };
}

export default async function WritingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const posts = getPosts(locale as AppLocale);

  return (
    <section className="shell pt-32 pb-[var(--space-section)] sm:pt-40">
      <h1 className="label !text-ink">{t('writing')}</h1>

      <ul className="mt-12">
        {posts.map((post) => (
          <li key={post.slug} className="border-rule border-t">
            <Link href={`/writing/${post.slug}`} className="rail-grid group py-7">
              <time dateTime={post.date} className="label tabular-nums">
                {post.date}
              </time>
              <div>
                <h2 className="font-display text-h3 text-ink group-hover:text-indigo transition-colors">
                  {post.title}
                </h2>
                <p className="text-ink-2 mt-2 max-w-prose text-[0.95rem]">{post.summary}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 && (
        <p className="font-display text-h3 text-ink-3 mt-12 max-w-prose">
          Nothing published yet. The case studies under Work are where the writing lives for now.
        </p>
      )}
    </section>
  );
}
