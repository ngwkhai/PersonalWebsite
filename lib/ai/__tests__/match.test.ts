import { describe, expect, it } from 'vitest';
import { buildEvidence, matchCacheKey, EVIDENCE_CHUNKS, MAX_EVIDENCE_CHARS } from '../match';
import { knowledgeMeta } from '../retrieval';
import { matchSchema, matchSchemaFor } from '../schemas';
import type { Chunk, Retrieved } from '../types';

const hit = (id: string, url: string, chars: number): Retrieved => ({
  chunk: {
    id,
    locale: 'en',
    kind: 'project',
    title: 'Title',
    section: id,
    url,
    text: 'x'.repeat(chars),
    tokens: [],
  } as Chunk,
  score: 1,
});

describe('buildEvidence', () => {
  it('never hands the model more chunks than the budget allows', () => {
    const hits = Array.from({ length: 30 }, (_, index) => hit(`c${index}`, `/en/projects/p${index}`, 100));
    expect(buildEvidence(hits).urls).toHaveLength(EVIDENCE_CHUNKS);
  });

  /**
   * The count cap alone is only an average guarantee — sections run from a
   * paragraph to a page — and the point of a budget is that the bill cannot
   * drift with the length of whatever happened to rank well.
   */
  it('drops from the tail once the character budget is spent', () => {
    const hits = Array.from({ length: 10 }, (_, index) =>
      hit(`c${index}`, `/en/projects/p${index}`, MAX_EVIDENCE_CHARS / 3),
    );
    const { text, urls } = buildEvidence(hits);
    expect(urls.length).toBeLessThan(10);
    expect(text.length).toBeLessThanOrEqual(MAX_EVIDENCE_CHARS + 200);
    expect(urls[0]).toBe('/en/projects/p0');
  });

  it('keeps one chunk even when it alone exceeds the budget', () => {
    expect(buildEvidence([hit('c0', '/en/projects/p0', MAX_EVIDENCE_CHARS * 2)]).urls).toHaveLength(1);
  });

  /** Many sections share one case study URL, and z.enum needs distinct members. */
  it('reports each URL once however many sections came from it', () => {
    const hits = [
      hit('a', '/en/projects/one', 10),
      hit('b', '/en/projects/one', 10),
      hit('c', '/en/projects/two', 10),
    ];
    expect(buildEvidence(hits).urls).toEqual(['/en/projects/one', '/en/projects/two']);
  });

  it('has nothing to cite when nothing was retrieved', () => {
    expect(buildEvidence([])).toEqual({ text: '', urls: [] });
  });
});

const result = {
  verdict: 'A fair fit.',
  requirements: [
    {
      requirement: 'PyTorch in production',
      kind: 'must' as const,
      level: 'partial' as const,
      note: 'Trained models, not served them.',
      url: '/en/projects/real',
    },
  ],
  talkingPoints: [],
};

describe('matchSchemaFor', () => {
  /**
   * The prompt used to ask the model to copy a URL from the evidence and
   * nothing enforced it, so an invented path became a 404 link inside an
   * assessment sent to a recruiter. The enum makes it unrepresentable.
   */
  it('refuses a URL that was not retrieved', () => {
    const schema = matchSchemaFor(['/en/projects/real']);
    expect(schema.safeParse(result).success).toBe(true);
    expect(
      schema.safeParse({
        ...result,
        requirements: [{ ...result.requirements[0], url: '/en/projects/invented' }],
      }).success,
    ).toBe(false);
  });

  it('accepts null for a requirement with nothing to cite', () => {
    const schema = matchSchemaFor(['/en/projects/real']);
    expect(
      schema.safeParse({
        ...result,
        requirements: [{ ...result.requirements[0], url: null }],
      }).success,
    ).toBe(true);
  });

  it('dedupes before building the enum, since sections share a URL', () => {
    expect(matchSchemaFor(['/en/a', '/en/a', '/en/b']).safeParse(result).success).toBe(false);
    expect(matchSchemaFor(['/en/projects/real', '/en/projects/real']).safeParse(result).success).toBe(
      true,
    );
  });

  it('falls back rather than throwing on an empty enum', () => {
    expect(() => matchSchemaFor([])).not.toThrow();
    expect(matchSchemaFor([]).safeParse(result).success).toBe(true);
  });

  /**
   * The client cannot know which URLs were retrieved, so it validates against
   * the permissive shape. That only works while the two stay structurally
   * identical — anything the narrowed server schema can produce must parse.
   */
  it('produces objects the client schema accepts', () => {
    const parsed = matchSchemaFor(['/en/projects/real']).parse(result);
    expect(matchSchema.safeParse(parsed).success).toBe(true);
  });
});

describe('matchCacheKey', () => {
  it('ignores differences that do not change the posting', async () => {
    expect(await matchCacheKey('  Senior   ML\n Engineer ', 'en')).toBe(
      await matchCacheKey('senior ml engineer', 'en'),
    );
  });

  it('separates the two locales, which get different prompts and answers', async () => {
    expect(await matchCacheKey('senior ml engineer', 'en')).not.toBe(
      await matchCacheKey('senior ml engineer', 'vi'),
    );
  });

  /**
   * Keyed on what the corpus says, not on when it was last built. A build time
   * would invalidate every cached analysis on every deploy, which makes a
   * seven-day TTL mean nothing.
   */
  it('is keyed on the corpus, so a redeploy of unchanged content keeps it', () => {
    expect(knowledgeMeta.fingerprint).toMatch(/^[0-9a-f]{6,}$/);
  });

  it('separates two different postings', async () => {
    expect(await matchCacheKey('senior ml engineer', 'en')).not.toBe(
      await matchCacheKey('senior ml scientist', 'en'),
    );
  });
});
