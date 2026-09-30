# Forms

Forms are where users give you effort, data, and money. Every rule here exists because breaking it measurably increases errors or abandonment.

## Contents
- Layout and labels
- Required, optional, and field count
- Validation timing (state machine)
- Error messages: rubric and templates
- Input types, `inputmode`, and `autocomplete`
- Specific fields: names, email, phone, address, dates, passwords, one-time codes, payment
- Choosing the control
- Multi-step forms
- Submission and unsaved changes
- Accessibility wiring
- Framework notes

---

## Layout and labels

### Put a visible label above every field
**Rule.** Every input has a persistent `<label>` above it; placeholders hold only an example value.
**Apply when.** Always, including search boxes in dense tools (the label may be visually hidden there, but it must exist).
**Do / Avoid.** Do: label "Work email", placeholder "name@company.com". Avoid: placeholder "Email" as the only label; floating labels that shrink into unreadable text.
**Why.** Placeholder-as-label vanishes while typing (working memory), looks like a pre-filled value, is usually low contrast, and makes errors hard to review (NN/g lists these harms).

### Use one column
**Rule.** Stack fields vertically in a single column.
**Apply when.** All forms, except logically paired short inputs (city/postcode, expiry/CVC, first/last name if you must split).
**Do / Avoid.** Do: one field per row, width matched to expected input length. Avoid: two-column grids of unrelated fields.
**Why.** Multi-column layouts cause skipped fields and zig-zag scanning; field width is a signifier of expected length.

### Put hints before the input
**Rule.** Format requirements and help go between the label and the input, linked with `aria-describedby`.
**Apply when.** Password rules, formats, "why we ask".
**Do / Avoid.** Do: "At least 12 characters" under the label, visible before typing. Avoid: rules that appear only in the error.
**Why.** Users should meet requirements on the first try; hints below the input get covered by autofill popovers.

### Group with structure
**Rule.** Group related fields with `<fieldset>` and `<legend>` and a section heading; keep the label→input gap smaller than the gap between fields.
**Apply when.** Forms with more than ~5 fields; radio and checkbox groups always.
**Why.** Proximity and common region make the structure scannable, and fieldsets make it navigable by screen readers.

---

## Required, optional, and field count

- **Every field must earn its place.** Delete "nice to have" fields; defer profile details to later; infer what you can (company from email domain, city from postcode, country from locale).
- **Mark both, or mark the minority.** Baymard recommends marking both required and optional explicitly. At minimum mark optional fields "(optional)" when most are required; never rely on an unexplained asterisk alone.
- **Do not ask twice.** WCAG 3.3.7 Redundant Entry: reuse information already given in the flow ("Billing address same as shipping", checked by default).
- **Avoid Reset/Clear buttons.** They get clicked by accident and destroy work.

---

## Validation timing (state machine)

```
pristine ──type──▶ dirty ──blur──▶ validate ──▶ valid ✔ (optional positive check)
                                      └──▶ error ✘ ──input──▶ re-validate on every keystroke
                                                               └── valid → clear error immediately
submit ──▶ validate all ──▶ errors? focus first invalid + summary (long forms) : send
```

- **Validate on blur, not on the first keystroke.** Premature errors ("Invalid email" after one character) are hostile.
- **Once a field is in error, re-validate on input** and remove the error the moment it is fixed ("reward early, punish late").
- **Positive inline validation** (a check mark) helps on fields where correctness is not obvious (username availability, password rules), not on every field.
- **Server-side checks** (email already registered, username taken) run on blur with a debounce and show a pending state; always re-validate on the server at submit.
- **CSS**: `:user-invalid` / `:user-valid` apply only after user interaction (Baseline widely available), which matches this timing without JS.

---

## Error messages: rubric and templates

A good field error passes all of these (adapted from NN/g's error-message guidelines):

| Check | Pass |
|---|---|
| Visible | Next to the field, icon + color + text, field border changes |
| Timely | Not before the user finished the field |
| Human | No codes, jargon, or regex |
| Precise | Names the problem specifically |
| Constructive | Says how to fix it |
| Polite | No blame ("you failed"), no "illegal/invalid user", no jokes |
| Preserving | User input kept and editable |
| Actionable | Offers a fix when possible ("Did you mean …@gmail.com?") |

Template: **[What is wrong] + [how to fix]**, important words first.

| Situation | Avoid | Write |
|---|---|---|
| Missing required field | "Field required" | "Enter your email address" |
| Wrong format | "Invalid email" | "Enter an email address like name@example.com" |
| Typo detected | "Invalid domain" | "Did you mean name@gmail.com?" (button to accept) |
| Date out of range | "Invalid date" | "Enter a date after today" |
| Too long | "Max length exceeded" | "Use 50 characters or fewer (you have 63)" |
| Already exists | "Error 409" | "This email already has an account. Sign in instead?" (link) |
| Card declined | "Payment failed" | "Your bank declined the payment. Try another card or contact your bank." |

For long forms, add an **error summary** at the top on submit ("There are 2 problems") with links that move focus to each field (the GOV.UK pattern).

---

## Input types, `inputmode`, and `autocomplete`

| Field | `type` | `inputmode` | `autocomplete` | Notes |
|---|---|---|---|---|
| Email | `email` | — | `email` (or `username` on sign-in) | `autocapitalize="none"`, `spellcheck="false"` |
| Full name | `text` | — | `name` | Single field unless you truly need parts (`given-name`, `family-name`) |
| Phone | `tel` | — | `tel` | Accept spaces, dashes, `+`; country picker if international |
| Street address | `text` | — | `street-address` or `address-line1`/`address-line2` | Collapse line 2 behind "Add apartment, suite…" |
| Postcode | `text` | `numeric` only if all-digit in your markets | `postal-code` | UK/Canadian postcodes contain letters |
| Country | `select` or combobox | — | `country-name` / `country` | Default from locale |
| New password | `password` | — | `new-password` | Show/hide toggle |
| Current password | `password` | — | `current-password` | |
| One-time code | `text` | `numeric` | `one-time-code` | Allow paste; one input, not 6 boxes, or boxes that accept a pasted code |
| Card number | `text` | `numeric` | `cc-number` | Format in groups of 4, detect brand |
| Expiry | `text` | `numeric` | `cc-exp` | Accept "0427", "04/27", "4/27" |
| CVC | `text` | `numeric` | `cc-csc` | |
| Amount | `text` | `decimal` | `transaction-amount` | Avoid `type="number"` for money (spinners, scroll changes value, locale decimal issues) |
| Search | `search` | — | `off` | `enterkeyhint="search"` |
| URL | `url` | — | `url` | Accept input without `https://` and add it |

Also: `enterkeyhint` (`next`, `done`, `send`, `search`); input font-size ≥ 16 px on mobile to stop iOS zoom (fix the size, never disable zoom); do not use reserved names like `password` on non-auth fields.

---

## Specific fields

- **Email**: one field, no "confirm email". Suggest fixes for common domain typos. Trim whitespace.
- **Names**: one "Full name" field; allow any characters, apostrophes, hyphens, spaces, and long values. Do not require a last name.
- **Phone**: ask only if needed and say why ("For delivery updates"). Parse flexibly, store in E.164.
- **Address**: use address autocomplete where available but always allow manual entry; country first when it changes the fields.
- **Dates**: known dates (birthday) as three labeled text inputs or a single input with format hint; picking a date near today as a calendar picker; ranges with presets ("Last 7 days"). Never force a picker for a date 40 years ago.
- **Passwords**: show/hide toggle; show requirements up front and tick them live; allow paste and password managers (WCAG 3.3.8); prefer length over composition rules; offer passkeys or magic links where possible.
- **One-time codes**: `autocomplete="one-time-code"`, accept paste into the first box, auto-submit when complete, "Resend code" with a visible cooldown, and "Change email/phone".
- **Payment**: card fields in physical-card order, auto-format, detect brand, show wallets (Apple Pay, Google Pay) above the card form. Details in `conversion-ux`.

---

## Choosing the control

| Choice | Control |
|---|---|
| One of 2–5 options, all worth seeing | Radio group or segmented control |
| One of 6–15 options | Select |
| One of many (countries, users, tags) | Searchable combobox |
| Several of a few | Checkbox group |
| Several of many | Multi-select combobox with chips |
| On/off that applies immediately | Switch |
| On/off that applies on submit, or consent | Checkbox (unchecked by default for consent) |
| Number in a small range | Stepper or slider **with** a text input and arrow-key support |

---

## Multi-step forms

- Use when more than ~6–8 fields are needed or later questions depend on earlier answers.
- Show "Step 2 of 4" with step names; start with easy questions; put the commitment step (payment) last.
- Back never loses data; persist progress across refresh (local storage or server draft).
- Keep a summary of earlier answers visible or on a review step with "Edit" links.
- Each step validates before moving on; focus the step heading on step change.

---

## Submission and unsaved changes

- Keep submit enabled until submission starts; then disable it, keep the label, show a spinner ("Creating account…"), and send an idempotency key so double submits are harmless.
- On success, confirm and give the next step; on failure, keep input, show the error near the cause, and offer Retry.
- Warn before leaving with unsaved changes (route guard plus `beforeunload`), except after a successful save.
- Settings that apply immediately (switches) save on change with inline "Saved"; batched edits use an explicit Save with a sticky save bar showing unsaved state.
- Enter submits single-field forms; in textareas Enter adds a line and ⌘/Ctrl+Enter submits.
- Do not submit while an IME composition is active (`event.isComposing`).

---

## Accessibility wiring

- `<label for>` on every control (clicking the label focuses the field; checkbox and label share one hit target).
- Hints and errors linked via `aria-describedby`; `aria-invalid="true"` on fields in error.
- Error messages rendered in the DOM next to the field; announce submit-level results politely; move focus to the first invalid field or the error summary.
- Required: native `required` plus visible text; do not rely on color or asterisk alone.
- Group radios and checkboxes in `<fieldset>` with `<legend>`.

---

## Framework notes (examples, swap freely)

- **React**: form libraries such as React Hook Form or TanStack Form with a schema validator (Zod, Valibot) handle touched/dirty state; configure validation `mode: "onTouched"` (validate on blur, then on change) to match the timing above. Server Actions/`useActionState` return field errors keyed by name.
- **Native HTML**: constraint validation (`required`, `pattern`, `type`) plus `:user-invalid` covers simple forms; call `setCustomValidity` for custom messages.
- **SwiftUI / Compose**: show errors under the field with the platform's supporting-text slot; use `textContentType` (iOS) and autofill hints (Android) for the same autofill benefits.

## Sources

- NN/g, "Website Forms Usability: Top 10 Recommendations": https://www.nngroup.com/articles/web-form-design/
- NN/g, "Placeholders in Form Fields Are Harmful": https://www.nngroup.com/articles/form-design-placeholders/
- NN/g, "Error-Message Guidelines" and scoring rubric: https://www.nngroup.com/articles/error-message-guidelines/ ; https://www.nngroup.com/articles/error-messages-scoring-rubric/
- Baymard Institute, inline validation: https://baymard.com/blog/inline-form-validation
- Baymard Institute, required and optional fields: https://baymard.com/blog/required-optional-form-fields
- Baymard Institute, Address Line 2: https://baymard.com/blog/address-line-2
- Vercel Web Interface Guidelines (Forms): https://github.com/vercel-labs/web-interface-guidelines
- WCAG 2.2 SC 3.3.7 Redundant Entry and 3.3.8 Accessible Authentication: https://www.w3.org/TR/WCAG22/
- HTML autocomplete tokens (WHATWG): https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- MDN, `:user-invalid`: https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid
- GOV.UK Design System, error summary: https://design-system.service.gov.uk/components/error-summary/
