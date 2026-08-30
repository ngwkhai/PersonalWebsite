import { streamText } from 'ai';
import { z } from 'zod';
import { openai, MODELS, estimateCost } from '@/lib/ai/models';
import { getProject } from '@/lib/content';
import { AUDIENCES } from '@/lib/ai/schemas';
import { guardAiRequest, recordSpend, explainLimit, redis } from '@/lib/rate-limit';
import { locales } from '@/i18n/routing';

export const maxDuration = 20;

const body = z.object({
  slug: z.string().max(80),
  audience: z.enum(AUDIENCES),
  locale: z.enum(locales).default('en'),
});

const BRIEF: Record<(typeof AUDIENCES)[number], string> = {
  recruiter:
    'a non-technical recruiter: what problem it solved, what it demonstrates about him, and why the result is good. No jargon without a plain-language gloss.',
  engineer:
    'a working engineer: the architecture, the trade-offs, and what would break at scale. Assume they know the tools.',
  researcher:
    'a researcher: the hypothesis, why the method suits it, what the numbers do and do not establish, and the honest limitations.',
};

/**
 * Rewrites a case-study summary at a chosen depth. Cheap by construction: one
 * short call to the small model over content already in memory, no retrieval.
 */
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'unconfigured' }, { status: 503 });
  }
  if (process.env.NODE_ENV === 'production' && !redis) {
    return Response.json({ error: 'unconfigured' }, { status: 503 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'bad_request' }, { status: 400 });

  const guard = await guardAiRequest(request.headers, [explainLimit]);
  if (!guard.ok) return Response.json({ error: guard.reason }, { status: 429 });

  const { slug, audience, locale } = parsed.data;
  const project = getProject(locale, slug);
  if (!project) return Response.json({ error: 'not_found' }, { status: 404 });

  const result = streamText({
    model: openai(MODELS.cheap),
    system: `Rewrite a project summary for ${BRIEF[audience]}

Two or three sentences, at most 70 words. Use only what the case study says — never add a fact, a number or a technology that is not there. Quote metrics exactly. Write in ${locale === 'vi' ? 'Vietnamese' : 'English'}. Return prose only, no preamble and no heading.`,
    prompt: `Title: ${project.title}
Summary: ${project.summary}
Role: ${project.role}
Stack: ${project.stack.join(', ')}
Results: ${project.metrics.map((m) => `${m.label} ${m.value}${m.note ? ` (${m.note})` : ''}`).join('; ')}

Case study:
${project.raw.slice(0, 6000)}`,
    maxOutputTokens: 220,
    // temperature is deliberately absent: the GPT-5.6 models are reasoning
    // models and the SDK warns that they ignore it. Setting it implied a
    // control over output variance that does not exist.
    onFinish: async ({ usage }) => {
      await recordSpend(estimateCost(MODELS.cheap, usage));
    },
  });

  return result.toTextStreamResponse();
}
