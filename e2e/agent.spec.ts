import { test, expect } from '@playwright/test';

/**
 * These run against `next start`, so NODE_ENV is production — and in production
 * the AI routes refuse to serve without Upstash, because there would be no
 * ceiling on spend. Live agent coverage therefore needs both a model key and
 * Redis; with either missing, the guard tests below run instead and assert the
 * refusal itself.
 */
const hasKey = Boolean(process.env.OPENAI_API_KEY);
const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
const live = hasKey && hasRedis;

test.describe('agent, live', () => {
  test.skip(!live, 'needs OPENAI_API_KEY and Upstash credentials');
  test.describe.configure({ mode: 'serial', timeout: 90_000 });

  test('answers a factual question with the exact metric and a source', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('button', { name: 'Ask', exact: true }).first().click();

    const dock = page.getByRole('complementary');
    await dock.getByRole('textbox').fill('What BLEU score did the Transformer reach?');
    await dock.getByRole('button', { name: 'Send' }).click();

    await expect(dock.getByText('81.31')).toBeVisible({ timeout: 60_000 });
    await expect(dock.getByRole('link', { name: /neural-machine-translation/ })).toBeVisible();
  });

  test('declines a question the case studies cannot answer', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('button', { name: 'Ask', exact: true }).first().click();

    const dock = page.getByRole('complementary');
    await dock.getByRole('textbox').fill('What is the best recipe for sourdough bread?');
    await dock.getByRole('button', { name: 'Send' }).click();

    await expect(dock.getByText(/Khai|portfolio|projects|work/i).last()).toBeVisible({
      timeout: 60_000,
    });
    // It must not have gone rummaging through the case studies for an answer.
    await expect(dock.getByText('81.31')).toHaveCount(0);
  });

  /**
   * The posting below mentions fraud detection once, in a "nice to have" line
   * near the end. Retrieving with the whole posting as one query loses it; that
   * is why the matcher extracts requirements and searches per requirement, and
   * this asserts the outcome rather than the mechanism.
   *
   * It also pins the two things a recruiter would notice first: a score exists
   * at all (it is computed from the judgements, so an empty evidence set shows
   * as no score), and every link in it resolves.
   *
   * This spends one of the five analyses an IP gets per hour, and it cannot be
   * served from cache because `pnpm build` re-embeds the corpus. Repeated runs
   * inside an hour will fail on the rate limit rather than on anything wrong.
   */
  test('reads a posting for what it asks for, and cites pages that exist', async ({ page }) => {
    await page.goto('/en/match');
    await page.getByRole('textbox').fill(FRAUD_ML_JD);
    await page.getByRole('button', { name: 'Analyse fit' }).click();

    const score = page.locator('p.font-mono.tabular-nums').first();
    await expect(score).toHaveText(/^\d+\/100$/, { timeout: 90_000 });

    await expect(page.getByRole('link', { name: /credit-card-fraud-detection/ })).toBeVisible();

    for (const link of await page.getByRole('link', { name: /\/projects\// }).all()) {
      const href = await link.getAttribute('href');
      expect((await page.request.get(href!)).status()).toBe(200);
    }
  });
});

const FRAUD_ML_JD = `Machine Learning Engineer, Risk Platform

Responsibilities
- Ship production machine learning services and own their deployment end to end.
- Improve inference latency and throughput on GPU infrastructure.

Requirements
- Strong Python, with PyTorch or TensorFlow.
- Experience with Kubernetes, Docker and a major cloud provider.
- Familiarity with model quantisation and inference optimisation.

Nice to have
- Fraud detection or imbalanced-class modelling.

We offer a competitive salary, equity and a learning budget, and we are an equal
opportunity employer.`;

test.describe('spend guard', () => {
  test.skip(live, 'runs only when the agent is deliberately unable to serve');

  for (const route of ['/api/chat', '/api/match', '/api/explain']) {
    test(`${route} refuses to run unmetered`, async ({ request }) => {
      const response = await request.post(route, {
        data: { locale: 'en', messages: [], jd: 'x'.repeat(200), slug: 'x', audience: 'engineer' },
      });
      // 503 unconfigured is the point; 400 is acceptable if validation runs
      // first. What must never happen is a 200 with a model call behind it.
      expect([400, 503]).toContain(response.status());
    });
  }
});

test.describe('input validation', () => {
  test('rejects a malformed chat body', async ({ request }) => {
    const response = await request.post('/api/chat', { data: { nonsense: true } });
    expect([400, 503]).toContain(response.status());
  });

  test('rejects a job description too short to analyse', async ({ request }) => {
    const response = await request.post('/api/match', { data: { jd: 'hi', locale: 'en' } });
    expect([400, 503]).toContain(response.status());
  });

  test('rejects an oversized job description', async ({ request }) => {
    const response = await request.post('/api/match', {
      data: { jd: 'a'.repeat(20_000), locale: 'en' },
    });
    expect([400, 503]).toContain(response.status());
  });
});
