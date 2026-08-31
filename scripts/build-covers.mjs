import sharp from 'sharp';

/**
 * Builds every project cover to one frame, from the original artwork.
 *
 * The covers are shown at three ratios — 4:3 and 5:4 on the cards, 3:2 at the
 * head of the case study — and `object-cover` crops whatever does not fit. The
 * artwork itself ranges from 1:1 to 2.1:1, so a cover that simply fills the
 * frame loses a different part of every image: the wide ones were cropped to
 * their middle third on the cards, and the logos were left swimming in
 * padding to survive the widest crop.
 *
 * So each image is fitted inside a safe box that survives all three crops,
 * on a ground taken from the image itself. The safe box is what decides how
 * large the artwork reads; the frame around it exists only to be cropped.
 */
const W = 1600,
  H = 1200;
const SAFE_W = 1480; // 5:4 keeps 1500px of width
const SAFE_H = 1040; // 3:2 keeps 1067px of height

const COVERS = [
  ['legacy/assets/img/project-nlp.png', 'project-nlp'],
  ['legacy/assets/img/project-docker.png', 'project-docker'],
  ['legacy/assets/img/project-qts.png', 'project-qts'],
  ['legacy/assets/img/project-ccfd.png', 'project-ccfd'],
  ['legacy/assets/img/project-tsc.png', 'project-tsc'],
  ['legacy/assets/img/project-yolov1.png', 'project-yolov1'],
  ['legacy/assets/img/project-gpu.png', 'project-gpu'],
  ['assets/logos/detoura.webp', 'project-detoura'],
  ['assets/logos/ai-pipeline-mastery.webp', 'project-apm'],
  ['assets/logos/ai-server.webp', 'project-ai-server'],
];

/** Mean colour and spread of the image's border, sampled at 200×200. */
async function border(src) {
  const { data, info } = await sharp(src)
    .flatten({ background: '#ffffff' })
    .resize(200, 200, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const band = 6;
  const px = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= band && y >= band && x < width - band && y < height - band) continue;
      const i = (y * width + x) * channels;
      px.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const mean = [0, 1, 2].map((c) => px.reduce((sum, p) => sum + p[c], 0) / px.length);
  const spread = Math.max(
    ...[0, 1, 2].map((c) =>
      Math.sqrt(px.reduce((sum, p) => sum + (p[c] - mean[c]) ** 2, 0) / px.length),
    ),
  );
  return {
    colour: { r: Math.round(mean[0]), g: Math.round(mean[1]), b: Math.round(mean[2]) },
    spread,
  };
}

for (const [src, base] of COVERS) {
  const { colour, spread } = await border(src);
  // A flat border (a logo on its own ground) extends as flat colour; a busy
  // one (an illustration running to the edge) extends as a blur of itself.
  const flat = spread < 18;

  const ground = flat
    ? await sharp({ create: { width: W, height: H, channels: 3, background: colour } })
        .png()
        .toBuffer()
    : await sharp(src)
        .resize(W, H, { fit: 'cover' })
        .blur(40)
        .modulate({ brightness: 0.9, saturation: 0.8 })
        .toBuffer();

  const art = await sharp(src)
    .resize(SAFE_W, SAFE_H, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();

  const composed = sharp(ground).composite([{ input: art, gravity: 'centre' }]);
  await composed.clone().avif({ quality: 64, effort: 6 }).toFile(`public/img/${base}.avif`);
  await composed.clone().webp({ quality: 80 }).toFile(`public/img/${base}.webp`);

  const m = await sharp(art).metadata();
  console.log(`${base.padEnd(20)} ${m.width}×${m.height}  ground=${flat ? 'flat' : 'blur'}`);
}
