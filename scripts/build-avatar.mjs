import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

/**
 * Builds the site mark from the portrait.
 *
 * The header logo, the favicon and the touch icon are all the same face, so
 * they all come from one square crop of `1.png` rather than three hand-made
 * files that would drift apart. The crop is the head and shoulders — the full
 * portrait is 4:5 and reads as a smudge at 28px.
 *
 * The favicon is masked to a circle so the tab shows a face, not a face in a
 * box; the Apple touch icon stays square because iOS masks it itself.
 */
const SRC = 'legacy/assets/img/1.png';
const CROP = { left: 199, top: 40, width: 220, height: 220 };

/** Circular alpha mask at `size`, as an SVG buffer. */
const circle = (size) =>
  Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );

await mkdir('public/img', { recursive: true });

const square = sharp(SRC).extract(CROP);

// The header mark is drawn inside a rounded frame by CSS, so it ships square.
await square
  .clone()
  .resize(512, 512)
  .avif({ quality: 70, effort: 6 })
  .toFile('public/img/avatar.avif');
await square.clone().resize(512, 512).webp({ quality: 82 }).toFile('public/img/avatar.webp');

// Next's file conventions: app/icon.png and app/apple-icon.png.
await square
  .clone()
  .resize(256, 256)
  .composite([{ input: circle(256), blend: 'dest-in' }])
  .png()
  .toFile('app/icon.png');

await square
  .clone()
  .resize(180, 180)
  .flatten({ background: '#0e0d14' })
  .png()
  .toFile('app/apple-icon.png');

console.log('avatar: public/img/avatar.{avif,webp}, app/icon.png, app/apple-icon.png');
