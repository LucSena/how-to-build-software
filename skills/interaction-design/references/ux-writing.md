# UX writing

Interface text is part of the interaction: it names actions, predicts outcomes, and explains what went wrong. Write it while designing, not after.

## Contents
- Core rules
- Patterns by component
- Word choices
- Numbers, dates, and units
- Writing for translation
- Self-audit

---

## Core rules

### Name actions by their outcome
**Rule.** Buttons and links say what will happen, verb first, in ≤ ~3 words.
**Apply when.** Every button, menu item, and primary link.
**Do / Avoid.** Do: "Create invoice", "Send invite", "Pay $42.00", "Save changes". Avoid: "Submit", "OK", "Continue" (when something specific happens), "Click here".
**Why.** Users predict the outcome from the label (match between system and real world); specific labels also serve screen-reader users navigating by controls.

### Keep one verb per action across the flow
**Rule.** The same action uses the same verb on the trigger, in progress, and on completion.
**Apply when.** Any multi-surface action (button → loading → toast → audit log).
**Do / Avoid.** Do: "Publish" → "Publishing…" → "Published". Avoid: "Publish" button → "Post is live!" toast → "Released" in history.
**Why.** Consistency and standards: users map words to outcomes; a new word implies a different thing happened.

### Use the user's vocabulary
**Rule.** Name things the way users talk about them, never by implementation.
**Apply when.** Labels, nav items, statuses, settings.
**Do / Avoid.** Do: "Notifications", "Team members", "Waiting for payment". Avoid: "Webhook config", "Principals", `PENDING_CAPTURE`.
**Why.** Mental models; check support tickets and search logs for the real words.

### Write errors that explain the fix
**Rule.** State what happened, why if it helps, and what to do next; keep input; never blame.
**Apply when.** Field errors, failed actions, page errors.
**Do / Avoid.** Do: "Your API key has expired. Generate a new key in Settings → API." Avoid: "Invalid API key", "Oops! Something went wrong", "You entered an illegal value".
**Why.** Heuristic 9: users need diagnosis and a recovery path; blame and jokes raise frustration, especially around money, privacy, or lost work.

### Use sentence case
**Rule.** Sentence case for buttons, labels, headings, and menus by default.
**Apply when.** All UI text, unless the brand documents a different convention and applies it everywhere.
**Do / Avoid.** Do: "Add payment method". Avoid: "Add Payment Method" mixed with "Add team member" in the same product.
**Why.** Easier to scan and translate, and consistency matters more than the choice.

### Be calm and brief
**Rule.** Cut every sentence you can; no exclamation marks on success; no filler.
**Apply when.** Everywhere, especially success messages, empty states, and onboarding.
**Do / Avoid.** Do: "Invoice sent". Avoid: "Awesome! Your invoice has been successfully sent! 🎉".
**Why.** Users scan; extra words dilute the message, and relentless enthusiasm reads as noise.

---

## Patterns by component

| Component | Pattern | Example |
|---|---|---|
| Primary button | Verb + object | "Create project" |
| Button that opens more input | Verb + ellipsis | "Rename…", "Export as…" |
| Loading text | Present participle + ellipsis, real operation | "Saving…", "Uploading 3 files…" |
| Success (inline or toast) | Past-tense verb + object | "Changes saved", "Invite sent to maya@acme.com" |
| Field label | Noun phrase, no colon | "Work email" |
| Hint | Constraint or reason, one line | "At least 12 characters" · "We'll text a code to this number" |
| Placeholder | Example value only, ends with ellipsis if partial | "name@company.com", "sk-0123…" |
| Field error | Problem + fix | "Enter a date after today" |
| Page/region error | What happened + next step + action | "Couldn't load invoices. Check your connection and try again. [Retry]" |
| Empty state (first use) | What goes here + value + action | "No reports yet. Reports summarize your team's week. [Create report]" |
| No results | Echo query + suggestion + escape | "No results for 'invioce'. Try 'invoice' or [clear filters]" |
| Confirmation title | Question naming action + object | "Delete 3 files?" |
| Confirmation body | Consequence, specific | "They'll be removed for everyone. This can't be undone." |
| Confirmation buttons | Verb matching the title / "Cancel" | "Delete files" / "Cancel" |
| Undo toast | Outcome + Undo | "Archived 12 conversations · Undo" |
| Destructive menu item | Plain verb, separated | "Delete project" |
| Tooltip | Name of the control + shortcut | "Bold (⌘B)" |
| Permission request | Benefit, then ask | "Get notified when a teammate replies. [Turn on notifications] [Not now]" |
| Decline option | Neutral | "No thanks" (never confirmshaming) |

## Word choices

| Avoid | Prefer | Why |
|---|---|---|
| Submit | The outcome ("Send", "Create account") | Predicts the result |
| Click here | Descriptive link text ("Read the pricing FAQ") | Scannable, accessible link purpose |
| Invalid / illegal | What is expected ("Enter a 5-digit ZIP code") | Constructive, no blame |
| Error occurred | What failed ("Couldn't save your changes") | Precise |
| Please wait | The real operation ("Importing contacts…") | Status visibility |
| Are you sure? | The specific action ("Delete this workspace?") | Informative |
| Yes / No / OK on dialogs | Verbs ("Delete", "Keep editing") | Prevents misclicks |
| My account / Your account mixed | One perspective (usually "your"/second person) | Consistency |
| Utilize, leverage, seamless, empower | Use, plain verbs | Plain language |
| Oops!, Uh-oh, Whoops | Plain statement | Tone around failure |
| Remove vs Delete for the same action | One term | Consistency; if they differ ("Remove from list" vs "Delete permanently"), make the difference explicit |

## Numbers, dates, and units

- Numerals for counts ("8 deployments"), including in running text in UI.
- A non-breaking space between number and unit ("10&nbsp;MB") and inside shortcuts ("⌘&nbsp;K").
- Currency with a consistent number of decimals in a given context (0 or 2, never mixed).
- Format numbers, dates, times, and currencies with the user's locale (`Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`); use relative time for recent events ("2 min ago") with the absolute time on hover or in a tooltip.
- Use the ellipsis character (…) rather than three periods, and curly quotes in prose.

## Writing for translation

- Write complete sentences as single translatable strings; never concatenate fragments ("You have " + n + " items").
- Use ICU plural and select syntax (`{count, plural, one {# file} other {# files}}`).
- Budget 30–40% text expansion (German, Finnish); do not design buttons that only fit English.
- Avoid idioms, puns, and culture-specific jokes.
- Mark brand names and code tokens as not-to-translate (`translate="no"`).

## Self-audit

Before shipping, read every visible string on the screen in order and check:

- [ ] Each button predicts its outcome; no "Submit", "OK", "Click here".
- [ ] One verb per action across button, loading, success, and history.
- [ ] Errors say how to fix; none blame or joke.
- [ ] No internal jargon, codes, or enum values.
- [ ] Sentence case (or the documented convention) everywhere.
- [ ] No filler, no exclamation marks on success, no "cute" copy near money, privacy, or lost work.
- [ ] No placeholder or fake content left (lorem ipsum, "John Doe", "Acme"); demo data labeled as sample.

## Sources

- NN/g, "Error-Message Guidelines": https://www.nngroup.com/articles/error-message-guidelines/
- Vercel Web Interface Guidelines (content, copywriting, ellipsis, numerals, units, locale formats): https://github.com/vercel-labs/web-interface-guidelines
- Anthropic `frontend-design` skill (action naming, verb consistency, errors, empty states; Apache-2.0): https://github.com/anthropics/skills/tree/main/skills/frontend-design
- GOV.UK Design System, writing for user interfaces: https://www.gov.uk/service-manual/design/writing-for-user-interfaces
- Unicode ICU MessageFormat (plurals): https://unicode-org.github.io/icu/userguide/format_parse/messages/
- MDN, `Intl`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
