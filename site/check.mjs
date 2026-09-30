// Post-build checks for _site: internal links and anchors, page structure, and color contrast of the tokens.
// Usage: node check.mjs   (exits 1 on any failure)
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "_site");
const errors = [];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

const pages = [...walk(OUT)];
const idsByFile = new Map();
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  idsByFile.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

for (const file of pages) {
  const rel = path.relative(OUT, file);
  const html = fs.readFileSync(file, "utf8");
  const fail = (msg) => errors.push(`${rel}: ${msg}`);

  if (!/<html lang="[a-z]{2}(-[A-Z]{2})?"/.test(html)) fail("missing <html lang>");
  if (!/<title>[^<]+<\/title>/.test(html)) fail("missing <title>");
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(`expected exactly one <h1>, found ${h1s}`);
  if (!html.includes('<main id="main"')) fail("missing <main id=main>");
  for (const m of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) fail(`<img> without alt: ${m[0].slice(0, 80)}`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);

  if (rel === "404.html") continue; // uses absolute URLs to the deployed site
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:)/.test(href)) continue;
    const [target, hash] = href.split("#");
    let dest = file;
    if (target) {
      dest = path.resolve(path.dirname(file), target);
      if (target.endsWith("/") || fs.existsSync(dest) && fs.statSync(dest).isDirectory()) dest = path.join(dest, "index.html");
      if (!fs.existsSync(dest)) {
        fail(`broken link ${href}`);
        continue;
      }
    }
    if (hash && dest.endsWith(".html") && !idsByFile.get(dest)?.has(hash)) fail(`missing anchor #${hash} in ${href || "(same page)"}`);
  }
}

// ---- contrast of design tokens (WCAG 2.x relative luminance) ----

function oklchToLinearSrgb(l, c, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ].map((v) => Math.min(1, Math.max(0, v)));
}

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const ratio = (x, y) => {
  const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (a + 0.05) / (b + 0.05);
};

const css = fs.readFileSync(path.join(OUT, "assets/styles.css"), "utf8");
function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g)) {
    out[m[1]] = oklchToLinearSrgb(+m[2], +m[3], +m[4]);
  }
  return out;
}
const light = tokens(css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)")));
const dark = tokens(css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf("@media (min-width: 720px)")));

const pairs = [
  ["ink", "paper", 4.5], ["ink-2", "paper", 4.5], ["ink-3", "paper", 4.5], ["pencil-ink", "paper", 4.5],
  ["ink", "card", 4.5], ["ink-2", "card", 4.5], ["ink-3", "card", 4.5], ["pencil-ink", "card", 4.5],
  ["ink-2", "paper-2", 4.5], ["pencil", "paper", 3], ["line", "paper", 1.2],
];
const report = [];
for (const [name, theme] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, min] of pairs) {
    if (!theme[fg] || !theme[bg]) {
      errors.push(`contrast: token --${fg} or --${bg} missing in ${name} theme`);
      continue;
    }
    const r = ratio(theme[fg], theme[bg]);
    report.push(`${name.padEnd(5)} ${`--${fg}`.padEnd(13)} on ${`--${bg}`.padEnd(10)} ${r.toFixed(2)}:1 (min ${min})`);
    if (r < min) errors.push(`contrast: ${name} --${fg} on --${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
  }
}

console.log(report.join("\n"));
console.log(`\nchecked ${pages.length} pages`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.slice(0, 200).join("\n"));
  process.exit(1);
}
console.log("all checks passed");
