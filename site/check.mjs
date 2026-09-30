// Post-build checks for _site: page structure, internal links, duplicate ids, and WCAG contrast of the color tokens.
// Usage: node check.mjs   (exits 1 on any failure)
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "_site");
const errors = [];
const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (f.endsWith(".html")) pages.push(f);
  }
})(OUT);

for (const file of pages) {
  const rel = path.relative(OUT, file);
  const html = fs.readFileSync(file, "utf8");
  const fail = (m) => errors.push(`${rel}: ${m}`);
  if (!/<html lang="[a-z]{2}(-[A-Z]{2})?"/.test(html)) fail("missing <html lang>");
  if (!/<title>[^<]+<\/title>/.test(html)) fail("missing <title>");
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail("expected exactly one <h1>");
  if (!html.includes('<main id="main"')) fail("missing <main id=main>");
  if (!/<meta name="viewport"/.test(html)) fail("missing viewport meta");
  for (const m of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) fail(`<img> without alt: ${m[0].slice(0, 60)}`);
  for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) if (!/aria-label=/.test(m[0]) && !m[1].replace(/<[^>]+>/g, "").trim()) fail("button without a name");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);
  if (rel === "404.html") continue; // uses absolute URLs to the deployed site
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:)/.test(href)) continue;
    const [target, hash] = href.split("#");
    let dest = file;
    if (target) {
      dest = path.resolve(path.dirname(file), target);
      if (target.endsWith("/") || target === "./" || (fs.existsSync(dest) && fs.statSync(dest).isDirectory())) dest = path.join(dest, "index.html");
      if (!fs.existsSync(dest)) { fail(`broken link ${href}`); continue; }
    }
    if (hash && dest.endsWith(".html") && !new RegExp(`\\sid="${hash}"`).test(fs.readFileSync(dest, "utf8"))) fail(`missing anchor #${hash}`);
  }
}

// ---- contrast of the tokens in style.css (light block and dark block) ----
const css = fs.readFileSync(path.join(OUT, "style.css"), "utf8");
function tokens(block) {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
const light = tokens(css.match(/:root\s*\{([^}]*)\}/)[1]);
const dark = { ...light, ...tokens(css.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)[1]) };
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const [name, t] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, min] of [["text", "bg", 4.5], ["muted", "bg", 4.5], ["text", "code-bg", 4.5], ["muted", "code-bg", 4.5], ["focus", "bg", 3]]) {
    const r = ratio(t[fg], t[bg]);
    if (r < min) errors.push(`${name} theme: --${fg} on --${bg} is ${r.toFixed(2)}:1 (needs ${min}:1)`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`checked ${pages.length} pages\nall checks passed`);
