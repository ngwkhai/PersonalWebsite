import { test, expect } from '@playwright/test';

/**
 * Performance budgets, measured against the production build.
 *
 * Deliberately real metrics rather than a Lighthouse score: LCP and CLS are
 * what a visitor experiences, and asserting them here fails the build when a
 * change regresses them, which a score in a report does not.
 *
 * Chromium only — the PerformanceObserver entry types below are not
 * implemented in WebKit.
 */
test.describe('performance', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'metrics are Chromium-only');

  const BUDGET = {
    lcp: 2000,
    cls: 0.05,
    // Everything the browser must download to render the page.
    transferKb: 900,
    // Blocking scripts in the document head.
    renderBlocking: 0,
  };

  test('homepage stays inside its budget', async ({ page }) => {
    let transfer = 0;
    page.on('response', async (response) => {
      const length = Number(response.headers()['content-length'] ?? 0);
      transfer += length;
    });

    await page.goto('/en', { waitUntil: 'load' });
    // Give layout-shifting late arrivals (fonts, images) a chance to misbehave.
    await page.waitForTimeout(1500);

    const metrics = await page.evaluate(
      () =>
        new Promise<{ lcp: number; cls: number }>((resolve) => {
          let lcp = 0;
          let cls = 0;

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) lcp = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
              };
              if (!shift.hadRecentInput) cls += shift.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => resolve({ lcp, cls }), 600);
        }),
    );

    expect.soft(metrics.lcp, `LCP ${metrics.lcp.toFixed(0)}ms`).toBeLessThan(BUDGET.lcp);
    expect.soft(metrics.cls, `CLS ${metrics.cls.toFixed(4)}`).toBeLessThan(BUDGET.cls);
    expect
      .soft(transfer / 1024, `transfer ${(transfer / 1024).toFixed(0)}KB`)
      .toBeLessThan(BUDGET.transferKb);
  });

  test('ships no render-blocking scripts and no leaked keys', async ({ page }) => {
    await page.goto('/en');

    // [noModule] is excluded on purpose: it is Next's legacy polyfill, and no
    // browser that supports ES modules ever downloads or runs it, so it does
    // not block rendering for any real visitor.
    const blocking = await page
      .locator('head script[src]:not([async]):not([defer]):not([noModule])')
      .count();
    expect(blocking).toBe(BUDGET.renderBlocking);

    // A key reaching the client would be the single worst bug in this project.
    const scripts = await page.evaluate(() =>
      [...document.querySelectorAll('script')].map((s) => s.textContent ?? '').join(''),
    );
    expect(scripts).not.toMatch(/sk-[A-Za-z0-9_-]{20}/);
    expect(scripts).not.toMatch(/re_[A-Za-z0-9]{20}/);
    expect(scripts).not.toMatch(/ghp_[A-Za-z0-9]{20}/);
  });

  test('serves images as AVIF or WebP, never the original PNG', async ({ page }) => {
    const formats = new Set<string>();
    page.on('response', (response) => {
      const type = response.headers()['content-type'] ?? '';
      if (type.startsWith('image/')) formats.add(type);
    });

    await page.goto('/en/work/gpu-inference-optimization', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    expect([...formats].filter((f) => f.includes('png'))).toEqual([]);
  });
});
