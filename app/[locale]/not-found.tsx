import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('error');
  return (
    <section className="shell grid gap-6 pt-40 pb-32">
      <h1 className="font-display text-h1 text-ink">{t('notFoundTitle')}</h1>
      <p className="text-ink-2 max-w-prose">{t('notFoundBody')}</p>
      <Link href="/" className="label border-rule hover:text-ink w-fit border px-4 py-2.5">
        {t('back')}
      </Link>
    </section>
  );
}
