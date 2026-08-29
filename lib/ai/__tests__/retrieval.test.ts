import { describe, expect, it } from 'vitest';
import { retrieve, knowledgeMeta } from '../retrieval';

/**
 * These run against the real index, which is what makes them useful: they fail
 * when a case study is rewritten in a way that makes it unfindable.
 */
describe('retrieve', () => {
  it('has an index to search', () => {
    expect(knowledgeMeta.chunks).toBeGreaterThan(50);
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

  it('returns nothing rather than noise for an unrelated query', async () => {
    const hits = await retrieve('zzzz qqqq wwww', { locale: 'en' });
    expect(hits).toHaveLength(0);
  });

  it('respects the limit', async () => {
    const hits = await retrieve('model', { locale: 'en', limit: 3 });
    expect(hits.length).toBeLessThanOrEqual(3);
  });
});
