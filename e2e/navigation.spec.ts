import { test, expect } from '@playwright/test';
import { education, profile } from '../content/cv';

test.describe('navigation', () => {
  test('redirects the bare root to a locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(en|vi)$/);
  });

  test('reaches every homepage section from the pinned nav', async ({ page }) => {
    await page.goto('/en');
    for (const id of [
      'skills',
      'work',
      'achievements',
      'experience',
      'writing',
      'resume',
      'contact',
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test('keeps the header pinned while scrolling', async ({ page }) => {
    await page.goto('/en');
    const header = page.locator('header').first();
    const before = await header.boundingBox();
    // mouse.wheel is unsupported in mobile WebKit; scrollTo works everywhere.
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(400);
    const after = await header.boundingBox();
    expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
  });

  test('switches locale without leaving the page', async ({ page }) => {
    await page.goto('/en/work');
    await page.getByRole('button', { name: 'VI', exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/work$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('opens a case study and shows its headline metric', async ({ page }) => {
    await page.goto('/en/work/neural-machine-translation');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Neural Machine Translation');
    // The figure appears twice: the metric strip and the ablation table.
    await expect(page.getByRole('definition').filter({ hasText: '81.31' })).toBeVisible();
  });

  test('serves the résumé as real text, not only a PDF', async ({ page }) => {
    await page.goto('/en/resume');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(profile.nameVi);
    // Asserted from the source of truth so a reformat cannot silently drift it.
    await expect(page.getByText(education[0]!.detail[0]!.en)).toBeVisible();
  });

  test('404s an unknown path', async ({ page }) => {
    const response = await page.goto('/en/work/does-not-exist');
    expect(response?.status()).toBe(404);
  });
});
