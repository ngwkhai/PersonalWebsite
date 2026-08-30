/**
 * Checks every foreground/background token pair against WCAG 2.2 AA.
 *
 * The palette is authored in oklch, which is perceptually uniform but says
 * nothing about WCAG contrast — that is defined on sRGB relative luminance.
 * A palette that looks evenly spaced can still fail, so this converts and
 * measures rather than trusting the colour space.
 */

// oklch -> sRGB, via Oklab and linear sRGB (Björn Ottosson's formulation).
function oklchToSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Relative luminance per WCAG, from linear-light sRGB. */
const luminance = ([r, g, b]) => {
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
};

const ratio = (fg, bg) => {
  const a = luminance(oklchToSrgb(...fg));
  const b = luminance(oklchToSrgb(...bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

const THEMES = {
  light: {
    paper: [0.978, 0.004, 300],
    raised: [1, 0, 0],
    sunk: [0.945, 0.007, 300],
    ink: [0.185, 0.028, 305],
    'ink-2': [0.44, 0.022, 300],
    'ink-3': [0.52, 0.016, 300],
    rule: [0.885, 0.008, 300],
    indigo: [0.44, 0.13, 275],
    teal: [0.5, 0.09, 191],
    flare: [0.9, 0.17, 105],
  },
  dark: {
    paper: [0.155, 0.019, 305],
    raised: [0.205, 0.021, 305],
    sunk: [0.125, 0.017, 305],
    ink: [0.945, 0.006, 300],
    'ink-2': [0.73, 0.014, 300],
    'ink-3': [0.6, 0.018, 300],
    rule: [0.29, 0.022, 305],
    indigo: [0.72, 0.11, 275],
    teal: [0.76, 0.1, 191],
    flare: [0.9, 0.17, 105],
  },
};

// Foreground token, background token, minimum ratio, what it is used for.
const CHECKS = [
  ['ink', 'paper', 4.5, 'body text'],
  ['ink', 'sunk', 4.5, 'text on the raised chat bubble'],
  ['ink-2', 'paper', 4.5, 'secondary prose'],
  // .label renders at 11px. WCAG's 3:1 allowance is for large text only,
  // so these mono micro-labels are held to the full 4.5:1.
  ['ink-3', 'paper', 4.5, 'mono micro-labels, 11px'],
  ['ink-3', 'sunk', 4.5, 'mono labels on raised surfaces'],
  ['rule', 'paper', 1.2, 'hairline rules (decorative, informational only)'],
  ['indigo', 'paper', 4.5, 'links and focus ring'],
  ['teal', 'paper', 4.5, 'role lines and section sublabels'],
  // Alternating section bands put every foreground on `sunk` as well. Missing
  // this pair is how a 4.47:1 teal reached production.
  ['teal', 'sunk', 4.5, 'sublabels inside a banded section'],
  ['indigo', 'sunk', 4.5, 'links inside a banded section'],
  ['ink-2', 'sunk', 4.5, 'secondary prose inside a banded section'],
  ['paper', 'ink', 4.5, 'inverted button text'],
];

let failed = 0;
for (const [name, tokens] of Object.entries(THEMES)) {
  console.log(`\n${name}`);
  for (const [fg, bg, min, use] of CHECKS) {
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bg} — ${use}`,
    );
  }
}

console.log(failed === 0 ? '\nAll pairs meet WCAG 2.2 AA.' : `\n${failed} pair(s) below AA.`);
process.exit(failed === 0 ? 0 : 1);
