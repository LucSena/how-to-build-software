# Internationalization and RTL (layout and formatting layer)

The presentation side of i18n: direction, logical properties, text expansion, scripts, and locale formatting. Message catalogs, routing, and locale negotiation plumbing belong to `frontend-architecture`.

## Contents
- Direction
- Logical properties map
- What to mirror
- Text expansion and truncation
- Scripts and typography
- Formatting with Intl
- Strings
- Testing
- Rules

## Direction

- Set `lang` and `dir` on `<html>` from the active locale: `<html lang="ar" dir="rtl">`.
- User-generated content of unknown direction: `dir="auto"` on the element (or `<bdi>` for inline fragments such as usernames inside a sentence).
- Mixed-language passages: `lang` on the element (WCAG 3.1.2) so screen readers and hyphenation use the right rules.
- Style exceptions with `:dir(rtl)` (Baseline) rather than `[dir=rtl]` attribute selectors, which miss inherited direction.
- Flexbox, grid, and inline flow already follow `direction`; most bugs come from physical properties and transforms.

## Logical properties map

| Physical | Logical |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-top` / `padding-bottom` | `padding-block-start` / `padding-block-end` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `width` / `height` | `inline-size` / `block-size` |
| `text-align: left` | `text-align: start` |
| `float: left` | `float: inline-start` |
| `border-left` | `border-inline-start` |
| `border-top-left-radius` | `border-start-start-radius` |
| `translateX(8px)` | no logical equivalent: multiply by a direction variable |

```css
:root { --dir: 1; }
:root:dir(rtl) { --dir: -1; }
.slide-in { translate: calc(16px * var(--dir)) 0; }
```

Tailwind v4 has logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `rounded-s-*`); prefer them over `ml-*`/`mr-*`/`left-*`.

## What to mirror

| Mirror | Do not mirror |
|---|---|
| Back/forward arrows, chevrons in navigation | Logos and brand marks |
| Progress direction, sliders, steppers | Media controls (play, fast-forward refer to tape direction) |
| Icons showing text direction (indent, list bullets) | Clocks, circular refresh arrows |
| Layout of sidebars, breadcrumbs, tab order | Checkmarks, most object icons (search, settings) |
| Swipe directions ("swipe to go back") | Numbers and phone numbers (stay LTR inside RTL text) |
| Horizontal animations and transitions | Charts' time axes are locale-dependent: follow the product's convention and test with users |

## Text expansion and truncation

- Budget **30–40% growth** for languages such as German, Finnish, and Russian relative to English; very short strings (buttons, labels) can grow 100–300%.
- No fixed-width buttons, tabs, or nav items; let them size to content and wrap or scroll gracefully.
- Truncate with `text-overflow: ellipsis` only where the full text is available elsewhere (tooltip, detail view); use `min-width: 0` on flex/grid children so truncation works.
- Prefer `overflow-wrap: anywhere` / `hyphens: auto` (with correct `lang`) for long compound words.
- Test layouts with pseudo-localization (accented, expanded strings like `[Ŝéţţîñĝš ~~~~]`) before real translations arrive.

## Scripts and typography

- **CJK**: larger line-height (~1.7–1.8), no letter-spacing, no italics (use weight or color for emphasis); `word-break: auto-phrase` (Chromium, Japanese) as enhancement; ensure a CJK-capable fallback in the font stack.
- **Arabic, Hebrew, Persian**: fonts with correct shaping; slightly larger size for the same apparent x-height; never apply letter-spacing to Arabic (it breaks joining).
- **Thai, Devanagari, and other complex scripts**: taller ascenders/descenders need more line-height; avoid clipping containers.
- Subset fonts per script with `unicode-range` so users download only what they read.
- Uppercase transforms are language-sensitive (Turkish dotted İ, German ß); with correct `lang`, `text-transform` handles most cases, but avoid all-caps UI in scripts without case.

## Formatting with Intl

Never hand-format numbers, currencies, dates, or lists.

```js
const locale = navigator.languages?.[0] ?? "en";
new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(1234.5);   // "1.234,50 €" in de-DE
new Intl.NumberFormat(locale, { notation: "compact" }).format(1_250_000);            // "1.3M" / "125万"
new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day");           // "yesterday"
new Intl.ListFormat(locale, { type: "conjunction" }).format(["A", "B", "C"]);         // "A, B, and C"
new Intl.PluralRules(locale).select(count);                                          // "one" | "few" | "many" | "other"…
```

- Locale from language preferences (`Accept-Language` on the server, `navigator.languages` on the client, or an explicit user setting), never from IP geolocation.
- Keep currency separate from locale (a German user may pay in USD).
- Time zones: store UTC, display in the user's zone, and label ambiguous times.
- Render dates identically on server and client (pass the locale and time zone explicitly) to avoid hydration mismatches.
- `font-variant-numeric: tabular-nums` for columns of numbers in every locale.

## Strings

- Whole messages with placeholders and ICU plural/select syntax: `"{count, plural, one {# file} other {# files}}"`. Never concatenate `"You have " + n + " files"`.
- Word order differs by language: placeholders must be movable, including links inside sentences (use rich-text placeholders, not split strings).
- No text baked into images or icons.
- `translate="no"` on brand names, code, and identifiers so automatic page translation leaves them alone.
- Keyboard shortcuts: match `event.key`, show platform-specific modifier symbols, and allow remapping for non-QWERTY layouts.

## Testing

- [ ] Force `dir="rtl"` on `<html>` and walk every screen: alignment, icons, carets, transitions, sliders.
- [ ] Pseudo-localize: no clipped or overlapping text; buttons grow.
- [ ] Switch locales for numbers/dates/currency; check server and client render the same string.
- [ ] Long German compounds and long names (100+ characters) in narrow containers.
- [ ] Emoji and combining characters in inputs and truncation.
- [ ] Screen reader pronounces mixed-language parts correctly (`lang` set).

## Rules

### Use logical properties in all new CSS
**Rule.** Write `inline`/`block` properties and `start`/`end` values by default.
**Apply when.** Any new stylesheet or component, even if RTL is not on the roadmap.
**Do / Avoid.** Do `padding-inline: 1rem; text-align: start`. Avoid `padding-left: 1rem; text-align: left`.
**Why.** Logical properties cost nothing in LTR and make RTL a configuration change instead of a rewrite (cost of change).

### Format through Intl, not string templates
**Rule.** Every number, currency, date, relative time, and list shown to users goes through `Intl`.
**Apply when.** Displaying any locale-sensitive value.
**Do / Avoid.** Do `Intl.NumberFormat(locale, {style: "currency", currency})`. Avoid `` `$${price.toFixed(2)}` ``.
**Why.** Separators, symbol placement, plural categories, and calendars vary by locale; hand formatting is wrong for most of the world (Postel's law: be conservative in what you send).

## Sources

- Vercel Web Interface Guidelines (content and locale rules): https://github.com/vercel-labs/web-interface-guidelines
- MDN, CSS logical properties and values: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values
- MDN, Intl: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- W3C Internationalization, Structural markup and right-to-left text: https://www.w3.org/International/questions/qa-html-dir
- Material Design, Bidirectionality (mirroring guidance): https://m2.material.io/design/usability/bidirectionality.html
- Tailwind CSS v4.3 release (logical utilities): https://tailwindcss.com/blog
- impeccable `harden` reference (text expansion, edge-case inputs): https://github.com/pbakaus/impeccable
