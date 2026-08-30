import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { profile, socials } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const locale = (await getLocale()) as AppLocale;

  return (
    <footer className="border-rule mt-20 border-t">
      <div className="shell rail-grid py-12">
        <p className="label leading-[1.9]">
          {profile.location[locale]}
          <br />
          <span className="tabular-nums">{new Date().getFullYear()}</span>
        </p>

        <div className="flex flex-wrap items-end justify-between gap-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="me noreferrer"
                  className="label hover:text-ink transition-colors"
                >
                  {social.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/colophon" className="label hover:text-ink transition-colors">
                {t('colophon')}
              </Link>
            </li>
          </ul>

          <p className="label !tracking-normal !normal-case">
            © {new Date().getFullYear()} {profile.name}. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
