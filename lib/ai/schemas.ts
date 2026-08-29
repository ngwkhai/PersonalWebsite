import { z } from 'zod';

/**
 * The JD-match output shape. Deliberately forces the model to name gaps as a
 * first-class field: an analysis that only lists strengths is a sales pitch,
 * and a recruiter can tell.
 */
export const matchSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'Overall fit, 0-100. Be calibrated: 90+ means almost every requirement is evidenced.',
    ),
  verdict: z.string().max(240).describe('One sentence. What a hiring manager should take away.'),
  matched: z
    .array(
      z.object({
        requirement: z.string().max(160).describe('The requirement, in the posting’s own words.'),
        evidence: z
          .string()
          .max(320)
          .describe('The specific project and result that demonstrates it. Quote metrics exactly.'),
        url: z
          .string()
          .describe('Site-relative URL of the case study, from the retrieved passages.'),
      }),
    )
    .max(8),
  gaps: z
    .array(
      z.object({
        requirement: z.string().max(160),
        note: z
          .string()
          .max(240)
          .describe(
            'Why the corpus does not evidence this. Do not speculate that he might have it.',
          ),
      }),
    )
    .max(8),
  talkingPoints: z
    .array(z.string().max(200))
    .max(4)
    .describe('What is worth raising in a first conversation, given this posting.'),
});

export type MatchResult = z.infer<typeof matchSchema>;

export const AUDIENCES = ['recruiter', 'engineer', 'researcher'] as const;
export type Audience = (typeof AUDIENCES)[number];
