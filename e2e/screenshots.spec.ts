import { test } from '@playwright/test';

/**
 * Not assertions — a way to actually look at the mobile layout, which is
 * otherwise hard to inspect. Run with `pnpm shots`, then open
 * e2e/__screenshots__/.
 */
test.describe('capture', () => {
  test.skip(!process.env.CAPTURE, 'set CAPTURE=1 to write screenshots');

  const PAGES = [
    ['/en', 'home'],
    ['/en/projects/gpu-inference-optimization', 'case-study'],
    ['/en/resume', 'resume'],
    ['/en/match', 'match'],
  ] as const;

  for (const [path, name] of PAGES) {
    test(`${name}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `e2e/__screenshots__/${testInfo.project.name}-${name}.png`,
        fullPage: false,
      });
    });
  }
});
