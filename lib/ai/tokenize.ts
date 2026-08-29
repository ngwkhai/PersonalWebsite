import { stripDiacritics } from '@/lib/utils';

/**
 * Diacritic-folding tokenizer, shared by index build and query time so the two
 * can never drift. Folding matters here specifically: a visitor typing
 * "tieng viet" or "chrf" must reach chunks written "tiếng Việt" and "ChrF++".
 */
export function tokenize(input: string): string[] {
  return stripDiacritics(input)
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 1 && token.length < 32);
}
