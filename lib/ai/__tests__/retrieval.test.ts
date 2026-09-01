import { describe, expect, it } from 'vitest';
import { retrieve, retrieveMany, lexicalCoverage, knowledgeMeta } from '../retrieval';
import {
  ML_PLATFORM_JD,
  ML_PLATFORM_QUERIES,
  DATA_ANALYST_JD,
  PASTRY_CHEF_JD,
  ICU_NURSE_JD,
} from './fixtures/job-descriptions';

/**
 * The vector half only runs when both an index built with embeddings and an API
 * key are present. Tests that depend on it are skipped otherwise rather than
 * silently passing against BM25 alone and claiming coverage they do not have.
 */
const semantic = Boolean(knowledgeMeta.embeddings) && Boolean(process.env.OPENAI_API_KEY);
const itSemantic = semantic ? it : it.skip;

/**
 * These run against the real index, which is what makes them useful: they fail
 * when a case study is rewritten in a way that makes it unfindable.
 */
describe('retrieve', () => {
  it('has an index to search', () => {
    expect(knowledgeMeta.chunks).toBeGreaterThan(50);
  });

  it('indexes the achievements, so the agent can cite a credential', async () => {
    const hits = await retrieve('Student Scientific Research Award prize', { locale: 'en' });
    expect(hits.some((hit) => hit.chunk.section === 'Achievements')).toBe(true);
  });

  it('finds the diacritic project from its exact metric name', async () => {
    const hits = await retrieve('ChrF++ score', { locale: 'en' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.chunk.url.includes('neural-machine-translation'))).toBe(true);
  });

  it('finds the fraud project from resampling terminology', async () => {
    const hits = await retrieve('ADASYN class imbalance', { locale: 'en' });
    expect(hits.some((hit) => hit.chunk.url.includes('credit-card-fraud-detection'))).toBe(true);
  });

  it('finds the inference work from quantisation terms', async () => {
    const hits = await retrieve('INT8 TensorRT quantisation speedup', { locale: 'en' });
    expect(hits.some((hit) => hit.chunk.url.includes('gpu-inference-optimization'))).toBe(true);
  });

  it('never leaks chunks from the other locale', async () => {
    const hits = await retrieve('Transformer', { locale: 'vi' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.chunk.locale === 'vi')).toBe(true);
  });

  it('answers an undiacritised Vietnamese query', async () => {
    const hits = await retrieve('khoi phuc dau tieng viet', { locale: 'vi' });
    expect(hits.some((hit) => hit.chunk.url.includes('neural-machine-translation'))).toBe(true);
  });

  it('returns nothing for a query with no matching terms', async () => {
    const hits = await retrieve('zzzz qqqq wwww', { locale: 'en' });
    expect(hits).toHaveLength(0);
  });

  /**
   * The reason MIN_SIMILARITY exists. Embeddings always return a nearest
   * neighbour, so without a floor an off-topic question hands the agent six
   * irrelevant passages and invites it to answer from them.
   */
  itSemantic('returns nothing for a fluent but off-topic question', async () => {
    for (const query of [
      'what is the best recipe for sourdough bread',
      'how do I renew a passport in Canada',
    ]) {
      expect(await retrieve(query, { locale: 'en' })).toHaveLength(0);
    }
  });

  itSemantic('still answers a paraphrase that shares no exact terms', async () => {
    // No chunk contains "skewed classes"; only the embedding half can find this.
    const hits = await retrieve('dealing with very skewed classes', { locale: 'en' });
    expect(hits.some((hit) => hit.chunk.url.includes('credit-card-fraud-detection'))).toBe(true);
  });

  it('respects the limit', async () => {
    const hits = await retrieve('model', { locale: 'en', limit: 3 });
    expect(hits.length).toBeLessThanOrEqual(3);
  });
});

/**
 * Document mode exists because the coverage floor was calibrated on short chat
 * queries and the job matcher was feeding it whole job postings. A posting
 * dilutes its technical terms with company prose, so the ratio fell below the
 * floor and the lexical half switched itself off — silently, and depending on
 * nothing more meaningful than how much PR copy a recruiter had written.
 */
describe('retrieve, document mode', () => {
  it('reads a posting that the query floor would have thrown away', async () => {
    expect(lexicalCoverage(DATA_ANALYST_JD, 'query').passes).toBe(false);
    expect(lexicalCoverage(DATA_ANALYST_JD, 'document').passes).toBe(true);
    expect((await retrieve(DATA_ANALYST_JD, { locale: 'en', mode: 'document' })).length).toBeGreaterThan(0);
  });

  it('leaves the chat floor exactly where it was', () => {
    // The same postings still fail the stricter floor: this lowered a floor for
    // one caller, it did not lower the floor.
    expect(lexicalCoverage(DATA_ANALYST_JD, 'query').floor).toBe(0.4);
    expect(lexicalCoverage(DATA_ANALYST_JD, 'document').floor).toBe(0.25);
    expect(lexicalCoverage('what is the best recipe for sourdough bread', 'query').passes).toBe(false);
  });

  /**
   * Both halves have to refuse, and for a document that is not automatic. The
   * lexical floor throws these out on coverage; the vector half needed its own
   * document floor, because a long text scores high against everything and at
   * the query floor of 0.20 a pastry-chef posting still retrieved five machine
   * learning passages.
   */
  it('still refuses a posting the corpus has nothing to say about', async () => {
    for (const jd of [PASTRY_CHEF_JD, ICU_NURSE_JD]) {
      expect(lexicalCoverage(jd, 'document').passes).toBe(false);
      expect(await retrieve(jd, { locale: 'en', mode: 'document' })).toHaveLength(0);
    }
  });
});

describe('retrieveMany', () => {
  /** The contract that keeps every test above meaningful after the rewrite. */
  it('is exactly retrieve when there is one query', async () => {
    const [one, many] = await Promise.all([
      retrieve('ADASYN class imbalance', { locale: 'en' }),
      retrieveMany(['ADASYN class imbalance'], { locale: 'en' }),
    ]);
    expect(many).toEqual(one);
  });

  /**
   * The reason the matcher searches per requirement rather than once with the
   * whole posting. This posting's single best match in the corpus is the line
   * "fraud detection or risk modelling is a plus" — one line diluted across two
   * thousand characters of prose, which a single query loses.
   */
  it('surfaces evidence for a requirement the posting mentions only once', async () => {
    const hits = await retrieveMany(ML_PLATFORM_QUERIES, { locale: 'en', limit: 14 });
    const urls = hits.map((hit) => hit.chunk.url);
    expect(urls.some((url) => url.includes('credit-card-fraud-detection'))).toBe(true);
    expect(urls.some((url) => url.includes('gpu-inference-optimization'))).toBe(true);
  });

  it('returns each chunk once and never more than the limit', async () => {
    const hits = await retrieveMany(ML_PLATFORM_QUERIES, { locale: 'en', limit: 8 });
    expect(hits.length).toBeLessThanOrEqual(8);
    expect(new Set(hits.map((hit) => hit.chunk.id)).size).toBe(hits.length);
  });

  it('ignores blank and duplicate queries', async () => {
    const hits = await retrieveMany(['  ', '', 'ChrF++ score', 'ChrF++ score'], { locale: 'en' });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits).toEqual(await retrieve('ChrF++ score', { locale: 'en' }));
  });

  it('has nothing to search for when every query is blank', async () => {
    expect(await retrieveMany(['', '   '], { locale: 'en' })).toHaveLength(0);
  });

  it('never leaks the other locale, however many queries there are', async () => {
    const hits = await retrieveMany(ML_PLATFORM_QUERIES, { locale: 'vi', limit: 14 });
    expect(hits.every((hit) => hit.chunk.locale === 'vi')).toBe(true);
  });

  it('reads a whole posting in document mode too', async () => {
    expect(
      (await retrieveMany([ML_PLATFORM_JD], { locale: 'en', mode: 'document', limit: 14 })).length,
    ).toBeGreaterThan(0);
  });
});
