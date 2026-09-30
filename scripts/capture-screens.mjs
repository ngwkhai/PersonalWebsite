import { chromium } from '@playwright/test';

/**
 * Photographs the live demos, for build-covers.mjs to turn into covers.
 *
 * A deployed product is better shown than described, and a logo shows neither.
 * These are taken from the real sites rather than from mockups, so re-running
 * this after a redesign is all it takes to keep the covers honest.
 *
 * The viewport is already 3:2, the frame every cover is built at, so a fill
 * loses nothing. 1200 wide rather than a full desktop width because the card
 * shows the picture at 15rem, and a narrower page keeps its type legible
 * there; the 2x scale keeps it sharp at the case study's full width.
 *
 * Bacera is not here: its screenshot predates this script and is kept as is.
 *
 *   node scripts/capture-screens.mjs [name ...]   then   pnpm covers
 */
const VIEWPORT = { width: 1200, height: 800 };

/** Plays a short opening, so the cover shows walls — the game's one idea — rather than an empty board. */
async function detouraOpening(page) {
  await page.getByText('Chơi chung máy').click();
  const move = (row, col) =>
    page.getByRole('button', { name: `Đi tới hàng ${row}, cột ${col}`, exact: true }).click();
  // The orientation buttons toggle, so one is pressed only when its slots are
  // not already showing. The first click on a slot previews the wall, the
  // second commits it.
  const wall = async (dir, row, col) => {
    const slot = page.getByRole('button', {
      name: `Đặt tường ${dir} tại hàng ${row}, cột ${col}`,
      exact: true,
    });
    if ((await slot.count()) === 0) {
      await page
        .getByRole('button', { name: dir === 'ngang' ? 'Ngang' : 'Dọc', exact: true })
        .click();
    }
    await slot.click();
    await slot.click();
  };

  await move(8, 5); // red
  await move(2, 5); // blue
  await wall('ngang', 2, 4); // red blocks blue's straight path
  await wall('ngang', 7, 5); // blue answers in kind
  await move(8, 4); // red goes round
  await wall('dọc', 4, 5); // blue
  await move(7, 4); // red
  await move(2, 6); // blue goes round
  await page.mouse.move(0, 0); // no hover preview in the picture
}

const SHOTS = [
  { name: 'researchmap', url: 'https://researchmap.ngwkhai.com' },
  { name: 'taxmate', url: 'https://taxmate.ngwkhai.com' },
  // Below 1440 this site folds its menu and lays the illustration over the
  // headline, which is its tablet layout rather than the one it was designed at.
  {
    name: 'flowcenter',
    url: 'https://flowcenter.ngwkhai.com',
    viewport: { width: 1440, height: 960 },
  },
  { name: 'detoura', url: 'https://detoura.ngwkhai.com', prepare: detouraOpening },
];

const only = new Set(process.argv.slice(2));
const browser = await chromium.launch();
try {
  for (const shot of SHOTS) {
    if (only.size && !only.has(shot.name)) continue;
    // A fresh context each time: no demo should see another's cookies, and
    // none should see a signed-in session.
    const context = await browser.newContext({
      viewport: shot.viewport ?? VIEWPORT,
      deviceScaleFactor: 2,
      colorScheme: 'light',
      locale: 'vi-VN',
      // Entrance animations settle into their final frame immediately.
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 60_000 });
    if (shot.prepare) await shot.prepare(page);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `assets/screens/${shot.name}.png` });
    await context.close();
    console.log(`assets/screens/${shot.name}.png  ${shot.url}`);
  }
} finally {
  await browser.close();
}
