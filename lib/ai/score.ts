/**
 * The fit score, computed rather than asked for.
 *
 * The model used to emit the number itself, which meant the same posting
 * scored differently on two runs and nobody — including the model — could say
 * where the number came from. Here the model only judges each requirement it
 * was given; the arithmetic is this file, and it is the same function on the
 * server and in the browser.
 *
 * Nothing in here imports anything. That is deliberate: the client bundles it.
 */

export const KINDS = ['must', 'nice'] as const;
export const LEVELS = ['strong', 'partial', 'none'] as const;

export type Kind = (typeof KINDS)[number];
export type Level = (typeof LEVELS)[number];

/** A must-have is worth three nice-to-haves. */
const WEIGHT: Record<Kind, number> = { must: 3, nice: 1 };

/** Partial evidence is half credit: adjacent experience, not the same thing. */
const CREDIT: Record<Level, number> = { strong: 1, partial: 0.5, none: 0 };

/**
 * Ceiling applied when any must-have is unevidenced. Without it nine satisfied
 * nice-to-haves drown one missing must, and the number stops meaning what a
 * recruiter reads into it.
 */
const MISSING_MUST_CEILING = 74;

export interface Judged {
  kind: Kind;
  level: Level;
}

const KIND_SET: ReadonlySet<string> = new Set(KINDS);
const LEVEL_SET: ReadonlySet<string> = new Set(LEVELS);

/**
 * Whether a streamed requirement has been judged yet.
 *
 * The UI calls this against a partial object: mid-stream the array holds rows
 * that have a `requirement` but no `level` yet, and sparse `undefined` slots.
 * Counting those as zero would make the score fall as evidence arrives.
 */
export function isJudged(item: unknown): item is Judged {
  if (typeof item !== 'object' || item === null) return false;
  const { kind, level } = item as { kind?: unknown; level?: unknown };
  return typeof kind === 'string' && KIND_SET.has(kind) && typeof level === 'string' && LEVEL_SET.has(level);
}

/**
 * Fit as a percentage of the weight a posting asked for. Returns 0 when
 * nothing has been judged, so a caller can distinguish "not yet" by checking
 * the list rather than by reading a sentinel out of the number.
 */
export function scoreMatch(items: readonly unknown[] | undefined): number {
  const judged = (items ?? []).filter(isJudged);
  if (judged.length === 0) return 0;

  let earned = 0;
  let possible = 0;
  let missingMust = false;

  for (const item of judged) {
    earned += WEIGHT[item.kind] * CREDIT[item.level];
    possible += WEIGHT[item.kind];
    if (item.kind === 'must' && item.level === 'none') missingMust = true;
  }

  const score = Math.round((earned / possible) * 100);
  return missingMust ? Math.min(score, MISSING_MUST_CEILING) : score;
}

/**
 * Splits judged requirements into the two lists the page shows. Unjudged rows
 * appear in neither, so a half-streamed row never flickers into "not evidenced"
 * on its way to being matched.
 */
export function splitRequirements<T>(items: readonly (T | undefined)[] | undefined) {
  const matched: (T & Judged)[] = [];
  const gaps: (T & Judged)[] = [];

  for (const item of items ?? []) {
    if (!isJudged(item)) continue;
    const judged = item as T & Judged;
    if (judged.level === 'none') gaps.push(judged);
    else matched.push(judged);
  }

  return { matched, gaps };
}
