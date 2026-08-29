import { describe, expect, it } from 'vitest';
import { estimateCost, MODELS } from '../models';

describe('estimateCost', () => {
  it('prices a plain call from the published rates', () => {
    // terra: $2.00 / 1M in, $12.00 / 1M out
    expect(estimateCost('gpt-5.6-terra', { inputTokens: 1_000_000, outputTokens: 0 })).toBeCloseTo(
      2,
      6,
    );
    expect(estimateCost('gpt-5.6-terra', { inputTokens: 0, outputTokens: 1_000_000 })).toBeCloseTo(
      12,
      6,
    );
  });

  it('bills cached input at a tenth, and does not double-count it', () => {
    const cached = estimateCost('gpt-5.6-terra', {
      inputTokens: 1_000_000,
      cachedInputTokens: 1_000_000,
      outputTokens: 0,
    });
    expect(cached).toBeCloseTo(0.2, 6);
  });

  it('returns zero for a model it does not know rather than guessing', () => {
    expect(estimateCost('some-future-model', { inputTokens: 1_000_000 })).toBe(0);
  });

  it('routes conversation to the mid-tier model, not the frontier one', () => {
    expect(MODELS.chat).toBe('gpt-5.6-terra');
    expect(MODELS.analysis).toBe('gpt-5.6-sol');
  });
});
