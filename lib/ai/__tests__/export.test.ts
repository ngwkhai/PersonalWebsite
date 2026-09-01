import { describe, expect, it } from 'vitest';
import { toMarkdown } from '../export';

const labels = {
  title: 'Job description matcher',
  score: 'Fit',
  matched: 'Backed by evidence',
  gaps: 'Not evidenced',
  talkingPoints: 'Worth raising',
  must: 'must-have',
  nice: 'nice to have',
};

const result = {
  verdict: 'A fair fit with a real platform gap.',
  requirements: [
    {
      requirement: 'PyTorch in production',
      kind: 'must' as const,
      level: 'partial' as const,
      note: 'Trained models, did not serve them.',
      url: '/en/projects/ai-server',
    },
    {
      requirement: 'Kubernetes',
      kind: 'must' as const,
      level: 'none' as const,
      note: 'Nothing in the case studies shows it.',
      url: null,
    },
  ],
  talkingPoints: ['Ask how he chose the fraud threshold.'],
};

describe('toMarkdown', () => {
  it('carries the score, the verdict and both lists', () => {
    const markdown = toMarkdown(result, 50, labels);
    expect(markdown).toContain('**Fit: 50/100**');
    expect(markdown).toContain('A fair fit with a real platform gap.');
    expect(markdown).toContain('## Backed by evidence');
    expect(markdown).toContain('## Not evidenced');
    expect(markdown).toContain('- Ask how he chose the fraud threshold.');
  });

  it('labels each requirement must-have or nice to have', () => {
    const markdown = toMarkdown(result, 50, labels);
    expect(markdown).toContain('**PyTorch in production** (must-have)');
  });

  /** A relative link is no use once the assessment leaves the page. */
  it('makes cited links absolute', () => {
    expect(toMarkdown(result, 50, labels, 'https://ngwkhai.dev')).toContain(
      'https://ngwkhai.dev/en/projects/ai-server',
    );
  });

  it('writes no link for a requirement with nothing to cite', () => {
    const gapLine = toMarkdown(result, 50, labels)
      .split('\n')
      .find((line) => line.includes('Nothing in the case studies'));
    expect(gapLine).not.toContain('http');
    expect(gapLine).not.toContain('—');
  });

  it('leaves out sections that have nothing in them', () => {
    const markdown = toMarkdown({ verdict: 'Nothing to go on.' }, 0, labels);
    expect(markdown).not.toContain('## Backed by evidence');
    expect(markdown).not.toContain('## Worth raising');
    expect(markdown).toContain('Nothing to go on.');
  });

  it('ignores requirements that were still streaming', () => {
    const markdown = toMarkdown(
      { requirements: [{ requirement: 'half-written' }, undefined] },
      0,
      labels,
    );
    expect(markdown).not.toContain('half-written');
  });
});
