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
});

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
