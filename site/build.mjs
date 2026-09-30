// Builds the one-page site into ../_site from skills/*/SKILL.md, the router table, and site/i18n.
// No dependencies. Usage: node build.mjs   (SITE_URL overrides the canonical base URL)
import fs from "node:fs";
import path from "node:path";

const SITE = import.meta.dirname;
const ROOT = path.resolve(SITE, "..");
const OUT = path.join(ROOT, "_site");
const REPO = "https://github.com/LucSena/how-to-build-software";
const BASE = (process.env.SITE_URL || "https://lucsena.github.io/how-to-build-software/").replace(/\/?$/, "/");
const LANGS = ["en", "pt", "es"];
const CATEGORIES = ["meta", "engineering", "design", "mobile"];
const INSTALL = "npx skills add LucSena/how-to-build-software";

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const strings = JSON.parse(read(path.join(SITE, "i18n/page.json")));
const summaries = JSON.parse(read(path.join(SITE, "i18n/skills.json")));
const version = read(path.join(ROOT, "VERSION")).trim();

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

// ---- data from the skills ----
const skills = fs.readdirSync(path.join(ROOT, "skills")).flatMap((name) => {
  const file = path.join(ROOT, "skills", name, "SKILL.md");
  if (!fs.existsSync(file)) return [];
  const text = read(file);
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  const category = fm.match(/^\s+category:\s*"?([\w-]+)"?/m)?.[1];
  const gotchas = (text.split(/^## Gotchas\s*$/m)[1] || "").split(/^## /m)[0].split("\n").filter((l) => /^- /.test(l)).length;
  const sources = new Set();
  for (const f of [file, ...listRefs(name)]) {
    const part = read(f).split(/^## Sources\s*$/m)[1] || "";
    for (const m of part.matchAll(/https?:\/\/[^\s)>\]`"'|,;]+/g)) sources.add(m[0].replace(/[.:]+$/, ""));
  }
  return [{ name, category, gotchas, sources }];
});
function listRefs(name) {
  const dir = path.join(ROOT, "skills", name, "references");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f)) : [];
}
for (const s of skills) {
  if (!CATEGORIES.includes(s.category)) throw new Error(`${s.name}: unknown category ${s.category}`);
  for (const l of LANGS) if (!summaries[s.name]?.[l]) throw new Error(`site/i18n/skills.json: missing ${l} summary for ${s.name}`);
}
const totalSources = new Set(skills.flatMap((s) => [...s.sources])).size;
const totalGotchas = skills.reduce((a, s) => a + s.gotchas, 0);

const routerTable = read(path.join(ROOT, "skills/how-to-build-software/SKILL.md"));
const routes = new Map();
for (const m of routerTable.matchAll(/^\| (.+?) \| (.+?) \|$/gm)) routes.set(m[1].trim(), [...m[2].matchAll(/`([a-z0-9-]+)`/g)].map((x) => x[1]));

const date = new Date(process.env.SITE_DATE || Date.now());
const dateLabel = (lang) => date.toLocaleDateString(strings[lang].htmlLang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const langPath = (l) => (l === "en" ? "" : `${l}/`);
const skillUrl = (n) => `${REPO}/tree/main/skills/${n}`;

// ---- page ----
function article(lang) {
  const t = strings[lang];
  const v = { n: skills.length, sources: totalSources.toLocaleString(t.htmlLang), gotchas: totalGotchas.toLocaleString(t.htmlLang) };
  const routeItems = t.routes.map(([intent, label]) => {
    const chain = routes.get(intent);
    if (!chain) throw new Error(`router row not found: ${intent}`);
    return `<li><span class="ask">“${esc(label)}”</span> <span class="loads">${esc(t.loads)}</span> ${chain.map((s) => `<a href="${skillUrl(s)}"><code>${s}</code></a>`).join('<span class="sep" aria-hidden="true"> → </span>')}</li>`;
  });
  const mistakes = t.mistakes.map(([skill, title, body]) => `<figure class="mistake"><blockquote><p><strong>${esc(title)}</strong> ${esc(body)}</p></blockquote><figcaption><a href="${skillUrl(skill)}"><code>${skill}</code></a></figcaption></figure>`);
  const lists = CATEGORIES.map((c) => {
    const list = skills.filter((s) => s.category === c).sort((a, b) => a.name.localeCompare(b.name));
    return `<h3 id="${c}">${esc(t.categories[c])} <span class="count">${list.length}</span></h3>
<dl class="skills">${list.map((s) => `<dt><a href="${skillUrl(s.name)}"><code>${s.name}</code></a></dt><dd>${esc(summaries[s.name][lang])}</dd>`).join("\n")}</dl>`;
  });
  const body = `
<h2 id="what">${esc(t.whatTitle)}</h2>
${t.what.map((p) => `<p>${inline(p)}</p>`).join("\n")}
<h2 id="install">${esc(t.installTitle)}</h2>
<p>${esc(t.installIntro)}</p>
<div class="code"><pre tabindex="0"><code id="install-cmd">${INSTALL}</code></pre><button type="button" class="copy" data-copy="install-cmd" data-done="${esc(t.copied)}">${esc(t.copy)}</button></div>
<p>${inline(t.installAfter)}</p>
<h2 id="how">${esc(t.howTitle)}</h2>
<p>${inline(t.how)}</p>
<ul class="routes">${routeItems.join("\n")}</ul>
<h2 id="prevents">${esc(t.mistakesTitle)}</h2>
<p>${fill(esc(t.mistakesIntro), v)}</p>
${mistakes.join("\n")}
<h2 id="skills">${fill(esc(t.skillsTitle), v)}</h2>
${lists.join("\n")}
<h2 id="sources">${esc(t.sourcesTitle)}</h2>
<p>${fill(esc(t.sources), v)}</p>
<p class="links">${t.sourcesLinks.map(([label, file]) => `<a href="${REPO}/blob/main/${file}">${esc(label)}</a>`).join(" · ")}</p>`;
  const words = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 230));
  return layout(lang, {
    title: t.siteTitle,
    description: t.metaDescription,
    pathOut: langPath(lang),
    main: `<article>
<header class="head">
<h1>${esc(t.siteTitle)}</h1>
<p class="dek">${esc(t.dek)}</p>
<p class="byline"><a href="https://github.com/LucSena">LucSena</a> · ${esc(fill(t.updated, { date: dateLabel(lang) }))} · ${esc(fill(t.readTime, { n: minutes }))} · v${esc(version)}</p>
</header>
${body}
</article>`,
  });
}

function layout(lang, { title, description, pathOut, main, depth = pathOut ? 1 : 0, noindex = false }) {
  const t = strings[lang];
  const up = depth ? "../" : "";
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${strings[l].htmlLang}" href="${BASE}${langPath(l)}">`).join("\n");
  const langLinks = LANGS.map((l) => `<a href="${up}${langPath(l) || "./"}" hreflang="${strings[l].htmlLang}" lang="${strings[l].htmlLang}"${l === lang ? ' aria-current="page"' : ""}>${l.toUpperCase()}<span class="sr"> ${esc(strings[l].label)}</span></a>`).join("");
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${BASE}${pathOut}">\n${alternates}\n<link rel="alternate" hreflang="x-default" href="${BASE}">`}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${up}fonts/charis-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${up}fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}style.css">
<script>try{var s=localStorage.getItem("theme");if(s)document.documentElement.dataset.theme=s}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">${esc(t.skip)}</a>
<header class="bar">
<a class="name" href="${up}${langPath(lang) || "./"}">${esc(t.siteTitle)}</a>
<nav class="lang" aria-label="${esc(t.languages)}">${langLinks}</nav>
<button type="button" class="theme" aria-label="${esc(t.theme)}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A5.5 5.5 0 0 1 13.4 3.1 9 9 0 0 0 12 3Z"/></svg></button>
</header>
<main id="main">
${main}
</main>
<footer class="foot">
<p>${esc(t.footer)} <a href="${REPO}">${esc(t.github)}</a></p>
</footer>
<script>
document.querySelector(".theme").addEventListener("click",function(){var r=document.documentElement,d=r.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),n=d==="dark"?"light":"dark";r.dataset.theme=n;try{localStorage.setItem("theme",n)}catch(e){}});
document.querySelectorAll(".copy").forEach(function(b){b.addEventListener("click",function(){var el=document.getElementById(b.dataset.copy),label=b.textContent,done=function(){b.textContent=b.dataset.done;setTimeout(function(){b.textContent=label},1600)};if(navigator.clipboard)navigator.clipboard.writeText(el.textContent).then(done,function(){getSelection().selectAllChildren(el)});else getSelection().selectAllChildren(el)})});
</script>
</body>
</html>
`;
}

function notFound() {
  const t = strings.en;
  return layout("en", {
    title: t.notFoundTitle,
    description: t.notFoundTitle,
    pathOut: "404.html",
    depth: 0,
    noindex: true,
    main: `<article><header class="head"><h1>${esc(t.notFoundTitle)}</h1></header><p>${esc(t.notFound)} <a href="${BASE}">${esc(t.backHome)}</a>.</p></article>`,
  })
    .replace(/<link rel="stylesheet" href="style\.css">/, () => `<style>${read(path.join(SITE, "style.css")).replace(/url\(fonts\//g, `url(${BASE}fonts/`)}</style>`)
    .replace(/<link rel="preload"[^>]+>\n/g, "")
    .replace(/(href|src)="(favicon\.svg)"/g, `$1="${BASE}$2"`);
}

// ---- write ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
for (const l of LANGS) {
  const dir = path.join(OUT, langPath(l));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), article(l));
}
fs.writeFileSync(path.join(OUT, "404.html"), notFound());
fs.copyFileSync(path.join(SITE, "style.css"), path.join(OUT, "style.css"));
fs.copyFileSync(path.join(SITE, "favicon.svg"), path.join(OUT, "favicon.svg"));
for (const f of fs.readdirSync(path.join(SITE, "fonts"))) fs.copyFileSync(path.join(SITE, "fonts", f), path.join(OUT, "fonts", f));
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LANGS.map((l) => `<url><loc>${BASE}${langPath(l)}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`built ${LANGS.length} pages · ${skills.length} skills · ${totalGotchas} gotchas · ${totalSources} sources → _site/`);
