// Builds the static site into ../_site from skills/*/SKILL.md, their references, and site/i18n.
// Usage: node build.mjs            (SITE_URL overrides the canonical base URL)
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";

const SITE_DIR = import.meta.dirname;
const ROOT = path.resolve(SITE_DIR, "..");
const OUT = path.join(ROOT, "_site");
const REPO = "https://github.com/LucSena/how-to-build-software";
const BASE_URL = (process.env.SITE_URL || "https://lucsena.github.io/how-to-build-software/").replace(/\/?$/, "/");
const LANGS = ["en", "pt", "es"];
const CATEGORY_ORDER = ["meta", "engineering", "design", "mobile"];
// Self-hosted fonts (OFL), copied from pinned @fontsource packages at build time.
const FONT_FILES = [
  ["@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-normal.woff2", "source-serif-4-opsz.woff2"],
  ["@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-italic.woff2", "source-serif-4-opsz-italic.woff2"],
  ["@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", "ibm-plex-sans-400.woff2"],
  ["@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", "ibm-plex-sans-500.woff2"],
  ["@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", "ibm-plex-sans-600.woff2"],
  ["@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", "ibm-plex-mono-400.woff2"],
  ["@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", "ibm-plex-mono-500.woff2"],
];

const ui = JSON.parse(fs.readFileSync(path.join(SITE_DIR, "i18n/ui.json"), "utf8"));
const skillI18n = readJson(path.join(SITE_DIR, "i18n/skills.json"), {});
const version = fs.readFileSync(path.join(ROOT, "VERSION"), "utf8").trim();

// ---------- helpers ----------

function readJson(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const langPrefix = (lang) => (lang === "en" ? "" : `${lang}/`);

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function parseFrontmatter(text) {
  const end = text.indexOf("\n---", 4);
  const raw = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\s*\n/, "");
  const data = {};
  let map = null;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const indented = /^\s/.test(line);
    const idx = line.indexOf(":");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (indented && map) map[key] = value;
    else if (value === "") data[key] = map = {};
    else {
      data[key] = value;
      map = null;
    }
  }
  return { data, body };
}

function summaryOf(description) {
  let text = description.replace(/^Use when\s+/, "");
  const cut = text.search(/\.\s/);
  if (cut !== -1) text = text.slice(0, cut);
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/\.$/, "");
}

// ---------- sources ----------

const URL_RE = /https?:\/\/[^\s<>()\]`"'|]+/g;

function normalizeUrl(url) {
  return url.replace(/[.,;:!?*_]+$/, "").replace(/#.*$/, "").replace(/\/$/, "");
}

function extractSources(markdown) {
  const found = [];
  const match = markdown.match(/^##\s+Sources\b[\s\S]*?(?=^##\s|(?![\s\S]))/m);
  if (!match) return found;
  const section = match[0];
  const seen = new Set();
  for (const m of section.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const url = normalizeUrl(m[2]);
    if (!seen.has(url)) found.push({ url, label: m[1].replace(/[`*_]/g, "").replace(URL_RE, "").trim() || "" }), seen.add(url);
  }
  for (const line of section.split("\n")) {
    for (const raw of line.match(URL_RE) || []) {
      const url = normalizeUrl(raw);
      if (seen.has(url)) continue;
      seen.add(url);
      const before = line
        .slice(0, line.indexOf(raw))
        .replace(URL_RE, "")
        .replace(/^[\s>*-]+/, "")
        .replace(/[\s:;,·—–\-(|]+$/, "");
      const label = before.replace(/[`*_[\]]/g, "").replace(/\s+/g, " ").trim();
      found.push({ url, label: label.length > 3 && label.length < 160 ? label : "" });
    }
  }
  return found;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "other";
  }
}

function labelFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() || "";
    const pretty = decodeURIComponent(last).replace(/\.(html?|md|pdf)$/i, "").replace(/[-_]+/g, " ").trim();
    return pretty ? `${pretty}` : u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ---------- load skills ----------

function loadSkills() {
  const dir = path.join(ROOT, "skills");
  const skills = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, name, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontmatter(text);
    const meta = data.metadata || {};
    const refDir = path.join(dir, name, "references");
    const refs = fs.existsSync(refDir)
      ? fs
          .readdirSync(refDir)
          .filter((f) => f.endsWith(".md"))
          .sort()
          .map((f) => {
            const md = fs.readFileSync(path.join(refDir, f), "utf8");
            const title = (md.match(/^#\s+(.+)$/m) || [])[1] || f;
            return { file: f, title: title.replace(/[`*]/g, "").trim(), md };
          })
      : [];
    const sources = [];
    const seen = new Set();
    for (const src of [text, ...refs.map((r) => r.md)].flatMap(extractSources)) {
      if (!seen.has(src.url)) seen.add(src.url), sources.push(src);
    }
    const titleMatch = body.match(/^#\s+(.+)$/m);
    skills.push({
      name,
      title: titleMatch ? titleMatch[1].trim() : name,
      description: data.description || "",
      summary: summaryOf(data.description || ""),
      category: meta.category || "engineering",
      version: meta.version || "1.0.0",
      related: (meta.related || "").split(/\s+/).filter(Boolean),
      body,
      refs: refs.map(({ file, title }) => ({ file, title })),
      sources,
      words: text.split(/\s+/).length + refs.reduce((n, r) => n + r.md.split(/\s+/).length, 0),
    });
  }
  skills.sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      (a.name === "how-to-build-software" ? -1 : b.name === "how-to-build-software" ? 1 : a.name.localeCompare(b.name)),
  );
  return skills;
}

const skills = loadSkills();
const skillNames = new Set(skills.map((s) => s.name));
const byName = Object.fromEntries(skills.map((s) => [s.name, s]));

const bibliography = new Map();
for (const s of skills) {
  for (const src of s.sources) {
    const entry = bibliography.get(src.url) || { url: src.url, label: "", skills: new Set() };
    if (!entry.label && src.label) entry.label = src.label;
    entry.skills.add(s.name);
    bibliography.set(src.url, entry);
  }
}
const stats = {
  skills: skills.length,
  refs: skills.reduce((n, s) => n + s.refs.length, 0),
  sources: bibliography.size,
};

const summaryIn = (skill, lang) => skillI18n[skill.name]?.[lang] || skillI18n[skill.name]?.en || skill.summary;

// ---------- markdown ----------

function renderSkillBody(skill, lang) {
  const t = ui[lang];
  const marked = new Marked({ gfm: true });
  const used = new Map();
  let lastHeading = skill.title;
  let tableCount = 0;
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        lastHeading = html.replace(/<[^>]+>/g, "");
        let id = slugify(html) || "section";
        const n = used.get(id) || 0;
        used.set(id, n + 1);
        if (n) id += `-${n}`;
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${depth}>\n`;
      },
      table(token) {
        const html = marked.Renderer.prototype.table.call(this, token);
        tableCount += 1;
        return `<div class="table-wrap" role="region" tabindex="0" aria-label="${esc(lastHeading)} (${tableCount})">${html}</div>`;
      },
    },
  });
  const withoutTitle = skill.body.replace(/^#\s+.+\n+/, "");
  let html = marked.parse(withoutTitle);
  skill.toc = [...html.matchAll(/<h2 id="([^"]+)"><a[^>]*>#<\/a>(.*?)<\/h2>/g)].map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") }));
  html = html
    .replace(/<input (?:checked="" )?disabled="" type="checkbox"(?: checked="")?>\s?/g, '<span class="task-box" aria-hidden="true"></span>')
    .replace(/<pre>/g, '<pre tabindex="0">');
  html = html.replace(/href="(?!https?:|#|mailto:)([^"]+)"/g, (m, rel) => {
    const clean = rel.replace(/^\.\//, "");
    return `href="${REPO}/blob/main/skills/${skill.name}/${clean}"`;
  });
  html = html.replace(/<code>((?:references|assets|scripts)\/[\w./-]+)<\/code>/g, (m, rel) =>
    fs.existsSync(path.join(ROOT, "skills", skill.name, rel))
      ? `<a class="file-ref" href="${REPO}/blob/main/skills/${skill.name}/${rel}"><code>${rel}</code></a>`
      : m,
  );
  html = html.replace(/<code>([a-z0-9]+(?:-[a-z0-9]+)+)<\/code>/g, (m, name) =>
    skillNames.has(name) && name !== skill.name ? `<a class="skill-ref" href="../${name}/"><code>${name}</code></a>` : m,
  );
  return html;
}

// ---------- pencil marks (hand-drawn SVG) ----------

const PENCIL = {
  circle:
    '<svg class="pencil pencil--circle" viewBox="0 0 220 70" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M20 38C12 20 60 7 116 6c58-1 96 9 98 27 2 20-44 31-104 32C52 66 8 56 9 37 10 22 40 12 78 9"/></svg>',
  underline:
    '<svg class="pencil pencil--underline" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M3 9c26-4 55-6 86-4 30 2 58 3 108-3"/></svg>',
  arrow:
    '<svg class="pencil pencil--arrow" viewBox="0 0 90 60" aria-hidden="true" focusable="false"><path pathLength="1" d="M86 52C62 50 30 38 12 12"/><path pathLength="1" d="M8 26c1-6 2-11 4-15 5 1 10 3 15 5"/></svg>',
};

const markup = (text) =>
  text.replace(/\{mark\}(.*?)\{\/mark\}/g, `<span class="pencil-mark">$1${PENCIL.circle}</span>`);

// ---------- layout ----------

function layout({ lang, pagePath, depth, title, description, body, bodyClass = "" }) {
  const t = ui[lang];
  const root = "../".repeat(depth);
  const here = (l) => `${root}${langPrefix(l)}${pagePath}`;
  const canonical = `${BASE_URL}${langPrefix(lang)}${pagePath}`;
  const alternates = LANGS.map(
    (l) => `<link rel="alternate" hreflang="${ui[l].htmlLang}" href="${BASE_URL}${langPrefix(l)}${pagePath}">`,
  ).join("\n    ");
  const home = `${root}${langPrefix(lang)}`;
  const langLinks = LANGS.map(
    (l) =>
      `<a href="${here(l)}" hreflang="${ui[l].htmlLang}" lang="${ui[l].htmlLang}"${l === lang ? ' aria-current="true"' : ""}>${l.toUpperCase()}<span class="visually-hidden"> — ${ui[l].langName}</span></a>`,
  ).join("");
  const suggestTargets = LANGS.filter((l) => l !== lang)
    .map((l) => `data-suggest-${l}="${here(l)}" data-suggest-${l}-text="${esc(ui[l].suggest.text)}" data-suggest-${l}-link="${esc(ui[l].suggest.link)}" data-suggest-${l}-dismiss="${esc(ui[l].suggest.dismiss)}"`)
    .join(" ");
  return `<!doctype html>
<html lang="${t.htmlLang}" data-lang="${lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#e9f0df" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#172019" media="(prefers-color-scheme: dark)">
    <link rel="canonical" href="${canonical}">
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}${pagePath}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="How to Build Software">
    <meta property="og:locale" content="${t.htmlLang.replace("-", "_")}">
    <meta name="twitter:card" content="summary">
    <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
    <link rel="preload" href="${root}assets/fonts/source-serif-4-opsz.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="${root}assets/styles.css">
    <script>try{var t=localStorage.getItem("hbs-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
    <script src="${root}assets/app.js" defer></script>
  </head>
  <body class="${bodyClass}" ${suggestTargets}>
    <a class="skip-link" href="#main">${esc(t.skipLink)}</a>
    <header class="masthead">
      <div class="masthead__inner">
        <a class="brand" href="${home}"><svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 25 25 6m-4 0h4v4M9 27H5v-4" /></svg><span>How to Build Software</span></a>
        <nav class="nav" aria-label="Main">
          <a href="${home}#skills">${esc(t.nav.skills)}</a>
          <a href="${home}#how">${esc(t.nav.how)}</a>
          <a href="${home}#failures">${esc(t.nav.failures)}</a>
          <a href="${home}#install">${esc(t.nav.install)}</a>
          <a href="${root}${langPrefix(lang)}sources/">${esc(t.nav.sources)}</a>
        </nav>
        <div class="masthead__tools">
          <nav class="lang-switch" aria-label="${esc(t.langLabel)}">${langLinks}</nav>
          <button class="theme-toggle" type="button" aria-label="${esc(t.themeToggle)}" title="${esc(t.themeToggle)}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
          </button>
        </div>
      </div>
    </header>
    <main id="main" tabindex="-1">
${body}
    </main>
    <footer class="footer">
      <div class="footer__inner">
        <p class="footer__license">${esc(t.footer.license)} <span class="footer__version">v${esc(version)}</span></p>
        <p>${esc(t.footer.built)}</p>
        <p class="footer__links"><a href="${REPO}">${esc(t.footer.repo)}</a> · <a href="${REPO}/blob/main/CREDITS.md">${esc(t.footer.credits)}</a> · <a href="${root}${langPrefix(lang)}sources/">${esc(t.nav.sources)}</a></p>
      </div>
    </footer>
  </body>
</html>
`;
}

// ---------- components ----------

function skillCard(skill, lang, root) {
  const t = ui[lang];
  const summary = summaryIn(skill, lang);
  const haystack = [skill.name, skill.summary, summary, skill.description, t.categories[skill.category]].join(" ").toLowerCase();
  return `<li class="card" data-category="${skill.category}" data-search="${esc(haystack)}">
          <a class="card__link" href="${root}${langPrefix(lang)}skills/${skill.name}/">
            <span class="card__head"><code class="card__name">${skill.name}</code><span class="card__cat">${esc(t.categories[skill.category])}</span></span>
            <span class="card__body">${esc(summary)}.</span>
            <span class="card__foot">v${esc(skill.version)}${skill.refs.length ? ` · ${esc(fill(t.skills.refs, { n: skill.refs.length }))}` : ""}<span class="visually-hidden">. ${esc(fill(t.skills.open, { name: skill.name }))}</span></span>
          </a>
        </li>`;
}

function installBlock(lang, idPrefix = "hero") {
  const t = ui[lang];
  return `<div class="install">
          <span class="install__label" id="${idPrefix}-install-label">${esc(t.hero.installLabel)}</span>
          <div class="install__row">
            <code class="install__cmd" aria-labelledby="${idPrefix}-install-label">npx skills add LucSena/how-to-build-software</code>
            <button class="copy" type="button" data-copy="npx skills add LucSena/how-to-build-software" data-copied="${esc(t.hero.copied)}">${esc(t.hero.copy)}</button>
          </div>
        </div>`;
}

function flowDiagram(lang) {
  const d = ui[lang].how.diagram;
  const arrow = `<svg class="flow__arrow" viewBox="0 0 48 20" aria-hidden="true" focusable="false"><path d="M2 11c12-2 26-2 40-1M34 4l9 6-9 6"/></svg>`;
  return `<figure class="flow" aria-labelledby="flow-title">
          <figcaption id="flow-title" class="visually-hidden">${esc(d.title)}</figcaption>
          <ol class="flow__steps">
            <li class="flow__box flow__box--plain"><span>${esc(d.request)}</span></li>
            <li class="flow__sep" aria-hidden="true">${arrow}</li>
            <li class="flow__box"><span>${esc(d.router)}</span><code>how-to-build-software</code><span class="flow__aside">+ ${esc(d.context)} <code>project-context</code></span></li>
            <li class="flow__sep" aria-hidden="true">${arrow}</li>
            <li class="flow__box flow__box--stack"><span>${esc(d.skillA)}</span><code>system-design</code><code>data-modeling</code><code>auth-flows</code><span class="flow__aside">${esc(d.refs)}</span></li>
            <li class="flow__sep" aria-hidden="true">${arrow}</li>
            <li class="flow__box"><span>${esc(d.gates)}</span><code>code-review</code><code>design-review</code></li>
            <li class="flow__sep" aria-hidden="true">${arrow}</li>
            <li class="flow__box flow__box--done"><span>${esc(d.done)}</span></li>
          </ol>
        </figure>`;
}

const skillLinkHtml = (name, lang, root) => `<a class="skill-ref" href="${root}${langPrefix(lang)}skills/${name}/"><code>${name}</code></a>`;

// ---------- pages ----------

function homePage(lang) {
  const t = ui[lang];
  const depth = lang === "en" ? 0 : 1;
  const root = "../".repeat(depth);
  const vars = { skills: stats.skills, refs: stats.refs, sources: stats.sources.toLocaleString(t.htmlLang) };
  const link = (n) => skillLinkHtml(n, lang, root);
  const cats = CATEGORY_ORDER.filter((c) => skills.some((s) => s.category === c));
  const groups = cats
    .map((cat) => {
      const members = skills.filter((s) => s.category === cat);
      return `<section class="shelf" data-shelf="${cat}" aria-labelledby="shelf-${cat}">
          <h3 class="shelf__title" id="shelf-${cat}">${esc(t.categories[cat])} <span class="shelf__count">${members.length}</span></h3>
          <ul class="cards" role="list">
        ${members.map((s) => skillCard(s, lang, root)).join("\n        ")}
          </ul>
        </section>`;
    })
    .join("\n");
  const steps = t.how.steps
    .map(
      (s) =>
        `<li>${fill(esc(s), {
          router: link("how-to-build-software"),
          context: link("project-context"),
          codeReview: link("code-review"),
          designReview: link("design-review"),
        })}</li>`,
    )
    .join("\n            ");
  const cases = t.failures.cases
    .map(
      (c) => `<li class="case">
            <p class="case__name"><strong>${esc(c.name)}</strong> <span>${esc(c.year)}</span></p>
            <p class="case__what"><span class="visually-hidden">${esc(t.failures.whatLabel)}: </span>${esc(c.what)}</p>
            <p class="case__rule"><span class="case__rule-label">${esc(t.failures.ruleLabel)}</span> <span class="pencil-line">${esc(c.rule)}</span></p>
          </li>`,
    )
    .join("\n          ");
  const beliefs = t.beliefs.items.map((b) => `<li><strong>${esc(b.title)}</strong> ${esc(b.body)}</li>`).join("\n            ");
  const shoulders = [
    ["anthropics/skills", "https://github.com/anthropics/skills"],
    ["taste-skill", "https://github.com/Leonxlnx/taste-skill"],
    ["impeccable", "https://github.com/pbakaus/impeccable"],
    ["ui-skills", "https://github.com/ibelick/ui-skills"],
    ["marketingskills", "https://github.com/coreyhaines31/marketingskills"],
    ["hyperframes", "https://github.com/heygen-com/hyperframes"],
    ["Laws of UX", "https://lawsofux.com"],
    ["Nielsen Norman Group", "https://www.nngroup.com"],
    ["How Complex Systems Fail", "https://how.complexsystems.fail"],
    ["OWASP Cheat Sheets", "https://cheatsheetseries.owasp.org"],
    ["The Copenhagen Book", "https://github.com/pilcrowonpaper/copenhagen"],
    ["Google SRE", "https://sre.google/books/"],
  ]
    .map(([n, u]) => `<a href="${u}">${esc(n)}</a>`)
    .join(", ");

  const body = `
      <div class="sheet">
        <section class="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" class="hero__title">${markup(esc(t.hero.title).replace(/\{mark\}|\{\/mark\}/g, (m) => m))}</h1>
          <aside class="margin-note margin-note--hero"><p>${esc(t.hero.note)}</p>${PENCIL.arrow}</aside>
          <p class="hero__lead">${esc(fill(t.hero.lead, vars))}</p>
          ${installBlock(lang)}
          <p class="hero__browse"><a href="#skills">${esc(t.hero.browse)}</a></p>
        </section>

        <section class="section story" id="story" aria-labelledby="story-title">
          <h2 id="story-title">${esc(t.story.title)}</h2>
          <div class="prose">
            <p class="story__opening">${esc(t.story.p1)}</p>
            <p>${esc(t.story.p2)}</p>
            <p>${esc(t.story.p3)}</p>
            <p class="story__sign">${esc(t.story.signature)}</p>
            <p class="story__stats">${esc(fill(t.story.stats, vars))}</p>
          </div>
          <aside class="margin-note"><p>${esc(t.story.note)}</p></aside>
        </section>

        <section class="section how" id="how" aria-labelledby="how-title">
          <h2 id="how-title">${esc(t.how.title)}</h2>
          <p class="section__intro">${esc(t.how.intro)}</p>
          ${flowDiagram(lang)}
          <ol class="steps">
            ${steps}
          </ol>
          <aside class="margin-note"><p>${esc(t.how.note)}</p></aside>
        </section>

        <section class="section skills" id="skills" aria-labelledby="skills-title">
          <h2 id="skills-title">${esc(t.skills.title)}</h2>
          <p class="section__intro">${esc(t.skills.intro)}</p>
          <div class="filters" data-filters hidden>
            <div class="chips" role="group" aria-label="${esc(t.skills.searchLabel)}">
              <button type="button" class="chip" data-filter="all" aria-pressed="true">${esc(t.skills.all)}</button>
              ${cats.map((c) => `<button type="button" class="chip" data-filter="${c}" aria-pressed="false">${esc(t.categories[c])}</button>`).join("\n              ")}
            </div>
            <label class="search">
              <span class="visually-hidden">${esc(t.skills.searchLabel)}</span>
              <input type="search" data-search-input placeholder="${esc(t.skills.searchPlaceholder)}" autocomplete="off" spellcheck="false">
            </label>
          </div>
          <p class="filters__status" role="status" data-count-template="${esc(t.skills.count)}" data-empty="${esc(t.skills.empty)}">${esc(fill(t.skills.count, { n: stats.skills }))}</p>
          ${groups}
        </section>

        <section class="section failures" id="failures" aria-labelledby="failures-title">
          <h2 id="failures-title">${esc(t.failures.title)}</h2>
          <p class="section__intro">${fill(esc(t.failures.intro), { skill: link("lessons-from-failures") })}</p>
          <ol class="cases" role="list">
          ${cases}
          </ol>
        </section>

        <section class="section beliefs" id="beliefs" aria-labelledby="beliefs-title">
          <h2 id="beliefs-title">${esc(t.beliefs.title)}</h2>
          <ul class="beliefs__list" role="list">
            ${beliefs}
          </ul>
        </section>

        <section class="section install-section" id="install" aria-labelledby="install-title">
          <h2 id="install-title">${esc(t.install.title)}</h2>
          <p class="section__intro">${esc(t.install.intro)}</p>
          <div class="tabs" data-tabs>
            <div class="tabs__list" role="tablist" aria-label="${esc(t.install.title)}">
              <button type="button" role="tab" id="tab-npx" aria-controls="panel-npx" aria-selected="true">${esc(t.install.tabs.npx)}</button>
              <button type="button" role="tab" id="tab-claude" aria-controls="panel-claude" aria-selected="false" tabindex="-1">${esc(t.install.tabs.claude)}</button>
              <button type="button" role="tab" id="tab-manual" aria-controls="panel-manual" aria-selected="false" tabindex="-1">${esc(t.install.tabs.manual)}</button>
            </div>
            <div class="tabs__panel" role="tabpanel" id="panel-npx" aria-labelledby="tab-npx" tabindex="0">
              <pre><code>npx skills add LucSena/how-to-build-software
npx skills add LucSena/how-to-build-software --skill system-design --skill auth-flows
npx skills add LucSena/how-to-build-software -a claude-code</code></pre>
              <p>${esc(t.install.npxNote)}</p>
            </div>
            <div class="tabs__panel" role="tabpanel" id="panel-claude" aria-labelledby="tab-claude" tabindex="0" hidden>
              <pre><code>/plugin marketplace add LucSena/how-to-build-software
/plugin install how-to-build-software@how-to-build-software
/plugin install engineering-skills@how-to-build-software
/plugin install design-skills@how-to-build-software
/plugin install mobile-skills@how-to-build-software</code></pre>
              <p>${esc(t.install.claudeNote)}</p>
            </div>
            <div class="tabs__panel" role="tabpanel" id="panel-manual" aria-labelledby="tab-manual" tabindex="0" hidden>
              <pre><code>git clone https://github.com/LucSena/how-to-build-software
cp -r how-to-build-software/skills/* ~/.claude/skills/   # Claude Code
cp -r how-to-build-software/skills/* .agents/skills/     # most other agents</code></pre>
              <p>${esc(t.install.manualNote)}</p>
            </div>
          </div>
        </section>

        <section class="section sources-teaser" id="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">${esc(t.sources.title)}</h2>
          <p class="section__intro">${esc(fill(t.sources.intro, vars))}</p>
          <p class="shoulders"><span>${esc(t.sources.shoulders)}:</span> ${shoulders}.</p>
          <p><a class="button" href="sources/">${esc(t.sources.cta)}</a></p>
        </section>
      </div>`;
  write(`${langPrefix(lang)}index.html`, layout({ lang, pagePath: "", depth, title: `${t.siteTitle} — ${stripTags(t.hero.title)}`, description: t.metaDescription, body, bodyClass: "page-home" }));
}

const stripTags = (s) => s.replace(/\{\/?mark\}/g, "").replace(/<[^>]+>/g, "");

function skillPage(skill, lang) {
  const t = ui[lang];
  const depth = (lang === "en" ? 0 : 1) + 2;
  const root = "../".repeat(depth);
  const summary = summaryIn(skill, lang);
  const bodyHtml = renderSkillBody(skill, lang);
  const related = skill.related.filter((r) => byName[r]);
  const refs = skill.refs
    .map((r) => `<li><a href="${REPO}/blob/main/skills/${skill.name}/references/${r.file}"><code>${r.file}</code></a> <span>${esc(r.title)}</span></li>`)
    .join("\n              ");
  const sources = skill.sources
    .map((s) => `<li><a href="${esc(s.url)}">${esc(s.label || labelFromUrl(s.url))}</a> <span class="host">${esc(hostOf(s.url))}</span></li>`)
    .join("\n              ");
  const body = `
      <div class="sheet sheet--skill">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}${langPrefix(lang)}#skills">${esc(t.skillPage.back)}</a></nav>
        <header class="skill-head">
          <p class="skill-head__meta"><span class="tag">${esc(t.categories[skill.category])}</span> <span>${esc(fill(t.skillPage.version, { v: skill.version }))}</span></p>
          <h1><code>${skill.name}</code><span class="skill-head__title">${esc(skill.title)}</span></h1>
          <div class="skill-head__when">
            <h2>${esc(t.skillPage.whenToUse)}</h2>
            <p class="lead">${esc(summary)}.</p>
          </div>
          ${related.length ? `<div class="skill-head__related"><h2>${esc(t.skillPage.related)}</h2><ul role="list">${related.map((r) => `<li>${skillLinkHtml(r, lang, root)}</li>`).join("")}</ul></div>` : ""}
          <p><a class="button button--quiet" href="${REPO}/blob/main/skills/${skill.name}/SKILL.md">${esc(t.skillPage.readOnGithub)}</a></p>
        </header>
        ${t.skillPage.englishNote ? `<p class="lang-note">${esc(t.skillPage.englishNote)}</p>` : ""}
        <div class="skill-layout">
          <article class="prose prose--skill" lang="en" aria-labelledby="skill-body-title">
            <h2 id="skill-body-title" class="visually-hidden">${esc(t.skillPage.skillHeading)}</h2>
${bodyHtml}
          </article>
          <nav class="toc" aria-label="${esc(t.skillPage.onThisPage)}">
            <p class="toc__title">${esc(t.skillPage.onThisPage)}</p>
            <ol role="list" lang="en">${skill.toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol>
          </nav>
        </div>
        ${skill.refs.length ? `<section class="skill-refs" aria-labelledby="refs-title"><h2 id="refs-title">${esc(t.skillPage.references)}</h2><p class="muted">${esc(t.skillPage.referencesNote)}</p><ul role="list">
              ${refs}
            </ul></section>` : ""}
        ${skill.sources.length ? `<section class="skill-sources" aria-labelledby="src-title"><h2 id="src-title">${esc(t.skillPage.sourcesTitle)} <span class="shelf__count">${skill.sources.length}</span></h2><ul role="list" class="source-list" lang="en">
              ${sources}
            </ul></section>` : ""}
      </div>`;
  write(
    `${langPrefix(lang)}skills/${skill.name}/index.html`,
    layout({ lang, pagePath: `skills/${skill.name}/`, depth, title: `${skill.name} — ${t.siteTitle}`, description: `${summary}.`, body, bodyClass: "page-skill" }),
  );
}

function sourcesPage(lang) {
  const t = ui[lang];
  const depth = (lang === "en" ? 0 : 1) + 1;
  const root = "../".repeat(depth);
  const groups = new Map();
  for (const entry of bibliography.values()) {
    const host = hostOf(entry.url);
    if (!groups.has(host)) groups.set(host, []);
    groups.get(host).push(entry);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const html = ordered
    .map(
      ([host, entries]) => `<section class="src-group" data-src-group>
          <h2 class="src-group__host">${esc(host)} <span class="shelf__count">${entries.length}</span></h2>
          <ul role="list" class="source-list" lang="en">
            ${entries
              .sort((a, b) => (a.label || a.url).localeCompare(b.label || b.url))
              .map(
                (e) => `<li data-search="${esc([host, e.label, e.url, ...e.skills].join(" ").toLowerCase())}"><a href="${esc(e.url)}">${esc(e.label || labelFromUrl(e.url))}</a>
              <span class="cited"><span class="visually-hidden">${esc(t.sources.citedBy)}: </span>${[...e.skills].map((n) => skillLinkHtml(n, lang, root)).join(" ")}</span></li>`,
              )
              .join("\n            ")}
          </ul>
        </section>`,
    )
    .join("\n        ");
  const body = `
      <div class="sheet sheet--sources">
        <header class="page-head">
          <h1>${esc(t.sources.pageTitle)}</h1>
          <p class="lead">${esc(fill(t.sources.pageIntro, { skills: stats.skills }))}</p>
          <p class="muted">${esc(fill(t.story.stats, { skills: stats.skills, refs: stats.refs, sources: stats.sources.toLocaleString(t.htmlLang) }))} <a href="${REPO}/blob/main/CREDITS.md">${esc(t.sources.credits)}</a>.</p>
          <label class="search search--wide" data-filters hidden>
            <span class="visually-hidden">${esc(t.sources.filterLabel)}</span>
            <input type="search" data-source-search placeholder="${esc(t.sources.filterPlaceholder)}" autocomplete="off" spellcheck="false">
          </label>
        </header>
        ${html}
      </div>`;
  write(
    `${langPrefix(lang)}sources/index.html`,
    layout({ lang, pagePath: "sources/", depth, title: `${t.sources.pageTitle} — ${t.siteTitle}`, description: fill(t.sources.pageIntro, { skills: stats.skills }), body, bodyClass: "page-sources" }),
  );
}

function notFoundPage() {
  const t = ui.en;
  const body = `
      <div class="sheet sheet--narrow">
        <h1>${esc(t.notFound.title)}</h1>
        <p class="lead">${esc(t.notFound.body)}</p>
        <p><a class="button" href="${BASE_URL}">${esc(t.notFound.home)}</a></p>
      </div>`;
  // 404 is served from any path, so it links with absolute URLs.
  const html = layout({ lang: "en", pagePath: "", depth: 0, title: `${t.notFound.title} — ${t.siteTitle}`, description: t.notFound.body, body })
    .replaceAll('href="assets/', `href="${BASE_URL}assets/`)
    .replaceAll('src="assets/', `src="${BASE_URL}assets/`)
    .replaceAll('href="#', `href="${BASE_URL}#`)
    .replaceAll('href="pt/', `href="${BASE_URL}pt/`)
    .replaceAll('href="es/', `href="${BASE_URL}es/`)
    .replaceAll('href="sources/', `href="${BASE_URL}sources/`);
  write("404.html", html);
}

// ---------- run ----------

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(SITE_DIR, "assets"), path.join(OUT, "assets"), { recursive: true });
fs.mkdirSync(path.join(OUT, "assets/fonts"), { recursive: true });
for (const [from, to] of FONT_FILES) fs.copyFileSync(path.join(SITE_DIR, "node_modules", from), path.join(OUT, "assets/fonts", to));
for (const lang of LANGS) {
  homePage(lang);
  sourcesPage(lang);
  for (const skill of skills) skillPage(skill, lang);
}
notFoundPage();
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
fs.writeFileSync(
  path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LANGS.flatMap((l) =>
    ["", "sources/", ...skills.map((s) => `skills/${s.name}/`)].map((p) => `  <url><loc>${BASE_URL}${langPrefix(l)}${p}</loc></url>`),
  ).join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}sitemap.xml\n`);

const missing = LANGS.flatMap((l) => skills.filter((s) => !skillI18n[s.name]?.[l]).map((s) => `${l}:${s.name}`));
console.log(`built ${skills.length} skills × ${LANGS.length} languages · ${stats.refs} reference files · ${stats.sources} sources → _site/`);
if (missing.length) console.log(`untranslated summaries (fall back to English): ${missing.join(", ")}`);
