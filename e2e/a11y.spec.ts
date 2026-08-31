import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['/en', 'homepage'],
  ['/vi', 'homepage, Vietnamese'],
  ['/en/projects', 'work index'],
  ['/en/projects/gpu-inference-optimization', 'case study'],
  ['/en/resume', 'résumé'],
  ['/en/match', 'job matcher'],
  ['/en/colophon', 'colophon'],
] as const;

async function audit(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}

test.describe('accessibility', () => {
  for (const [path, name] of PAGES) {
    test(`${name} has no WCAG violations`, async ({ page }) => {
      await page.goto(path);
      const { violations } = await audit(page);
      expect(
        violations.map((v) => `${v.id} (${v.nodes.length}) — ${v.help}`),
        JSON.stringify(violations, null, 2),
      ).toEqual([]);
    });
  }

  test('the open chat dock has no violations', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('button', { name: 'Ask', exact: true }).first().click();
    await expect(page.getByRole('complementary')).toBeVisible();
    const { violations } = await audit(page);
    expect(
      violations.map((v) => v.id),
      JSON.stringify(violations, null, 2),
    ).toEqual([]);
  });

  test('the closed chat dock is hidden from keyboard and screen readers', async ({ page }) => {
    await page.goto('/en');
    const dock = page.getByRole('complementary', { includeHidden: true });
    await expect(dock).toHaveAttribute('inert', '');
  });

  test('the skip link is the first thing a keyboard reaches', async ({ page, browserName }) => {
    // WebKit only moves focus to links on Tab when the OS "press Tab to
    // highlight each item" preference is on, so this asserts nothing there.
    test.skip(browserName === 'webkit', 'WebKit does not tab to links by default');
    await page.goto('/en');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /skip to content/i })).toBeFocused();
  });

  test('the skip link exists and targets the main landmark', async ({ page }) => {
    await page.goto('/en');
    const skip = page.getByRole('link', { name: /skip to content|tới nội dung/i });
    await expect(skip).toHaveAttribute('href', '#main');
    await expect(page.locator('#main')).toBeAttached();
  });

  test('every image carries an alt attribute', async ({ page }) => {
    await page.goto('/en');
    const missing = await page.locator('img:not([alt])').count();
    expect(missing).toBe(0);
  });

  test('the page allows pinch zoom', async ({ page }) => {
    // The legacy site set maximum-scale=1, user-scalable=no.
    await page.goto('/en');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).not.toContain('user-scalable=no');
    expect(viewport).not.toContain('maximum-scale');
  });
});
