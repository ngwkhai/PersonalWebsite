import Image from 'next/image';
import type { Institution } from '@/content/cv';
import type { AppLocale } from '@/i18n/routing';
import { formatMonth } from '@/lib/utils';

/**
 * Not every organisation has a logo in the repository, and using one lifted
 * from a company's website is a trademark question nobody needs. A monogram
 * keeps the row the same shape either way.
 */
function Mark({ item }: { item: Institution }) {
  return (
    <span className="ring-rule mt-0.5 grid h-16 w-32 shrink-0 place-items-center rounded-sm bg-white px-3 ring-1">
      {item.logo ? (
        <Image
          src={item.logo}
          alt=""
          width={192}
          height={96}
          className="max-h-12 w-auto object-contain"
        />
      ) : (
        <span aria-hidden className="label !text-ink-3 !text-[0.95rem] !tracking-[0.18em]">
          {item.organisation
            .split(/\s+/)
            .slice(0, 3)
            .map((word) => word[0])
            .join('')}
        </span>
      )}
    </span>
  );
}

/** One institution — used by both Education and Experience. */
export function InstitutionEntry({ item, locale }: { item: Institution; locale: AppLocale }) {
  const from = formatMonth(item.start, locale);
  const to = item.end ? formatMonth(item.end, locale) : locale === 'vi' ? 'Nay' : 'Present';

  return (
    <li className="border-rule grid gap-4 border-t py-6 sm:grid-cols-[var(--rail)_1fr] sm:gap-10">
      <p className="label tabular-nums">
        {from} — {to}
      </p>
      <div className="flex gap-5">
        <Mark item={item} />
        <div>
          <h4 className="text-ink text-[1.02rem] font-semibold">{item.organisation}</h4>
          <p className="text-teal mt-0.5 text-[0.94rem]">{item.role[locale]}</p>
          <ul className="mt-2.5 space-y-2">
            {item.detail.map((line) => (
              <li key={line.en} className="text-ink-2 max-w-prose text-[0.94rem] leading-relaxed">
                {line[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
