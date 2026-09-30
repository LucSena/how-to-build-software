# Formatting numbers, dates, and units

Wrong formatting makes correct data look wrong. Format at the edge (render time) in the user's locale, store canonical values.

## Contents
- Principles
- Numbers and currency
- Percentages and deltas
- Dates, times, and time zones
- Durations and relative time
- Units, ranges, lists, plurals
- Nulls, zero, and errors
- Sorting and parsing
- Platform equivalents

---

## Principles

- **Store canonical, display local.** Money in minor units (integer cents) or decimal types, never floats; timestamps in UTC (ISO 8601); display in the user's locale and time zone.
- **Locale from the user's preference**, then `navigator.languages` / `Accept-Language`; never infer language from IP.
- **One format per column, one precision per context.** Mixed precision reads as inconsistency or error.
- **Create formatters once.** Constructing `Intl` formatters is comparatively expensive; cache them per locale and options, not per cell.

## Numbers and currency

```js
const nf = new Intl.NumberFormat(locale);                                 // 1,234,567.891 → "1,234,567.891"
const int = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });  // counts
const fixed2 = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
const usdWhole = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
const acct = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", currencySign: "accounting" }); // (1,234.00) for negatives in some locales
```

| Context | Format |
|---|---|
| Table cells | Full precision appropriate to the field; same decimals per column; right-aligned, tabular numerals |
| KPI tiles and chart axes | Compact notation ("12.3K", "4.5M"); exact value on hover or in the detail |
| Money | Currency style from the currency code (symbol placement varies by locale); 0 or 2 decimals per context, not mixed |
| Multi-currency tables | Show the currency code when mixed; never sum across currencies without conversion and a label |
| Very large or small scientific values | `notation: "scientific"` or engineering, only for technical audiences |

Never format numbers with string concatenation or `toFixed` alone (no grouping, wrong decimal separator for many locales).

## Percentages and deltas

```js
const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
const delta = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
pct.format(0.153);    // "15.3%"
delta.format(-0.042); // "-4.2%"
```

- Distinguish **percent change** ("+12%") from **percentage-point change** ("+2.1 pp" when conversion goes 10.0% → 12.1%). Label pp explicitly.
- Always show the sign on deltas; pair with an arrow icon and color; say what is compared ("vs. last month").
- Suppress or annotate percent changes from tiny bases (1 → 4 is "+300%"); show absolute change instead.
- Round consistently; make sure rounded parts that should sum to 100% are labeled as rounded.

## Dates, times, and time zones

```js
const d = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });                    // "Oct 8, 2026" / "8 Oct 2026"
const dt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: userTz });
const withZone = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZoneName: "short", timeZone: userTz });
const range = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
range.formatRange(start, end);                                                           // "Oct 1 – 7"
```

- Tables: one absolute format per column; relative time ("3 h ago") only where recency is the point, with the absolute timestamp in a tooltip or `<time datetime>` attribute.
- Show the time zone whenever users in different zones share data or when "day" boundaries matter (reports, SLAs, schedules).
- Date-bucketed reports state the zone used for buckets ("Days in Europe/Berlin").
- Avoid ambiguous numeric dates (03/04/2026) in shared or international contexts; prefer month names or ISO (2026-04-03) for technical users.
- Date pickers and inputs follow the locale's first day of week and date order.

## Durations and relative time

```js
const rel = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
rel.format(-1, "day");     // "yesterday"
rel.format(3, "hour");     // "in 3 hours"
```

- Pick the unit from the magnitude (seconds < 1 min, minutes < 1 h, hours < 1 day, then days); update live values at a sensible cadence (every minute, not every second) to avoid distraction and re-renders.
- Durations as "2 h 15 min" or "1:02:45" for media; `Intl.DurationFormat` is newly Baseline (check your support targets) and a small helper works everywhere.
- Latency and technical durations in ms with a fixed unit per column ("Duration (ms)").

## Units, ranges, lists, plurals

- Unit style: `new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", unitDisplay: "short" })` → "12 MB". Use a non-breaking space between number and unit when composing manually.
- Bytes: pick one convention (decimal kB/MB/GB or binary KiB/MiB/GiB) and use it consistently.
- Ranges: `formatRange` on number and date formatters ("€10–20", "Oct 1 – 7").
- Lists: `Intl.ListFormat` ("Anna, Ben, and Chloé" / localized conjunctions).
- Plurals: `Intl.PluralRules` or ICU messages ("1 file", "2 files"; some languages have more plural forms).

## Nulls, zero, and errors

| Value | Display |
|---|---|
| 0 | "0" (or "€0.00"), a real value |
| Null / not applicable | "—" with an accessible label ("Not applicable") |
| Unknown / not yet computed | "Pending" or a skeleton cell |
| Failed to load | Error icon with tooltip and Retry at the region level |
| Redacted (permissions) | "Hidden" with an explanation |

Never render `NaN`, `undefined`, `null`, `Infinity`, or `[object Object]`; treat them as bugs and guard at the formatter.

## Sorting and parsing

- Sort strings with `Intl.Collator(locale, { numeric: true, sensitivity: "base" })` so "Item 2" precedes "Item 10" and accents sort naturally.
- Sort numbers and dates by their raw values, never by formatted strings.
- Parsing user-entered numbers is locale-dependent ("1.234,5" vs "1,234.5"); use a locale-aware parser or constrain the input, and echo back how the value was understood.

## Platform equivalents

- **iOS/Swift**: `FormatStyle` APIs (`.currency(code:)`, `.percent`, `Date.FormatStyle`, `.relative(presentation:)`), `Measurement` for units.
- **Android/Kotlin**: `NumberFormat`, `DecimalFormat`, `java.time.format.DateTimeFormatter` with `ofLocalizedDate`, `android.icu` classes for plurals and relative time.
- **Python**: Babel (`format_currency`, `format_decimal`, `format_datetime`).
- **SQL/BI**: format in the presentation layer, not in queries, so sorting and locale stay correct.

## Sources

- MDN, `Intl.NumberFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- MDN, `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- MDN, `Intl.RelativeTimeFormat`, `Intl.ListFormat`, `Intl.PluralRules`, `Intl.Collator`, `Intl.DurationFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- Vercel Web Interface Guidelines (locale-aware formats, consistent currency decimals, units with non-breaking space): https://github.com/vercel-labs/web-interface-guidelines
- Unicode CLDR (locale data behind Intl): https://cldr.unicode.org/
