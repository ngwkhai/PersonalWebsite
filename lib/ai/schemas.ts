import { z } from 'zod';
import { KINDS, LEVELS } from './score';

/** Cap on requirements carried through both stages. */
export const MAX_REQUIREMENTS = 12;

/**
 * What the cheap model pulls out of a pasted posting, before any evidence is
 * looked at.
 *
 * Two fields for the requirement rather than one: `text` is what a reader sees,
 * `query` is what the retriever searches for. Keeping the retrieval string free
 * of prose is what makes the per-requirement search work — a short run of
 * technical terms clears the lexical coverage floor comfortably, where the
 * posting it came from does not.
 *
 * `kind` is fixed here, before the analysis model sees any evidence, so it
 * cannot lower the stakes of a requirement it turns out not to be able to meet.
 */
export const jdRequirementsSchema = z.object({
  language: z.enum(['en', 'vi']).describe('The language the posting is written in.'),
  role: z.string().max(120).describe('The job title, in the posting’s own words.'),
  requirements: z
    .array(
      z.object({
        text: z.string().max(160).describe('The requirement, in the posting’s own words.'),
        kind: z
          .enum(KINDS)
          .describe(
            '"must" if the posting states it as required, "nice" if listed as preferred, bonus or a plus.',
          ),
        query: z
          .string()
          .max(120)
          .describe(
            'Search terms only — the skills, tools, methods and metrics named. No verbs, no company prose, no years-of-experience.',
          ),
      }),
    )
    .min(1)
    .max(MAX_REQUIREMENTS),
});

export type JdRequirements = z.infer<typeof jdRequirementsSchema>;

/**
 * The JD-match output shape.
 *
 * One list, not a matched list and a gaps list. Two independent arrays gave the
 * score no denominator — the model could return eight matches and no gaps and
 * nothing was wrong with that — so the page splits one judged list instead.
 *
 * There is no `score` field. The model judges; `lib/ai/score.ts` does the
 * arithmetic. A number the model cannot emit is a number it cannot inflate.
 *
 * Key order is load-bearing: structured output fills fields in schema order, so
 * `verdict` first means something readable lands while the rest is still coming.
 */
function matchShape(url: z.ZodType<string | null, string | null>) {
  return z.object({
    verdict: z.string().max(240).describe('One sentence. What a hiring manager should take away.'),
    requirements: z
      .array(
        z.object({
          requirement: z.string().max(160).describe('Copied exactly from the requirement list.'),
          kind: z.enum(KINDS).describe('Copied exactly from the requirement list. Do not change it.'),
          level: z
            .enum(LEVELS)
            .describe(
              '"strong" if the evidence demonstrates it outright, "partial" if it shows something adjacent, "none" if the evidence does not show it.',
            ),
          note: z
            .string()
            .max(320)
            .describe(
              'For strong and partial: the specific project and result, with metrics quoted exactly. For none: why the corpus does not evidence it, without speculating that he might have it anyway.',
            ),
          url,
        }),
      )
      .max(MAX_REQUIREMENTS),
    talkingPoints: z
      .array(z.string().max(200))
      .max(4)
      .describe('What is worth raising in a first conversation, given this posting.'),
  });
}

/**
 * The shape the browser validates against. It cannot enumerate the URLs the
 * server retrieved, so it accepts any string — which is safe, because it only
 * ever parses what the server produced under the narrowed schema below.
 */
export const matchSchema = matchShape(z.string().nullable());

export type MatchResult = z.infer<typeof matchSchema>;

/**
 * The same shape, narrowed per request so structured output *cannot* emit a URL
 * that was not retrieved. The prompt used to ask for this and nothing enforced
 * it; a hallucinated path became a 404 link in an assessment sent to a
 * recruiter.
 *
 * Chunk URLs repeat — many sections share one case study — so they are deduped
 * before the enum, which requires distinct members. With nothing retrieved
 * there is no enum to build and the permissive shape stands in; the caller
 * refuses to run at all in that case.
 */
export function matchSchemaFor(urls: readonly string[]) {
  const unique = [...new Set(urls)];
  if (unique.length === 0) return matchSchema;
  return matchShape(z.enum(unique as [string, ...string[]]).nullable());
}

export const AUDIENCES = ['recruiter', 'engineer', 'researcher'] as const;
export type Audience = (typeof AUDIENCES)[number];
