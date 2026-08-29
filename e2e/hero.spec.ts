import { test, expect } from '@playwright/test';

test.describe('the restore signature', () => {
  test('server-renders the correctly spelled name', async ({ request }) => {
    // Crawlers and no-JS readers must never receive the stripped spelling.
    const html = await (await request.get('/en')).text();
    expect(html).toContain('Nguyễn Đình Khải');
    expect(html).not.toContain('Nguyen Dinh Khai</span>');
  });

  test('exposes the accented name to assistive technology', async ({ page }) => {
    await page.goto('/en');
    // textContent would include the aria-hidden per-glyph spans, which have no
    // spaces between words. The accessible name is what actually gets read,
    // and it comes from the sr-only span.
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Nguyễn Đình Khải');
  });

  test('does not animate under prefers-reduced-motion', async ({ page }) => {
    // The project config sets reducedMotion: 'reduce', so the name should be
    // fully restored on the very first frame.
    await page.goto('/en');
    await expect(page.getByText('restored', { exact: true })).toBeVisible();
  });
});
