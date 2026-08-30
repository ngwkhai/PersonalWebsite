import { describe, expect, it } from 'vitest';
import { retrieve, knowledgeMeta } from '../retrieval';

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
