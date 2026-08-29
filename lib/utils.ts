import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips Vietnamese diacritics, matching the transformation the diacritic
 * restoration project inverts. Used by the hero's restore animation and by the
 * search index, so a query for "tieng viet" finds "tiếng Việt".
 */
export function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function formatMonth(iso: string, locale: string): string {
  const [year, month] = iso.split('-');
  const date = new Date(Number(year), Number(month ?? '1') - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
}
