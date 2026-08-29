import { createOpenAI } from '@ai-sdk/openai';

export const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Model routing. Each task gets the cheapest model that can do it well, which
 * is the difference between a portfolio agent that costs cents and one that
 * costs real money.
 *
 *   terra — conversation. The default; strong tool use at a fifth of Sol's
 *           output price.
 *   sol   — job-description analysis only. Reading a JD against seven case
 *           studies and naming the gaps honestly is the one task here where
 *           frontier reasoning changes the answer.
 *   luna  — summary rewrites and classification. Cheap, fast, sufficient.
 */
export const MODELS = {
  chat: 'gpt-5.6-terra',
  analysis: 'gpt-5.6-sol',
  cheap: 'gpt-5.6-luna',
  embedding: 'text-embedding-3-small',
} as const;

/** USD per 1M tokens. Cached input bills at 10% of the input rate. */
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5.6-sol': { input: 4.0, output: 20.0 },
  'gpt-5.6-terra': { input: 2.0, output: 12.0 },
  'gpt-5.6-luna': { input: 0.2, output: 1.2 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
};

export function estimateCost(
  model: string,
  usage: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number },
): number {
  const price = PRICING[model];
  if (!price) return 0;

  const cached = usage.cachedInputTokens ?? 0;
  const fresh = Math.max(0, (usage.inputTokens ?? 0) - cached);

  return (
    (fresh * price.input + cached * price.input * 0.1 + (usage.outputTokens ?? 0) * price.output) /
    1_000_000
  );
}
