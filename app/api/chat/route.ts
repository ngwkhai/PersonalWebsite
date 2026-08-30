import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { z } from 'zod';
import { openai, MODELS, estimateCost } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompt';
import { buildTools } from '@/lib/ai/tools';
import {
  guardAiRequest,
  recordSpend,
  chatBurstLimit,
  chatDailyLimit,
  redis,
} from '@/lib/rate-limit';
import { locales } from '@/i18n/routing';

export const maxDuration = 30;

const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;

const body = z.object({
  messages: z.array(z.unknown()).max(MAX_MESSAGES),
  locale: z.enum(locales).default('en'),
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'unconfigured' }, { status: 503 });
  }

  // Rate limiting is not optional in production. Without Redis there is no
  // ceiling on spend, so the route refuses to serve rather than run unmetered.
  if (process.env.NODE_ENV === 'production' && !redis) {
    console.error('[chat] Upstash is not configured; refusing to serve unmetered requests');
    return Response.json({ error: 'unconfigured' }, { status: 503 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'bad_request' }, { status: 400 });

  const messages = parsed.data.messages as UIMessage[];
  const locale = parsed.data.locale;

  // Cap input length before anything is billed.
  const characters = messages.reduce(
    (total, message) =>
      total +
      message.parts.reduce((sum, part) => sum + (part.type === 'text' ? part.text.length : 0), 0),
    0,
  );
  if (characters > MAX_CHARS * MAX_MESSAGES) {
    return Response.json({ error: 'too_long' }, { status: 413 });
  }

  const guard = await guardAiRequest(request.headers, [chatBurstLimit, chatDailyLimit]);
  if (!guard.ok) {
    return Response.json({ error: guard.reason }, { status: 429 });
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai(MODELS.chat),
    system: systemPrompt(locale),
    messages: modelMessages,
    tools: buildTools(locale),
    // Enough for search → refine → answer, or search → show → answer. Beyond
    // that the agent is looping rather than working.
    stopWhen: stepCountIs(6),
    maxOutputTokens: 1200,
    // temperature is deliberately absent: the GPT-5.6 models are reasoning
    // models and the SDK warns that they ignore it. Setting it implied a
    // control over output variance that does not exist.
    onFinish: async ({ usage }) => {
      await recordSpend(estimateCost(MODELS.chat, usage));
    },
    onError: ({ error }) => {
      console.error('[chat] stream failed', error);
    },
  });

  return result.toUIMessageStreamResponse();
}
