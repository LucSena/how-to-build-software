// Progressive enhancement only: every page works without this file.
(() => {
  const doc = document.documentElement;
  doc.classList.add("js");

  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* storage unavailable: preference lasts this page only */ }
    },
  };

  // Theme: follows the system until the reader picks one.
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    const current = () =>
      doc.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const sync = () => toggle.setAttribute("aria-pressed", String(current() === "dark"));
    sync();
    toggle.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      doc.dataset.theme = next;
      store.set("hbs-theme", next);
      sync();
    });
  }

  // Copy buttons.
  for (const button of document.querySelectorAll("[data-copy]")) {
    const label = button.textContent;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = button.dataset.copied;
        button.dataset.state = "copied";
        setTimeout(() => {
          button.textContent = label;
          delete button.dataset.state;
        }, 1800);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(button.previousElementSibling);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  // Pencil marks draw once when they scroll into view.
  const drawables = document.querySelectorAll(".hero, .case");
  for (const el of drawables) el.setAttribute("data-draw", "");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-drawn");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.35 },
    );
    for (const el of drawables) io.observe(el);
  } else {
    for (const el of drawables) el.classList.add("is-drawn");
  }

  // Skill filters: category chips + free text.
  const filters = document.querySelector(".filters[data-filters]");
  if (filters) {
    filters.hidden = false;
    const chips = [...filters.querySelectorAll(".chip")];
    const input = filters.querySelector("[data-search-input]");
    const status = document.querySelector(".filters__status");
    const cards = [...document.querySelectorAll(".card")];
    const shelves = [...document.querySelectorAll(".shelf")];
    let category = "all";
    const normalize = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
    const apply = () => {
      const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const card of cards) {
        const text = normalize(card.dataset.search);
        const match =
          (category === "all" || card.dataset.category === category) && terms.every((t) => text.includes(t));
        card.hidden = !match;
        if (match) shown++;
      }
      for (const shelf of shelves) shelf.hidden = !shelf.querySelector(".card:not([hidden])");
      status.textContent = shown ? status.dataset.countTemplate.replace("{n}", shown) : status.dataset.empty;
    };
    for (const chip of chips) {
      chip.addEventListener("click", () => {
        category = chip.dataset.filter;
        for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
        apply();
      });
    }
    input.addEventListener("input", apply);
  }

  // Sources page filter.
  const sourceSearch = document.querySelector("[data-source-search]");
  if (sourceSearch) {
    sourceSearch.closest("[data-filters]").hidden = false;
    const items = [...document.querySelectorAll(".src-group li")];
    const groups = [...document.querySelectorAll("[data-src-group]")];
    sourceSearch.addEventListener("input", () => {
      const q = sourceSearch.value.trim().toLowerCase();
      for (const li of items) li.hidden = q && !li.dataset.search.includes(q);
      for (const g of groups) g.hidden = !g.querySelector("li:not([hidden])");
    });
  }

  // Install tabs (WAI-ARIA tabs pattern, manual activation with arrow keys).
  for (const tabs of document.querySelectorAll("[data-tabs]")) {
    const list = [...tabs.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      for (const t of list) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      }
      tab.focus();
    };
    list.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select(list[(next + list.length) % list.length]);
      });
    });
  }

  // Skill index: mark the section currently being read.
  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const a of tocLinks) a.removeAttribute("aria-current");
          byId.get(entry.target.id)?.setAttribute("aria-current", "true");
        }
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const id of byId.keys()) {
      const heading = document.getElementById(id);
      if (heading) spy.observe(heading);
    }
  }

  // Gentle language suggestion — never an automatic redirect.
  const body = document.body;
  const pageLang = doc.dataset.lang;
  const preferred = (navigator.languages || [navigator.language]).map((l) => l.slice(0, 2).toLowerCase());
  const target = preferred.find((l) => ["en", "pt", "es"].includes(l));
  if (target && target !== pageLang && body.dataset[`suggest${target[0].toUpperCase()}${target.slice(1)}`] && !store.get("hbs-suggest-dismissed")) {
    const key = (suffix) => body.dataset[`suggest${target[0].toUpperCase()}${target.slice(1)}${suffix}`];
    const box = document.createElement("aside");
    box.className = "suggest";
    box.lang = target === "pt" ? "pt-BR" : target;
    box.setAttribute("aria-label", key("Text"));
    box.innerHTML = `<p>${key("Text")} <a href="${key("")}">${key("Link")}</a></p><button type="button">${key("Dismiss")}</button>`;
    box.querySelector("button").addEventListener("click", () => {
      store.set("hbs-suggest-dismissed", "1");
      box.remove();
    });
    body.append(box);
  }
})();
