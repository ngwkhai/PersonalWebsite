import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting is optional infrastructure: without Upstash credentials the
 * helpers below fail open in development and fail *closed* for the AI routes in
 * production, which is checked at the call site. Never silently allow unmetered
 * model calls in production.
 */
const configured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = configured ? Redis.fromEnv() : null;

function limiter(
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string,
) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix,
  });
}

/** Conversational bursts. Generous enough for a real visitor, not for a script. */
export const chatBurstLimit = limiter(10, '10 m', 'rl:chat:burst');
/** The daily ceiling per visitor. */
export const chatDailyLimit = limiter(40, '24 h', 'rl:chat:day');
/** JD analysis is the expensive path, so it is metered far harder. */
export const matchLimit = limiter(5, '1 h', 'rl:match');
/** The cheap rewrite path. */
export const explainLimit = limiter(20, '1 h', 'rl:explain');
export const contactLimit = limiter(3, '1 h', 'rl:contact');

export type LimitOutcome = { ok: true } | { ok: false; reason: 'rate' | 'budget' };

/**
 * Identifies the caller for rate limiting.
 *
 * Header order matters for security. `x-forwarded-for` is attacker-controlled
 * unless something upstream overwrites it: a client can send any value it
 * likes, and rotating it would defeat per-IP limiting entirely. Vercel sets
 * `x-vercel-forwarded-for` at its edge and it cannot be forged from outside,
 * so that is preferred wherever it exists, with the weaker headers as a
 * fallback for other hosts and local development.
 *
 * Falling back to a single shared 'anonymous' bucket is deliberate: an
 * unidentifiable caller sharing one quota with every other unidentifiable
 * caller is the safe failure, and is far better than handing each of them a
 * private allowance.
 */
export function clientKey(headers: Headers): string {
  const trusted = headers.get('x-vercel-forwarded-for')?.trim();
  if (trusted) return trusted.split(',')[0]!.trim();

  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;

  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'anonymous';
}

/**
 * A hard daily ceiling on spend across all visitors, independent of per-IP
 * limits. A hundred distinct IPs each staying under their own limit would
 * otherwise still produce an unbounded bill.
 *
 * Costs are recorded after each call by `recordSpend`, so this reflects real
 * usage rather than an estimate made up front.
 */
const DAILY_BUDGET_USD = Number(process.env.AI_DAILY_BUDGET_USD ?? '2');

function todayKey() {
  return `spend:${new Date().toISOString().slice(0, 10)}`;
}

export async function budgetRemaining(): Promise<boolean> {
  if (!redis) return true;
  const spent = Number((await redis.get<number>(todayKey())) ?? 0);
  return spent < DAILY_BUDGET_USD;
}

export async function recordSpend(usd: number): Promise<void> {
  if (!redis || usd <= 0) return;
  const key = todayKey();
  // Stored in micro-dollars: Redis INCRBYFLOAT exists, but integers avoid any
  // float accumulation drift across a day of small calls.
  const micro = Math.round(usd * 1_000_000);
  await redis.incrby(`${key}:micro`, micro);
  const total = Number((await redis.get<number>(`${key}:micro`)) ?? 0) / 1_000_000;
  await redis.set(key, total, { ex: 60 * 60 * 36 });
}

/** Applies every gate an AI route needs, in cost order: cheapest check first. */
export async function guardAiRequest(
  headers: Headers,
  limits: (ReturnType<typeof limiter> | null)[],
): Promise<LimitOutcome> {
  const key = clientKey(headers);

  for (const limit of limits) {
    if (!limit) continue;
    const { success } = await limit.limit(key);
    if (!success) return { ok: false, reason: 'rate' };
  }

  if (!(await budgetRemaining())) return { ok: false, reason: 'budget' };
  return { ok: true };
}
