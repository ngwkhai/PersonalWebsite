import { knowledgeMeta } from './retrieval';
import type { Retrieved } from './types';

/**
 * Chunks handed to the analysis model. The same 14 the single-query version
 * used, so the evidence budget does not grow just because there are now
 * several queries feeding it.
 */
export const EVIDENCE_CHUNKS = 14;

/**
 * Hard ceiling on evidence text, roughly 3k tokens. The chunk count alone is
 * only an average guarantee — sections vary from a paragraph to a page — and
 * the point of a budget is that the bill cannot drift.
 */
export const MAX_EVIDENCE_CHARS = 12_000;

/** Bump on any change to the schemas, the prompts, or the scoring. */
const CACHE_VERSION = 1;

export const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Refuse to cache an object large enough to suggest something went wrong. */
export const MAX_CACHE_BYTES = 16_384;

/**
 * Renders retrieved passages for the prompt and reports which URLs the model
 * is allowed to cite.
 *
 * Trims from the tail — lowest fused score — once the running total would
 * exceed the char budget, so what gets dropped is what mattered least.
 */
export function buildEvidence(hits: readonly Retrieved[]): { text: string; urls: string[] } {
  const kept: Retrieved[] = [];
  let chars = 0;

  for (const hit of hits.slice(0, EVIDENCE_CHUNKS)) {
    const { chunk } = hit;
    const size = chunk.title.length + chunk.section.length + chunk.url.length + chunk.text.length;
    if (kept.length > 0 && chars + size > MAX_EVIDENCE_CHARS) break;
    kept.push(hit);
    chars += size;
  }

  return {
    text: kept
      .map(
        ({ chunk }) => `### ${chunk.title} — ${chunk.section}\nURL: ${chunk.url}\n\n${chunk.text}`,
      )
      .join('\n\n'),
    urls: [...new Set(kept.map(({ chunk }) => chunk.url))],
  };
}

/**
 * Cache key for an analysis.
 *
 * The corpus fingerprint is in the key so rewriting a case study invalidates
 * every cached verdict about it — and, because it digests the content rather
 * than the build time, an unchanged corpus keeps its cache across a redeploy,
 * which is the difference between a seven-day TTL and a meaningless one.
 * `CACHE_VERSION` is there so a prompt or schema change invalidates too;
 * replaying an object shaped for the old client is exactly the silent
 * truncation this route now goes out of its way to avoid.
 *
 * Web Crypto rather than node:crypto, so the route stays runtime-agnostic.
 */
export async function matchCacheKey(jd: string, locale: string): Promise<string> {
  const normalised = jd.trim().replace(/\s+/g, ' ').toLowerCase();
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(
      [CACHE_VERSION, locale, knowledgeMeta.fingerprint, normalised].join('\n'),
    ),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `match:v${CACHE_VERSION}:${hex.slice(0, 32)}`;
}
