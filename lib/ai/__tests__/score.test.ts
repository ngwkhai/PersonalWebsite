import { describe, expect, it } from 'vitest';
import { isJudged, scoreMatch, splitRequirements, type Kind, type Level } from '../score';

const item = (kind: Kind, level: Level) => ({ requirement: 'x', kind, level, note: '', url: null });

describe('scoreMatch', () => {
  it('is zero when there is nothing to score', () => {
    expect(scoreMatch(undefined)).toBe(0);
    expect(scoreMatch([])).toBe(0);
  });

  it('is 100 only when everything asked for is evidenced', () => {
    expect(scoreMatch([item('must', 'strong'), item('nice', 'strong')])).toBe(100);
  });

  it('is 0 when nothing is', () => {
    expect(scoreMatch([item('must', 'none'), item('nice', 'none')])).toBe(0);
  });

  it('gives partial evidence half credit', () => {
    expect(scoreMatch([item('nice', 'partial')])).toBe(50);
  });

  it('weighs a must-have three times a nice-to-have', () => {
    // One must met and one nice missed beats one nice met and one must missed.
    const mustMet = scoreMatch([item('must', 'strong'), item('nice', 'none')]);
    const niceMet = scoreMatch([item('nice', 'strong'), item('must', 'none')]);
    expect(mustMet).toBe(75);
    expect(niceMet).toBe(25);
  });

  /**
   * The reason the ceiling exists. Without it a posting stacked with satisfied
   * nice-to-haves reads in the nineties while a stated requirement is missing,
   * which is precisely the number a recruiter would call inflated.
   */
  it('caps the score while any must-have is unevidenced', () => {
    const items = [item('must', 'none'), ...Array.from({ length: 9 }, () => item('nice', 'strong'))];
    expect(scoreMatch(items)).toBe(74);
  });

  /**
   * The streaming case. The UI scores a partial object every keystroke of the
   * response: rows arrive with a requirement long before they have a level, and
   * the array itself is sparse. Counting those as zero would make the score
   * fall as evidence arrived.
   */
  it('ignores rows that have not been judged yet', () => {
    expect(scoreMatch([item('must', 'strong'), { requirement: 'half-written' }, undefined])).toBe(
      100,
    );
    expect(scoreMatch([{ kind: 'must' }, { level: 'strong' }, null, 'nonsense'])).toBe(0);
  });

  it('never leaves the 0-100 range, and is always an integer', () => {
    for (const kind of ['must', 'nice'] as const) {
      for (const level of ['strong', 'partial', 'none'] as const) {
        const score = scoreMatch([item(kind, level), item('nice', 'partial')]);
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('never falls when a single judgement improves', () => {
    const rest = [item('must', 'strong'), item('nice', 'partial'), item('nice', 'strong')];
    const none = scoreMatch([item('must', 'none'), ...rest]);
    const partial = scoreMatch([item('must', 'partial'), ...rest]);
    const strong = scoreMatch([item('must', 'strong'), ...rest]);
    expect(none).toBeLessThanOrEqual(partial);
    expect(partial).toBeLessThanOrEqual(strong);
  });
});

describe('isJudged', () => {
  it('rejects anything that is not a complete judgement', () => {
    expect(isJudged(item('must', 'strong'))).toBe(true);
    expect(isJudged({ kind: 'must' })).toBe(false);
    expect(isJudged({ kind: 'required', level: 'strong' })).toBe(false);
    expect(isJudged(undefined)).toBe(false);
    expect(isJudged(null)).toBe(false);
  });
});

describe('splitRequirements', () => {
  it('sends unevidenced requirements to gaps and the rest to matched', () => {
    const { matched, gaps } = splitRequirements([
      item('must', 'strong'),
      item('nice', 'partial'),
      item('must', 'none'),
    ]);
    expect(matched.map((entry) => entry.level)).toEqual(['strong', 'partial']);
    expect(gaps).toHaveLength(1);
  });

  it('shows a half-streamed row in neither list', () => {
    const { matched, gaps } = splitRequirements([{ requirement: 'still arriving' }, undefined]);
    expect(matched).toHaveLength(0);
    expect(gaps).toHaveLength(0);
  });

  it('survives an absent list', () => {
    expect(splitRequirements(undefined)).toEqual({ matched: [], gaps: [] });
  });
});
