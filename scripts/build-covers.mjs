import sharp from 'sharp';

/**
 * Builds every project cover, in the two shapes the site actually shows.
 *
 * There used to be three frames — 4:3 and 5:4 on the cards, 3:2 at the head of
 * the case study — so one file was cropped three different ways and had to be
 * padded until it survived all of them. That padding was the empty space
 * around the artwork. The cards are now 3:2 at every width, which is the same
 * frame the case study head already used, so those three collapse into one and
 * nothing is cropped twice. The chat chip is the only other shape: a 48px
 * square.
 *
 * The artwork itself ranges from 1:1 to 2.11:1, so no single frame fits all of
 * it. Each cover therefore declares how it wants to meet the frame:
 *
 *   fill  the artwork survives losing its edges, so it is cropped to fill the
 *         frame exactly and there is no empty space at all.
 *   fit   the artwork is a badge, a framed logo or a full-width diagram —
 *         cropping it is what would ruin it. It sits whole on a ground
 *         extended from its own edge.
 *
 * `focus` says which edge a fill must keep when the crop is deep enough to
 * matter: the title of a banner is not usually in its middle.
 */
const LEAD = { w: 1600, h: 1067 }; // 3:2 — cards and the case study head
const CHIP = { w: 512, h: 512 }; // 1:1 — the chip in the chat transcript

/** [source, output base, how it meets the frame, which edge a crop keeps] */
const COVERS = [
  // Fills. The number is the source ratio against the frame's 1.50.
  ['legacy/assets/img/project-gpu.png', 'project-gpu', 'fill'], // 1.50 — exact
  ['legacy/assets/img/project-qts.png', 'project-qts', 'fill'], // 1.57 — 5%
  ['legacy/assets/img/project-ccfd.png', 'project-ccfd', 'fill', 'east'], // 2.11 — keeps the title
  ['legacy/assets/img/project-docker.png', 'project-docker', 'fill'], // 1:1, but only margin is lost

  // Fits. Cropping these is what would destroy them.
  ['legacy/assets/img/project-nlp.png', 'project-nlp', 'fit'], // stacked mark over its name
  ['legacy/assets/img/project-tsc.png', 'project-tsc', 'fit'], // its title spans the full width

  ['legacy/assets/img/project-yolov1.png', 'project-yolov1', 'fit'], // the diagram IS the full width
  ['assets/logos/detoura.webp', 'project-detoura', 'fit'], // logo inside its own frame
  ['assets/logos/ai-pipeline-mastery.webp', 'project-apm', 'fit'], // centred mark
  ['assets/logos/ai-server.webp', 'project-ai-server', 'fit'], // circular badge — a crop cuts the ring
];

/** Mean colour and spread of the image's border, sampled at 200×200. */
async function border(src) {
  const { data, info } = await sharp(src)
    .flatten({ background: '#ffffff' })
    // 'fill', not 'cover': a cover crop of a 2:1 image samples the middle of
    // the artwork as if it were the border, which is how a diagram on white
    // ended up sitting on a grey ground.
    .resize(200, 200, { fit: 'fill' })
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

/**
 * The ground a `fit` cover sits on. A flat border (a logo on its own colour)
 * extends as that colour and the join is invisible; a busy one extends as a
 * darkened blur of itself, which reads as a deliberate bleed rather than a
 * band of nothing.
 */
async function ground(src, { w, h }) {
  const { colour, spread } = await border(src);
  if (spread < 18) {
    return sharp({ create: { width: w, height: h, channels: 3, background: colour } })
      .png()
      .toBuffer();
  }
  return sharp(src)
    .resize(w, h, { fit: 'cover' })
    .blur(40)
    .modulate({ brightness: 0.9, saturation: 0.8 })
    .toBuffer();
}

/** One cover at one frame, as a composed sharp pipeline. */
async function frame(src, how, focus, { w, h }) {
  if (how === 'fill') {
    return sharp(src).resize(w, h, { fit: 'cover', position: focus ?? 'centre' });
  }
  // 94% rather than 100%, so the artwork has air around it instead of butting
  // against the frame's edge.
  const art = await sharp(src)
    .resize(Math.round(w * 0.94), Math.round(h * 0.94), { fit: 'inside' })
    .toBuffer();
  return sharp(await ground(src, { w, h })).composite([{ input: art, gravity: 'centre' }]);
}

for (const [src, base, how, focus] of COVERS) {
  // A square is always a fill: the chip's frame is the artwork's own shape.
  for (const [suffix, size, mode] of [
    ['', LEAD, how],
    ['-square', CHIP, 'fill'],
  ]) {
    const pipeline = await frame(src, mode, focus, size);
    await pipeline
      .clone()
      .avif({ quality: 64, effort: 6 })
      .toFile(`public/img/${base}${suffix}.avif`);
    await pipeline.clone().webp({ quality: 80 }).toFile(`public/img/${base}${suffix}.webp`);
  }

  const m = await sharp(src).metadata();
  const ratio3x2 = LEAD.w / LEAD.h;
  const source = m.width / m.height;
  const loss =
    how === 'fit'
      ? 'nothing'
      : source >= ratio3x2
        ? `${Math.round((1 - ratio3x2 / source) * 100)}% of width`
        : `${Math.round((1 - source / ratio3x2) * 100)}% of height`;
  console.log(
    `${base.padEnd(20)} ${source.toFixed(2).padStart(5)}  ${how.padEnd(4)} cropped: ${loss}`,
  );
}
