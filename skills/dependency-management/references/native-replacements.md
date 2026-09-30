# Native Replacements (as of 2026-09)

Use this file when replacing a package with a Node.js, web platform, Python, or Go built-in, or when checking whether a native API is supported widely enough for your targets. Versions are the first release where the API is usable; confirm against current docs and your minimum runtime before relying on them.

## Contents
1. How to use this list safely
2. Node.js built-ins
3. Web platform (browsers)
4. Micro-utilities: write them, with tests
5. Python standard library
6. Go standard library
7. Automating it

## 1. How to use this list safely

- Check the project's **minimum runtime** (`engines` in `package.json`, `.nvmrc`, `requires-python`, the `go` directive in `go.mod`) and, for browsers, its support targets (browserslist or the project context).
- For web APIs, check **Baseline** status on web.dev or MDN compatibility tables. The e18e project deliberately avoids listing very new native features because they are not widely available yet; do the same unless your targets allow it.
- A native API may cover only the common case. Keep the library when you need what it adds (for example, `axios` interceptors used across the app, or `yargs` for a large CLI with subcommands and help generation).
- Every inlined replacement gets tests for its edge cases.

## 2. Node.js built-ins

| Package | Native replacement | Available since |
|---|---|---|
| `node-fetch`, `cross-fetch`, `axios` (simple calls) | Global `fetch` with `AbortSignal.timeout(ms)` | Node 18 |
| `dotenv` | `node --env-file=.env`; `--env-file-if-exists`; `process.loadEnvFile()` | 20.6; 22.9; 20.12 |
| `rimraf` | `fs.rm(path, { recursive: true, force: true })` | 14.14 |
| `mkdirp`, `make-dir` | `fs.mkdir(path, { recursive: true })` | 10.12 |
| `glob`, `fast-glob`, `globby` | `fs.glob` / `fs.promises.glob` (or the small `tinyglobby`) | 22 |
| `chalk`, `colors`, `kleur` | `util.styleText` | 20 (hex colors from 26.1; RGB not supported) |
| `minimist`, simple `yargs` | `util.parseArgs` | 18.3 / 16.17 |
| `uuid` (v4), `uuidv4` | `crypto.randomUUID()` | Node and browsers |
| `deep-equal` | `util.isDeepStrictEqual` | 9.0 |
| `sqlite3` | `node:sqlite` (`DatabaseSync`), or `better-sqlite3` | 22.13; reported as release-candidate stability in early 2026, not yet "stable" — check the docs' stability index |
| `nodemon` | `node --watch` | stable in current LTS lines |
| `jest`/`mocha` for small libraries | `node:test` + `node:assert` | stable in Node 20 |
| `debug` | `util.debuglog`, or a maintained lightweight fork | — |
| `left-pad`, `object-assign`, `array-includes`, `es6-promise`, `abort-controller`, `globalthis`, `has`, `is-nan`, `xtend`, `inherits` | `padStart`, `Object.assign`, `includes`, `Promise`, `AbortController`, `globalThis`, `Object.hasOwn`, `Number.isNaN`, object spread, `class extends` | Widely available |
| `lodash` | Native array/object methods (`structuredClone`, `Object.groupBy`, `findLast`, `toSorted`, `at`, `flat`, `Set` methods), or a modern tree-shakeable utility library such as `es-toolkit` | Varies — see section 3 |
| `moment` | `Intl.DateTimeFormat`/`RelativeTimeFormat`, `Temporal` where available, or `date-fns`/`dayjs`/`luxon` | See section 3 |
| `depcheck` | `knip` (more actively maintained; unused files, exports, and dependencies) | — |

## 3. Web platform (browsers)

**Widely available** (safe for most targets): `fetch`, `AbortController`, `structuredClone`, `crypto.randomUUID`, `URL`/`URLSearchParams`, `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`, `Intl.PluralRules`, `Intl.ListFormat`, `Intl.Segmenter`, `Array.prototype.at`/`flat`/`findLast`, `Object.hasOwn`, `String.prototype.padStart`/`replaceAll`.

**Newer — check Baseline against your targets:**
- `Object.groupBy` / `Map.groupBy`, `toSorted`/`toReversed`/`with`, and the `Set` composition methods (`union`, `intersection`, `difference`).
- `URLPattern`: Baseline newly available since 2025-09 (Chrome, Firefox 142, Safari 26), so older Safari versions still in use lack it.
- `Temporal`: reached TC39 stage 4 in 2026 and shipped in Firefox and Chrome/Edge (Chrome 144, 2026-01) and unflagged in Node 26, but was not in stable Safari as of the sources checked. Feature-detect or use the polyfill when Safari matters; re-check at time of use.

Native `Date` remains error-prone for time-zone arithmetic; until `Temporal` covers your targets, a small date library is a reasonable dependency.

## 4. Micro-utilities: write them, with tests

These replace packages that routinely appear in dependency trees. Each needs the edge-case tests listed.

| Need | Code | Test these |
|---|---|---|
| Is odd | `Number.isInteger(n) && n % 2 !== 0` | `-3` (e18e's `(n % 2) === 1` returns false), `0`, `1.5`, `NaN` |
| Pad | `String(s).padStart(width, "0")` | Longer-than-width input, empty string |
| Unique | `[...new Set(items)]` | Objects compare by reference — dedupe by key with a `Map` if needed |
| Chunk | `for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n))` | `n <= 0` (guard it), empty array, remainder chunk |
| Range | `Array.from({ length: n }, (_, i) => start + i)` | `n = 0`, negative `n` |
| Clamp | `Math.min(Math.max(x, lo), hi)` | `lo > hi`, `NaN` |
| Sleep | `import { setTimeout as sleep } from "node:timers/promises"` or `new Promise(r => setTimeout(r, ms))` | Cancellation if needed (`AbortSignal`) |
| Pick | `Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]))` | Missing keys, inherited properties |
| Group by | `Object.groupBy(items, fn)` where supported; otherwise a `reduce` into a `Map` | Empty input, `null` keys |
| Deep clone | `structuredClone(value)` | Throws on functions; class instances lose their prototype |
| Debounce | ~10 lines with `setTimeout`/`clearTimeout` | Borrow a library if you need leading/trailing/max-wait options |

If you copy a snippet from a permissively licensed package instead of writing it, keep the license notice with it.

## 5. Python standard library

Reach for these before a package: `pathlib`, `dataclasses`, `enum`, `zoneinfo` (3.9+), `tomllib` (3.11+, read-only), `graphlib`, `statistics`, `functools.cache`, `itertools.batched` (3.12+), `asyncio.TaskGroup` (3.11+), `sqlite3`, `json`, `csv`, `argparse`, `logging`, `secrets`, `hashlib`, `uuid`, `http.HTTPStatus`, `urllib.parse`, `concurrent.futures`.

Dependencies that usually still earn their place: `httpx` or `requests` (HTTP ergonomics, timeouts, retries), `pydantic` (validation at boundaries), `pytest`. Replace `pytz` with `zoneinfo`, and `toml` (for reading) with `tomllib`.

## 6. Go standard library

Go culture is stdlib-first ("a little copying is better than a little dependency"). Before adding a module, check: `net/http` (method and path-pattern routing since 1.22 covers many router needs), `log/slog` (structured logging, 1.21+), `slices` and `maps` (1.21+), `errors.Join`, `context`, `encoding/json`, `embed`, `testing` (with table tests and fuzzing), `crypto/*`, `database/sql`.

## 7. Automating it

- The e18e `module-replacements` project maintains manifests of native and micro-utility replacements for npm packages, with documentation per package.
- ESLint plugins built on those manifests (`eslint-plugin-depend`, `@e18e/eslint-plugin`) flag replaceable imports in CI.
- Run `knip` periodically to find dependencies nothing imports.
- Node.js publishes codemods for some migrations (for example from `axios` to `fetch`); prefer a codemod over hand edits across many files.

## Sources

- e18e `module-replacements` (manifests and docs, including `dotenv`, `chalk`, `glob`, `rimraf`, `mkdirp`, `parseargs`, `sqlite3`, `fetch`, `depcheck`, micro-utilities): https://github.com/es-tooling/module-replacements
- Node.js API docs: https://nodejs.org/api/
- web.dev, "URLPattern is now Baseline Newly available": https://web.dev/blog/baseline-urlpattern · Baseline: https://web.dev/baseline
- Temporal status reports: https://socket.dev/blog/temporal-api-ships-in-chrome-144-major-shift-for-javascript-date-handling · https://bryntum.com/blog/javascript-temporal-is-it-finally-here/
- Python standard library docs: https://docs.python.org/3/library/
- Go release notes (1.21, 1.22) and Go Proverbs: https://go.dev/doc/devel/release · https://go-proverbs.github.io
- Liran Tal, npm security best practices §14 (minimal dependencies): https://github.com/lirantal/npm-security-best-practices
