import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getPosts } from '@/lib/content';
import type { AppLocale } from '@/i18n/routing';
import { Section, SectionHeader } from './section-header';

export async function WritingList({ limit }: { limit?: number }) {
  const t = await getTranslations('nav');
  const ts = await getTranslations('sections');
  const locale = (await getLocale()) as AppLocale;

  const all = getPosts(locale);
  const posts = limit ? all.slice(0, limit) : all;

  return (
    <Section id="writing">
      <SectionHeader
        id="writing"
        label={t('writing')}
        lead={ts('writingLead')}
        action={
          all.length > (limit ?? Infinity) ? (
            <Link
              href="/writing"
              className="label border-rule hover:border-ink-3 hover:text-ink border px-3.5 py-2 transition-colors"
            >
              {ts('viewAll')} →
            </Link>
          ) : undefined
        }
      />

      {posts.length === 0 ? (
        <p className="text-ink-3 mt-10 max-w-prose sm:ml-[calc(var(--rail)+2.5rem)]">
          {ts('writingEmpty')}
        </p>
      ) : (
        <ul className="border-rule mt-[var(--space-block)] border-b">
          {posts.map((post) => (
            <li key={post.slug} className="border-rule border-t">
              <Link href={`/writing/${post.slug}`} className="rail-grid group py-6">
                <time dateTime={post.date} className="label tabular-nums">
                  {post.date}
                </time>
                <div>
                  <h3 className="font-display text-h3 text-ink group-hover:text-indigo transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-ink-2 mt-2 max-w-prose text-[0.94rem] leading-relaxed">
                    {post.summary}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
