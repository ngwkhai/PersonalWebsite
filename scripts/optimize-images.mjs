import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'legacy/assets/img';
const OUT = 'public/img';
// Everything the new site actually references. The rest of legacy/assets/img
// (project-ppw, DVT_9671, home-perfil, vnu-logo) is unused and stays behind.
const KEEP = new Set([
  '1.png', 'logo-web.png', 'vnu-university-logo.png', 'uet-ai-logo.png', 'nlp-lab-logo.jpg',
  'project-nlp.png', 'project-docker.png', 'project-qts.png', 'project-ccfd.png',
  'project-tsc.png', 'project-yolov1.png', 'project-gpu.png',
]);
// Covers get capped at 1600px wide; portraits and logos keep their scale.
const WIDTHS = { cover: 1600, portrait: 1000, logo: 600 };

await mkdir(OUT, { recursive: true });
let before = 0, after = 0;

for (const file of await readdir(SRC)) {
  if (!KEEP.has(file)) continue;
  const src = join(SRC, file);
  before += (await stat(src)).size;

  const base = file.replace(/\.(png|jpe?g)$/i, '');
  const kind = file.startsWith('project-') ? 'cover' : /logo/.test(file) ? 'logo' : 'portrait';
  const pipeline = sharp(src).resize({ width: WIDTHS[kind], withoutEnlargement: true });

  const dest = join(OUT, `${base}.avif`);
  await pipeline.clone().avif({ quality: 62, effort: 6 }).toFile(dest);
  after += (await stat(dest)).size;

  // WebP fallback for the OG-image renderer, which does not decode AVIF.
  await pipeline.clone().webp({ quality: 80 }).toFile(join(OUT, `${base}.webp`));
}

const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`AVIF: ${mb(before)} MB -> ${mb(after)} MB (${((1 - after / before) * 100).toFixed(1)}% smaller)`);
