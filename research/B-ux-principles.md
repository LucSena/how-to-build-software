# B — UX / Product-Design Principles: Research Notes for Agent Skills

Compiled 2026-09-30 for an open-source repo of Agent Skills (SKILL.md) on architecture, clean code, scalability, 2026 web design and mobile design.

## How these notes were gathered (provenance and confidence)

- **Direct fetch of the sites was blocked** (lawsofux.com, nngroup.com, how.complexsystems.fail, emilkowal.ski and others returned proxy/connection errors). Content came from:
  1. **Cloned GitHub sources** (in `$SCRATCH/refs2/`):
     - `emilkowalski/skill` (Emil Kowalski's own official skills repo: `emil-design-eng`, `review-animations/STANDARDS.md`, `mobile-native`, `apple-design`, `performance-cheatsheet.md`). **High confidence**, since this is first-party text.
     - `ardakaracizmeli/design-system-checklist`: the actual source of designsystemchecklist.com. Full English checklist flattened to `$SCRATCH/refs2/dsc.txt` (6.4k words). **High confidence.**
     - `fmhall/software-laws/ux-laws/laws/*.md`: per-law files carrying the lawsofux.com quote and "Takeaways" bullets, each linking to its lawsofux.com URL. **High confidence** that this is lawsofux wording, lightly edited.
     - `rams-design/rams-plugin`: the Rams (rams.ai) skill's accessibility and visual checklist. **High confidence.**
     - `adamchainz/talk-how-complex-systems-fail`: a talk on Cook's paper (used to cross-check the numbering).
  2. **WebSearch summaries**: NN/g articles, humanebydesign.com, Baymard, WCAG 2.2, Apple/Material touch targets and YC RFS. **Medium-high confidence.** The quoted phrases match the source summaries.
  3. **Background knowledge** where search budget ran out: Cook's 18 points (well-known canonical text), the long-form text of Nielsen's heuristics, some Baymard specifics and GOV.UK principles. These are marked **[K]**. Treat [K] items as accurate to the best of knowledge, and spot-check exact numbers before quoting them as statistics.
- Legend: **Rule** = the actionable instruction for an AI coding agent building UI. **Src** = source URL.

---

## 1. Cognition and perception laws (Laws of UX, Jon Yablonski)

Src root: https://lawsofux.com/ (each law is at `https://lawsofux.com/<slug>/`). lawsofux groups them roughly into Perception (Gestalt), Cognition, Decision-making, Attention, Memory, Behavior and Aesthetics. There are 30 laws. The quotes and takeaways below are lawsofux wording, via `fmhall/software-laws`.

### 1.1 Perception (Gestalt)

**Law of Proximity**: "Objects that are near, or proximate to each other, tend to be grouped together."
- Takeaways: proximity establishes relationships; nearby elements are perceived to share functionality or traits; it helps users organize information faster.
- **Rule:** spacing *is* grouping. Use a spacing scale where the gap *within* a group is clearly smaller than the gap *between* groups (e.g. 4–8px from label to input, 16–24px between fields, 32–48px between sections). Never use uniform spacing everywhere. Keep a helper or error text closer to its own field than to the next field.
- Src: https://lawsofux.com/law-of-proximity/

**Law of Common Region**: "Elements tend to be perceived into groups if they are sharing an area with a clearly defined boundary."
- Takeaways: common region creates clear structure; a border is the easy way to create it; a background behind elements works too.
- **Rule:** group related controls in a card, section or fieldset with a subtle background or 1px border. Don't nest boxes more than 2 levels deep ("card-in-card-in-card" is noise). A `<fieldset>`/`<legend>` gives the same grouping semantically to screen readers.
- Src: https://lawsofux.com/law-of-common-region/

**Law of Similarity**: "The human eye tends to perceive similar elements as a complete picture, shape, or group, even if those elements are separated."
- Takeaways: things that look alike read as belonging together; color, shape, size, orientation and motion all signal shared meaning; **make links and navigation visually distinct from regular text.**
- **Rule:** the same function gets the same appearance (all destructive buttons share a variant, all links share a style). A different function gets a different appearance. Never style non-interactive text like a link, or links like body text.
- Src: https://lawsofux.com/law-of-similarity/

**Law of Uniform Connectedness**: "Elements that are visually connected are perceived as more related than elements with no connection."
- Takeaways: connect related functions with shared color, lines, frames or containers; a direct connector (line or arrow) makes a relationship unmistakable.
- **Rule:** steppers, timelines and flows get connecting lines. A tab visually connects to its panel; a popover's arrow connects to its trigger.
- Src: https://lawsofux.com/law-of-uniform-connectedness/

**Law of Prägnanz**: "People will perceive and interpret ambiguous or complex images as the simplest form possible, because it is the interpretation that requires the least cognitive effort."
- **Rule:** prefer simple geometric shapes and consistent icon strokes. Reduce layout to a few clear shapes and alignments, and remove ornament that competes with content.
- Src: https://lawsofux.com/law-of-pragnanz/

### 1.2 Cognition, decision-making and memory

**Jakob's Law**: "Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know."
- Takeaways: users transfer expectations from familiar products; leveraging existing mental models lets users focus on tasks instead of learning; **when changing things, let users keep using the familiar version temporarily.**
- **Rule:** use conventional patterns (logo top-left linking home, search at top, cart top-right, labels above inputs, bottom tab bar on mobile apps, standard icons). For big redesigns, ship an opt-in preview with a "switch back" path.
- Src: https://lawsofux.com/jakobs-law/

**Mental Model**: "A compressed model based on what we think we know about a system and how it works."
- Takeaways: people reuse mental models across similar situations; matching them feels intuitive; closing the gap between the designer's model and the user's model requires research.
- **Rule:** name things in the user's domain language (not DB table names). A kanban board should behave like Trello, and a table should sort and filter like a spreadsheet.
- Src: https://lawsofux.com/mental-model/

**Hick's Law**: "The time it takes to make a decision increases with the number and complexity of choices."
- Takeaways: minimize choices when response time is critical; break complex tasks into steps; **highlight recommended options**; progressive onboarding; **"be careful not to simplify to the point of abstraction."**
- **Rule:** one primary CTA per view. Give menus a sensible default and put the recommended option first or badge it. Hide rare actions in an overflow ("More") menu. Never strip labels off icons just to look minimal.
- Src: https://lawsofux.com/hicks-law/

**Choice Overload**: "the tendency for people to get overwhelmed when they are presented with a large number of options" (the paradox of choice).
- Takeaways: excess options hurt decisions and perception; **enable side-by-side comparison** when comparing is needed (e.g. pricing tiers); prioritize featured content and give up-front narrowing tools (search, filters).
- **Rule:** use 3 or 4 pricing tiers at most, with one highlighted as recommended. Long option lists get search or filter. Comparison tables should align the same attributes row by row.
- Src: https://lawsofux.com/choice-overload/

**Cognitive Load**: "The amount of mental resources needed to understand and interact with an interface."
- Takeaways: overload makes users miss details; *intrinsic* load is the effort the task itself requires; *extraneous* load is effort spent on distracting or superfluous design.
- **Rule:** attack extraneous load first. Remove decoration, duplicate information and unnecessary choices. Use smart defaults, autofill and progressive disclosure.
- Src: https://lawsofux.com/cognitive-load/

**Chunking**: "A process by which individual pieces of an information set are broken down and then grouped together in a meaningful whole."
- **Rule:** split long forms into titled sections. Format long numbers (phone `555 123 4567`, IBAN and card numbers in groups of 4). Use headings, short paragraphs and lists so content is scannable.
- Src: https://lawsofux.com/chunking/

**Miller's Law**: "The average person can only keep 7 (plus or minus 2) items in their working memory."
- Takeaways: **don't use the magic number seven as a hard rule to justify arbitrary design limits.** Chunk content, and remember that capacity varies by person and context.
- **Rule:** don't cap navigation at exactly 7 items. *Chunk* instead, and don't make users memorize anything.
- Src: https://lawsofux.com/millers-law/

**Working Memory**: "A cognitive system that temporarily holds and manipulates information needed to complete tasks."
- Takeaways: working memory holds **4–7 chunks, each fading after 20–30 s**; **recognition beats recall** (visited-link styling, breadcrumbs, persistent labels); **the system, not the user, should carry the memory burden** (e.g. comparison tables, summary panels).
- **Rule:** carry context across steps (order summary visible throughout checkout). Never ask a user to copy a code from one screen to another; auto-fill it. Keep labels visible (never placeholder-only).
- Src: https://lawsofux.com/working-memory/

**Tesler's Law (Conservation of Complexity)**: "For any system there is a certain amount of complexity which cannot be reduced."
- Takeaways: irreducible complexity is borne by either the system or the user, so **move it onto the system**. Don't design for an idealized rational user. Put guidance in context.
- **Rule:** infer what you can (city and state from postcode, card type from number, timezone from browser). Parse flexible input in code rather than demanding strict formats.
- Src: https://lawsofux.com/teslers-law/

**Occam's Razor**: "Among competing hypotheses that predict equally well, the one with the fewest assumptions should be selected."
- Takeaways: the best way to reduce complexity is to avoid it; remove elements without compromising function; **a design is complete only when nothing more can be removed.**
- **Rule:** before adding a UI element, ask what breaks if it is absent. Delete redundant buttons, duplicate links and decorative widgets.
- Src: https://lawsofux.com/occams-razor/

**Pareto Principle**: "for many events, roughly 80% of the effects come from 20% of the causes."
- **Rule:** find the 2–3 key tasks per screen and make them frictionless. Put polish effort into the most-used flows first.
- Src: https://lawsofux.com/pareto-principle/

**Cognitive Bias**: "A systematic error of thinking or rationality in judgment that influence our perception of the world and our decision-making ability."
- **Rule:** knowing biases is for *reducing* user error, not exploiting it (see §4 on dark patterns). Beware confirmation bias in your own design reviews.
- Src: https://lawsofux.com/cognitive-bias/

**Serial Position Effect**: "Users have a propensity to best remember the first and last items in a series."
- Takeaways: put the least important items in the middle; **put key actions at the far left and right** of navigation.
- **Rule:** in a bottom tab bar, Home goes first and Profile/Account last. Put key table columns leftmost and row actions rightmost.
- Src: https://lawsofux.com/serial-position-effect/

**Peak-End Rule**: "People judge an experience largely based on how they felt at its peak and at its end, rather than the total sum or average."
- Takeaways: design the most intense moments and the final moments; **negative experiences are recalled more vividly.**
- **Rule:** invest in success screens (clear confirmation and next step), error recovery and the last step of onboarding or checkout. Never end a flow on a dead end.
- Src: https://lawsofux.com/peak-end-rule/

**Zeigarnik Effect**: "People remember uncompleted or interrupted tasks better than completed tasks."
- Takeaways: give clear signifiers that more content exists; show progress toward goals.
- **Rule:** "3 of 5 steps done" profile checklists; draft indicators; partial cards at the scroll edge to signal overflow. Use this honestly: don't invent fake incomplete tasks to nag users.
- Src: https://lawsofux.com/zeigarnik-effect/

### 1.3 Attention and behavior

**Doherty Threshold**: "Productivity soars when a computer and its users interact at a pace (<400ms) that ensures that neither has to wait on the other."
- Takeaways: give feedback within 400 ms; use perceived performance; animation can engage users while work happens; **progress bars make waits tolerable regardless of accuracy**; a purposeful delay can sometimes *increase* perceived value and trust.
- **Rule:** acknowledge every input in under 100 ms (pressed state), and show a result or loading state in under 400 ms. Use optimistic updates for likely-successful mutations, and skeletons shaped like the content.
- Src: https://lawsofux.com/doherty-threshold/

**Fitts's Law**: "The time to acquire a target is a function of the distance to and size of the target."
- Takeaways: targets must be large enough, well spaced, and placed where they are easy to reach.
- **Rule:** use a minimum 44×44 pt (iOS) / 48×48 dp (Android) touch target, and never go below 24×24 CSS px (WCAG 2.5.8). Expand hit areas with padding or pseudo-elements rather than enlarging the visual. Put primary mobile actions in the thumb zone (bottom). Keep destructive actions away from frequent ones.
- Src: https://lawsofux.com/fittss-law/

**Selective Attention**: "The process of focusing our attention only to a subset of stimuli in an environment — usually those related to our goals."
- Takeaways: **banner blindness** (users ignore anything ad-like, so never style important content as an ad or put it next to promos); **change blindness** (changes go unnoticed when attention is divided, so audit simultaneous changes).
- **Rule:** when something important changes (a price, validation state or saved status), give it a local, visible cue near the user's focus and announce it with `aria-live`.
- Src: https://lawsofux.com/selective-attention/

**Von Restorff Effect**: "When multiple similar objects are present, the one that differs from the rest is most likely to be remembered."
- Takeaways: make key information and actions distinct; **use restraint** (too many highlights compete and look like ads); **don't rely on color alone**; consider motion sensitivity.
- **Rule:** one accent-colored primary button per view. Mark distinctions with a shape, icon or text as well as color.
- Src: https://lawsofux.com/von-restorff-effect/

**Flow**: "The mental state in which a person performing some activity is fully immersed in a feeling of energized focus, full involvement, and enjoyment."
- Takeaways: match challenge to skill; give feedback; remove friction; make content discoverable.
- **Rule:** no interrupting modals mid-task. Autosave. Offer keyboard shortcuts for experts. Don't force context switches (open references in a side panel, not a new page).
- Src: https://lawsofux.com/flow/

**Goal-Gradient Effect**: "The tendency to approach a goal increases with proximity to the goal."
- Takeaways: effort speeds up near the goal; **artificial progress** helps motivation (the endowed progress effect); show progress clearly.
- **Rule:** "Step 2 of 4" labels and progress bars in multi-step flows. Count account creation as step 1 already done.
- Src: https://lawsofux.com/goal-gradient-effect/

**Paradox of the Active User**: "Users never read manuals but start using the software immediately."
- **Rule:** put guidance *in the product*: empty states, inline hints, contextual tooltips, sample data. Never gate usage behind a mandatory tour.
- Src: https://lawsofux.com/paradox-of-the-active-user/

**Parkinson's Law**: "Any task will inflate until all of the available time is spent."
- Takeaways: limit task time to expectations; beating the expected time delights; use autofill and smart defaults.
- **Rule:** state time expectations ("Takes about 2 min"). Use `autocomplete` attributes, passkeys and wallet payments to shrink flows.
- Src: https://lawsofux.com/parkinsons-law/

**Postel's Law (Robustness Principle)**: "Be liberal in what you accept, and conservative in what you send."
- Takeaways: tolerate varied input; anticipate varied access and capabilities; **accept variable input, translate it to system requirements, define clear boundaries, give clear feedback.**
- **Rule:** trim whitespace; accept phone numbers with spaces, dashes or parentheses; accept dates in several formats; match emails case-insensitively; accept card numbers with spaces. Normalize server-side, and output one canonical format.
- Src: https://lawsofux.com/postels-law/

**Aesthetic-Usability Effect**: "Users often perceive aesthetically pleasing design as design that's more usable."
- Takeaways: people tolerate minor issues in attractive designs; **visual polish can mask usability problems during testing.**
- **Rule:** polish matters (consistent radius, spacing and type scales), but test real task completion rather than relying on "looks good" feedback.
- Src: https://lawsofux.com/aesthetic-usability-effect/

---

## 2. Usability heuristics (Nielsen Norman Group)

Src: https://www.nngroup.com/articles/ten-usability-heuristics/ (Jakob Nielsen, 1994, text refreshed 2020/2024). Headline definitions for #1 and #2 are confirmed by search; the rest are [K], based on the canonical text.

1. **Visibility of system status.** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time." Without timely feedback users are unsure their action was received and become confused and mistrustful.
   - **Rule:** every async action needs pending, success and error states. Show where the user is (active nav item, breadcrumbs, step indicator). Show save state ("Saved · 2s ago"). Show upload and progress percentages.
2. **Match between the system and the real world.** Speak the users' language (familiar words, phrases and concepts, not internal jargon). Follow real-world conventions, with information in a natural, logical order.
   - **Rule:** no raw error codes, enum names or DB field names in UI copy. Use icons with a real-world meaning. Order fields as people think of them.
3. **User control and freedom.** Users often act by mistake and need a clearly marked "emergency exit" without an extended process: support **Undo and Redo**.
   - **Rule:** every modal closes with Esc, an X and a click outside (unless there is unsaved data, in which case confirm). Provide undo for deletes (a toast with Undo), Back that works (URL-driven state), and cancel for long operations.
4. **Consistency and standards.** Users shouldn't have to wonder whether different words, situations or actions mean the same thing. Follow platform and industry conventions, keeping both *internal* consistency (within the product) and *external* consistency (with Jakob's Law).
   - **Rule:** use design-system tokens and components only. Use one term per concept ("Delete" vs "Remove" consistently). Follow OS conventions (iOS back swipe, Android back button).
5. **Error prevention.** Good error messages matter, but preventing problems is better. Eliminate error-prone conditions, or check for them and ask for confirmation before committing. Nielsen distinguishes *slips* (inattention) from *mistakes* (a mismatched mental model).
   - **Rule:** use constraints (date pickers, disabled invalid options, input masks), good defaults and inline validation. Confirm destructive, irreversible actions, and prefer undo when it is feasible.
6. **Recognition rather than recall.** Minimize memory load by making elements, actions and options visible. The user shouldn't have to remember information between parts of the interface. Help information should be visible or easy to retrieve when needed.
   - **Rule:** persistent labels, recent searches, autocomplete, visible menus (not hidden gestures), and previews of choices.
7. **Flexibility and efficiency of use.** Shortcuts, hidden from novices, speed up experts. Allow users to tailor frequent actions.
   - **Rule:** keyboard shortcuts plus a command palette (⌘K), bulk actions, saved filters and customizable defaults. Never *require* the shortcut.
8. **Aesthetic and minimalist design.** Interfaces shouldn't contain irrelevant or rarely needed information. Every extra unit competes with the relevant units and lowers their visibility. (This is about focus, not flat styling.)
   - **Rule:** strong visual hierarchy, one primary action per view, and secondary information de-emphasized or disclosed progressively.
9. **Help users recognize, diagnose, and recover from errors.** Error messages in plain language (no codes) that state the problem precisely and constructively suggest a solution, using traditional error visuals (bold, red text).
   - **Rule:** see §3.2 for the error-message rubric.
10. **Help and documentation.** Ideally the system needs no explanation, but documentation may still be needed. Make help easy to search, focused on the user's task, and presented as concrete steps. Prefer contextual help (tooltips, inline hints, empty-state guidance) over manuals.
    - **Rule:** put "?" affordances next to complex fields, link docs from error states, and put help in the same place on every page (WCAG 3.2.6 Consistent Help).

Related NN/g findings:
- **Response-time limits** (Nielsen, "Response Times: The 3 Important Limits"): **0.1 s** feels instantaneous (no feedback needed beyond the result); **1 s** keeps the flow of thought uninterrupted, though the delay is noticed; **10 s** is the limit of attention, after which users want to do other things. [K, NN/g progress-indicator guidance]: show a looped indicator (spinner) for 2–10 s waits, a percent-done bar for more than 10 s, and no indicator for under ~1 s, because a flashing spinner looks glitchy.
  - **Rule:** delay showing spinners by ~300–500 ms to avoid flashes; once shown, keep them visible for a minimum ~300 ms. Use skeleton screens for full-page and section loads, and determinate progress for long jobs, with background completion and a notification.
  - Src: https://www.nngroup.com/articles/response-times-3-important-limits/
- **Heuristics in complex apps**: Src https://www.nngroup.com/articles/usability-heuristics-complex-applications/
- **Hidden navigation** (hamburger menus): hiding the main navigation cut discoverability by more than 20% (on desktop it was nearly halved), increased task time and raised perceived difficulty. With only 4–5 top-level items, show them visibly (tab bar); otherwise use a *combo* navigation with some items exposed and the rest collapsed.
  - Src: https://www.nngroup.com/articles/hamburger-menus/
- **Progressive disclosure**: initially show only the few most important options and offer specialized options on request. This makes an app easier to learn and less error-prone. You *must* give a visible way to reveal the hidden options (a clear "Advanced settings" affordance). Get the split right: everything frequently needed goes on the primary layer. Don't go beyond 2 disclosure levels. Distinguish it from **staged disclosure** (wizards and steppers, where everyone goes through every step in order).
  - **Rule:** put advanced options behind a labelled disclosure (`<details>` or an accordion). Multi-step forms show step count and progress.
  - Src: https://www.nngroup.com/articles/progressive-disclosure/

---

## 3. Forms, errors and states

### 3.1 Forms (NN/g plus Baymard)

NN/g "Website Forms Usability: Top 10 Recommendations" (Src https://www.nngroup.com/articles/web-form-design/) and "Placeholders in Form Fields Are Harmful" (Src https://www.nngroup.com/articles/form-design-placeholders/):
- **Keep the form as short as possible.** Every field must justify itself; delete "nice to have" fields.
- **Visually group related labels and fields** (proximity). Put the label close to its own field, not equidistant between two fields.
- **Single-column layout.** Multi-column forms cause skipped fields and zig-zag scanning. Exceptions: logically paired short inputs such as city/state/ZIP or expiry/CVC.
- **Top-aligned labels** give the fastest completion and fewest errors.
- **Never use placeholder text as a label.** Disappearing placeholders strain short-term memory, make it hard to check and fix errors, look like pre-filled values, often have low contrast, and burden users with visual and cognitive impairments (NN/g lists 7 reasons). Put hints *outside* the field (helper text below the label).
- **Distinguish required from optional fields.** NN/g: mark required fields with an asterisk and explain it. Baymard: **mark both required and optional explicitly** (Src https://baymard.com/blog/required-optional-form-fields).
- **Explain input requirements up front** (password rules, formats) before the user types, not only in the error.
- **Match field width to expected input length** (ZIP short, street long). Field size is a signifier.
- **Avoid Reset/Clear buttons** [K]. They get clicked by accident and destroy work.
- **Descriptive submit button** ("Create account", "Pay $42.00"), not "Submit".
- **Use the right controls**: radio buttons for 2–5 visible mutually exclusive options (not a dropdown); a switch for immediate-effect settings; a checkbox for a submit-later boolean.
- Mobile form specifics (Emil `mobile-native`, NN/g): set `type="email"`/`tel` and `inputmode="numeric"`/`decimal`; `autocomplete="email|given-name|postal-code|cc-number|one-time-code|…"`; `autocapitalize="none"` and `autocorrect="off"` for usernames and codes; `enterkeyhint="next|done|send|search"`; **input font-size ≥ 16px** to prevent iOS zoom (never disable zoom).

**Inline validation (Baymard)** (Src https://baymard.com/blog/inline-form-validation):
- Validate **after the user leaves the field** (on blur), not while typing (premature "invalid email" at the first character is hostile).
- **Remove the error as soon as it is corrected** (re-validate on input once a field is in an error state).
- Use **positive inline validation** (a checkmark) for correctly completed fields; it adds a sense of progress.
- **On a failed submit, preserve all entered data** and scroll or focus to the first error; clearing a form is a critical failure.
- **Rule for agents:** the validation state machine is `pristine → touched (blur) → validate → error | valid`. After an error, validate on every keystroke until the field is valid. On submit, focus the first invalid field, and show an error summary at the top that links to each field (the GOV.UK pattern) for long forms.

### 3.2 Error messages (NN/g)

Src: https://www.nngroup.com/articles/error-message-guidelines/ and the scoring rubric https://www.nngroup.com/articles/error-messages-scoring-rubric/ (12 guidelines in 3 groups).
- **Visibility**
  - Show the error **close to its source**, next to the affected element(s).
  - Use **noticeable, redundant indicators**: bold, high-contrast, red text *plus* an icon and a highlighted field border. Color alone fails WCAG 1.4.1.
  - **Design for error severity**: a field-level issue is inline; a page-level problem is a banner; a blocking system failure is a full state. Don't use modal dialogs for field errors.
  - **Avoid premature display** (don't flag errors before the user has had a chance to finish).
- **Communication**
  - **Human-readable** language, no codes or jargon (log codes separately, or show them as a secondary "Error ID" for support).
  - **Concise and precise** description of the problem, with the important words first.
  - **Constructive advice**: say how to fix it ("Enter a date in the future", not "Invalid date").
  - **Positive, non-blaming tone.** No "illegal", "invalid user" or "you failed". Don't use humor at the user's expense.
- **Efficiency**
  - **Preserve the user's input** so they can edit it rather than retype it.
  - **Offer an actionable fix** with a high chance of success ("Did you mean gmail.com?", a "Retry" button, a pre-selected alternative).
  - **Educate**: link one contextual help resource.
- **Rule template:** `[What happened] + [Why, if useful] + [How to fix/next action]`. For example: "We couldn't charge your card. Your bank declined the payment. Try another card or contact your bank." Put Retry and Change-card actions next to it.

### 3.3 Empty states (NN/g)

Src: https://www.nngroup.com/articles/empty-state-interface-design/ (Kate Kaplan, 2021). The three guidelines are to use empty states to:
1. **Communicate system status**: say *why* it is empty ("No invoices yet", "No results for 'foo'", "You're offline", "Nothing matches these filters"). Never show a blank container, which reads as broken or still loading.
2. **Increase learnability**: explain what will appear here and how the feature helps (in-context help, per the paradox of the active user).
3. **Provide direct pathways** for key tasks: a primary CTA ("Create your first project"), templates, sample data or an import.
- **Rule:** every list, table, search and dashboard component needs an explicit **empty**, **loading**, **error**, **partial** and **ideal** state. The "5 UI states" checklist is: empty (first use / user-cleared / no results / filtered-to-nothing), loading, error, partial (some data), and ideal. For "no results", show the query, offer "Clear filters", and suggest spelling fixes.

### 3.4 Other state rules

- **Confirmation dialogs** [K, NN/g "Confirmation Dialogs Can Prevent User Errors (If Not Overused)"]: use them only for consequential, irreversible actions. Overuse trains reflexive clicking. Make the dialog specific: the title states the action and object ("Delete 3 files?"), and the buttons use verbs ("Delete files" / "Cancel"), never "Yes"/"No"/"OK". **Prefer undo over confirm** for recoverable actions. For severe actions (deleting a repo or account), require typing the name. Apple's HIG says the same: a confirmation dialog only for genuinely destructive, irreversible actions (Emil `apple-design`, Agency principle).
- **Button states** (NN/g "Button States: Communicate Interaction", https://www.nngroup.com/articles/button-states-communicate-interaction/): enabled, hover, focus, pressed/active, disabled and loading must each look distinct. The design-system checklist adds that the loading spinner must not change the button's width or height.
- **Disabled buttons**: prefer keeping the submit button enabled and showing errors on click. Disabled buttons don't explain why [K, common NN/g/Adam Silver guidance]. If you do disable one, explain what is missing.
- **Toasts** (checklist and Emil/Sonner): make the timeout long enough to read (about 4–6 s or more, proportional to text length); **pause the timer on hover or focus and when the tab is hidden**; stack them; put an Undo action on destructive actions; make actions keyboard-focusable; never put critical or blocking information *only* in a toast; announce via `role="status"`/`aria-live="polite"`.

---

## 4. Ethical and humane design; dark patterns to avoid

### 4.1 Humane by Design (Jon Yablonski): 7 principles

Src: https://humanebydesign.com/principles

1. **Transparent**: "clear about intentions, honest in actions and free of dark patterns." Patterns: communicate exactly **what data is collected and why**; give access to collected data; make **unsubscribe and account/data deletion easy to find** and permanent.
   - **Rule:** privacy copy at the point of collection; "Delete account" reachable in Settings in 2–3 taps; an unsubscribe link that works in one click; data export available.
   - Src: https://humanebydesign.com/principles/transparent
2. **Resilient**: "focuses on the well-being of the most vulnerable and anticipates the potential for abuse." Patterns: **enable content control** (who can see my info and content); **community moderation** (block, mute, report).
   - **Rule:** any UGC or social feature ships with block, report, mute and visibility controls on day one. Threat-model abuse (stalking via location, harassment via DMs).
   - Src: https://humanebydesign.com/principles/resilient
3. **Empowering**: technology should "augment human ability," increase the sense of agency "without dictating the rhythm of our lives," and **center on the value provided to people over the revenue it can generate.**
   - **Rule:** users control defaults, notification cadence and data. No forced engagement loops.
   - Src: https://humanebydesign.com/principles/empowering
4. **Finite**: "maximizes the overall quality of time spent by bounding the experience and prioritizing meaningful and relevant content." Patterns: an **"All caught up" indicator** (curbs "zombie scrolling"); a **Load More button** instead of infinite scroll. Feeds are criticized for being "purposely designed to auto-refill… eliminate any reason for you to pause."
   - **Rule:** prefer pagination or "Load more" plus end-of-feed markers. If infinite scroll is used (e.g. media feeds), give natural stopping points and never auto-play the next item without a user setting. (There are 2026 regulatory signals too: EU scrutiny of addictive design and infinite scroll per 2026 search results; treat it as a compliance risk.)
   - Src: https://humanebydesign.com/principles/finite
5. **Inclusive**: "enables and draws on the full range of human diversity."
   - **Rule:** accessibility (§9), localization and RTL, a flexible name field (single "Full name"), non-binary and optional gender, no assumptions about family or address structure.
   - Src: https://humanebydesign.com/principles/inclusive
6. **Intentional**: "uses friction to prevent abuse, protects privacy, steers people towards healthier digital habits and considers long-term consequences over short-term gain." Patterns: **manual speed bumps** (confirmation dialogs that "promote critical thought"); **algorithmic speed bumps** (slow down virality, deter bad actors, e.g. "You haven't opened this article — read before sharing?"); privacy and anonymity controls; "positive friction results in more intentional choices."
   - Src: https://humanebydesign.com/principles/intentional and https://humanebydesign.com/garden/embrace-friction
7. **Respectful**: "prioritizes people's time, attention and overall digital well-being." Patterns: **align notification delivery with urgency** (not everything is a push); **allow personalization** of from whom, when and how notifications arrive; **respect context** (quiet hours, do-not-disturb, time zones).
   - **Rule:** notification settings per category and channel; batch digests for non-urgent items; no push by default for marketing; ask for notification permission in context after value is shown, never on first launch.
   - Src: https://humanebydesign.com/principles/respectful

### 4.2 Dark patterns (deceptive patterns) to never implement [K]

Taxonomy from Harry Brignull's deceptive.design (search budget exhausted, so this is from knowledge) plus regulator lists (FTC, EU DSA/DMA, the California CPRA "dark patterns" definition):
- **Confirmshaming** ("No thanks, I don't like saving money"). Rule: opt-out copy must be neutral ("No thanks").
- **Sneaking / sneak into basket**: pre-added items or insurance. Rule: never add items the user didn't choose.
- **Hidden costs / drip pricing**: fees revealed at the last step. Rule: show the all-in price (taxes, shipping, fees) as early as possible. This is also the #1 abandonment cause per Baymard (§7).
- **Obstruction / roach motel / hard to cancel**: easy signup, hard cancellation. Rule: cancellation takes the same number of steps as signup and is available online (the FTC "click-to-cancel" direction).
- **Forced action / forced registration**: requiring an account to buy. Rule: guest checkout.
- **Preselection**: pre-checked marketing or consent boxes. Rule: consent checkboxes default to unchecked, and cookie banners give "Reject all" equal prominence to "Accept all".
- **Fake urgency / fake scarcity**: fake countdowns, fake "3 people viewing." Rule: only show urgency or scarcity if it is true and backed by data. (Note: some derived "Laws of UX" skills suggest "3 people viewing" as a pattern; the humane stance is to show it only if real.)
- **Fake social proof**: invented reviews or testimonials. Never do this.
- **Disguised ads, trick wording, visual interference** (the reject button styled as a link, double negatives). Rule: equal visual weight for accept and decline on consent; plain wording.
- **Nagging**: repeated permission and upsell prompts. Rule: respect "Not now" for a meaningful period, and always include "Don't ask again".
- **Privacy zuckering**: tricking users into sharing more data. Rule: privacy-protective defaults.
- **Agent rule of thumb:** if a pattern works *only because* the user misunderstands it, don't build it.

### 4.3 Dieter Rams: 10 principles, including in AI-assisted design

Rams (Vitsœ) says good design:
1. is innovative
2. makes a product useful
3. is aesthetic
4. makes a product understandable
5. is unobtrusive
6. is honest
7. is long-lasting
8. is thorough down to the last detail
9. is environmentally friendly
10. is as little design as possible ("Less, but better")

- **rams.ai** is *not* a principles site. It is **"Rams: Design eval for agents"**, an automated design-review engine (a GitHub App, an MCP server and a Claude/Codex plugin) that reviews React/Vue/Svelte/CSS/SwiftUI changes against about 313–348 rules in 9 categories (accessibility, color, typography, spacing, components, UX, motion, platform conventions…). Each finding carries a severity, file:line and a fix, and each PR gets a 0–100 score. It catches problems like "**competing CTAs** (two primary-weight buttons with no visual ranking and no clear next step)", low contrast, missing labels, and "generic gradients and templated layouts" (AI slop). Src: https://www.rams.ai/ ; https://github.com/rams-design/rams-plugin
- The local Rams skill checklist, a good seed for our own review skill (WCAG 2.2 mapped):
  - **Critical:** `<img>` without alt (1.1.1); icon-only button with no `aria-label` (4.1.2); input/select/textarea without a label (1.3.1); `<div onClick>`/`<span onClick>` with no role, tabIndex or key handler (2.1.1); `<a>` without href that relies on onClick (2.1.1).
  - **Serious:** `outline: none` with no visible replacement (2.4.7); onClick without keyboard handlers (2.1.1); color-only status (1.4.1); touch target under 24×24 px (2.5.8; 44×44 recommended).
  - **Moderate:** skipped heading levels (1.3.1); positive `tabIndex` (2.4.3); `role="button"` without `tabIndex=0` (4.1.2).
  - **Visual:** inconsistent spacing values; overflow and alignment; z-index conflicts; mixed font families, weights or sizes; line-height problems; missing font fallbacks; contrast under 4.5:1; missing hover and focus states; dark-mode inconsistencies; missing button states (disabled, loading, hover, active, focus); missing field states (error, success, disabled); inconsistent borders, shadows and icon sizes.
  - **Output:** severity-grouped findings with line numbers, code snippet, fix and WCAG reference, plus a score.
- **Apple's 8 design foundations** (as encoded in Emil's `apple-design` skill, from WWDC design talks): **Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity (not minimalism), Craft, Delight** (delight is "the result of getting the other seven right, not confetti tacked on top"). Wayfinding: every screen answers "Where am I? Where can I go? What's there? How do I get out?" Feedback comes in four kinds: status, completion, warning, error. Specific labels ("Library", "Progress") beat vague ones ("Home").

### 4.4 principles.design (Ben Brignell), lessons.design and webfieldmanual.com

- **principles.design** is an open-source, editorially curated collection (since 2017) of hundreds of published design principles from companies and governments, plus guidance on *writing* principles. Src: https://principles.design/ ; examples such as Nielsen's heuristics at https://principles.design/examples/10-usability-heuristics-for-user-interface-design
  - The takeaway for our skills [K]: good principles are **memorable, actionable, specific to the product, and they take a position that has trade-offs** (often phrased "X over Y"). A principle nobody could disagree with ("be simple") is not a principle.
  - Canonical example often cited there: the **GOV.UK Government Design Principles** [K]: 1 Start with user needs; 2 Do less; 3 Design with data; 4 Do the hard work to make it simple; 5 Iterate. Then iterate again; 6 This is for everyone; 7 Understand context; 8 Build digital services, not websites; 9 Be consistent, not uniform; 10 Make things open: it makes things better.
- **lessons.design** ("Lessons of Design") is a designer's personal essay site: "The musings of a designer on why he designs the way he does and what he's learned along the journey." Its content could not be retrieved, so it is low value for rules; cite only as inspiration. Src: https://lessons.design/
- **webfieldmanual.com/design** (also by Jon Yablonski) is a curated link directory of web design resources with sections for Best Practices (performance, device-agnostic design, UI principles, image optimization, forms), Process (resilient web design, design-principle guides, psychology of design, IA) and Accessibility. Use it as a *reading list*, not a rule source. Src: https://webfieldmanual.com/design

---

## 5. Motion principles (Emil Kowalski: Sonner, Vaul, "You Don't Need Animations")

Primary sources: https://emilkowal.ski/ui/you-dont-need-animations ; https://emilkowal.ski/ui/7-practical-animation-tips ; https://emilkowal.ski/ui/agents-with-taste (March 2026: "agents can write code but don't have taste; almost every taste decision has a logical reason. Write a skill file per aspect, with the rules"). The official skills repo https://github.com/emilkowalski/skill (skills: `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `mobile-native`, `animate-expo`, `ask-sonner`, `pick-ui-library`, `prototype`, `write-swift`).

### 5.1 Should it animate at all? (the core of "You Don't Need Animations")

| How often the user sees it | Decision |
|---|---|
| 100+ times/day (keyboard shortcuts, command palette toggle) | **No animation. Ever.** |
| Tens of times/day (hover effects, list navigation) | Remove or drastically reduce |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare or first-time (onboarding, feedback forms, celebrations) | Can add delight |

- **Never animate keyboard-initiated actions.** Raycast has no open/close animation, which is optimal for something used hundreds of times a day.
- Every animation needs a **purpose**: *spatial consistency* (a toast enters and exits the same way, so swipe-to-dismiss is intuitive), *state indication*, *explanation* (marketing), *feedback* (press scale), or *preventing jarring changes*. "It looks cool" on a frequently seen element is not a valid purpose.
- Frequently seen animations "quickly become annoying and make your interface feel slower."

### 5.2 Easing

- Entering or exiting → **ease-out**. Moving or morphing on screen → **ease-in-out**. Hover or color → **ease**. Constant motion (marquee, progress) → **linear**. Default → ease-out.
- **Never `ease-in` for UI**: it delays the first movement, which is exactly when the user is watching. At the same 200 ms, ease-out *feels* faster than ease-in.
- Built-in CSS curves are too weak, so use custom ones:
  ```css
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* UI enter/exit */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-like sheet (Ionic), used by Vaul */
  ```
  Find curves at easing.dev or easings.co; don't hand-roll them.

### 5.3 Duration

| Element | Duration |
|---|---|
| Button press feedback | 100–160 ms |
| Tooltips, small popovers | 125–200 ms |
| Dropdowns, selects | 150–250 ms |
| Modals, drawers | 200–500 ms |
| Marketing or explanatory | Can be longer |

- **UI animations stay under 300 ms.** A 180 ms select feels more responsive than a 400 ms one. A **faster-spinning spinner makes loading feel faster** at the same load time.
- **Asymmetric timing**: slow where the user is deciding, fast where the system responds. Hold-to-delete fills over 2 s linear, and release snaps back in 200 ms ease-out. Exits are generally faster than enters.

### 5.4 Physicality and component rules

- **Never animate from `scale(0)`**. Start from `scale(0.9–0.97)` with `opacity: 0` ("like a balloon: even deflated it has a visible shape").
- **Press feedback**: `:active { transform: scale(0.97) }` with a `transition: transform 160ms ease-out`, on any pressable element (keep the scale between 0.95 and 0.98).
- **Origin-aware popovers**: `transform-origin: var(--transform-origin)` (Radix/Base UI expose it), so they scale from the trigger. **Modals are exempt** and stay centered.
- **Tooltips**: delay the first one to prevent accidental opening. Once one is open, adjacent tooltips open **instantly with no animation** (`[data-instant] { transition-duration: 0ms }`).
- **Use transitions, not keyframes, for interruptible UI.** Transitions retarget mid-flight; keyframes restart from zero. Toasts added rapidly need transitions.
- **`@starting-style`** for entry animations without JS (fall back to the `data-mounted` pattern).
- **Blur to mask imperfect crossfades**: `filter: blur(2px)` during the transition blends two states into one perceived morph. Keep blur under 20 px (expensive, especially in Safari).
- **Stagger** group entrances at 30–80 ms between items. Stagger is decorative, so **never block interaction while it plays**.
- **Springs** for drag with momentum, "alive" elements, interruptible gestures and decorative mouse-tracking: `{type:"spring", duration:0.5, bounce:0.2}`. Keep bounce subtle (0.1–0.3), and only when the gesture carried momentum. Springs preserve velocity on interruption.
- Apple-style spring table (from `apple-design`): move/reposition uses damping 1.0 and response 0.4; drawer or sheet uses damping 0.8 and response 0.3. **Start most UI critically damped (1.0)**, and add bounce (~0.8) only after a flick.
- **Spatial consistency**: enter and exit along the same path; anchor menus and sheets to their trigger.
- **Cohesion**: motion personality matches the product. Playful products can be bouncier; a professional dashboard is crisp and fast. Sonner is slightly slower and uses `ease` "to feel elegant."

### 5.5 Gestures (Vaul and Sonner lessons)

- **Momentum dismissal**: dismiss if `velocity = |distance| / elapsedMs > ~0.11` even if the distance threshold isn't reached. "A quick flick should be enough."
- **Damping at boundaries / friction instead of hard stops**: over-drag moves progressively less (rubber-banding).
- **Pointer capture** (`setPointerCapture`) once the drag starts. **Multi-touch protection**: ignore extra touch points mid-drag.
- **Track 1:1** during the drag, and animate from the *presentation* (current) value on release. Hand the release velocity to the spring.
- **Never lock out input during a transition.** Use a ~10 px hysteresis before committing to a drag direction.
- **`translateY(100%)`**: percentages are relative to the element itself. This is how Sonner and Vaul hide and position toasts and drawers regardless of height.
- **Sonner principles**: great DX (`<Toaster />` once, then `toast()` anywhere); **good defaults matter more than options**; naming creates identity; **handle edge cases invisibly** (pause timers when the tab is hidden, fill gaps between stacked toasts with pseudo-elements to keep the hover state, capture pointer during drag); build an interactive docs site.

### 5.6 Performance and accessibility of motion

- **Only animate `transform` and `opacity`.** Width, height, top, left, margin and padding trigger layout and paint.
- **No `transition: all`**; list the exact properties.
- Don't drive per-frame child transforms through an inherited CSS variable on the parent (it recalculates styles for every child). Set `element.style.transform` directly, and write to `ref.current.style`, not React state, every frame.
- Framer Motion shorthand `x`/`y`/`scale` run on the main thread and drop frames under load. Use a full `transform` string, CSS or WAAPI for hardware acceleration. CSS animations stay smooth while the main thread is busy.
- Only add `will-change: transform` once you actually see a 1px shift or jank. Virtualize long lists.
- **`prefers-reduced-motion: reduce` means fewer, gentler animations, not zero**: keep opacity and color crossfades that aid comprehension, and remove translation, scale, parallax and overshoot. Also honor `prefers-reduced-transparency` (solidify glass) and `prefers-contrast: more`.
- **Gate hover effects** behind `@media (hover: hover) and (pointer: fine)`, because touch fires sticky hovers.
- **Debugging**: slow the animation to 2–5×, step frame by frame in DevTools, test gestures on real devices, and review with fresh eyes the next day.

### 5.7 Emil's review checklist (agent-ready)

| Issue | Fix |
|---|---|
| `transition: all` | Name the properties: `transition: transform 200ms ease-out` |
| `scale(0)` entry | `scale(0.95)` plus `opacity: 0` |
| `ease-in` on UI | ease-out or a custom curve |
| `transform-origin: center` on a popover | the trigger's origin (modals exempt) |
| Animation on a keyboard action | remove it |
| Duration > 300 ms on UI | 150–250 ms |
| Hover animation without a media query | `(hover: hover) and (pointer: fine)` |
| Keyframes on a rapidly triggered element | CSS transitions |
| Framer `x`/`y` under load | a `transform` string |
| Same enter and exit speed | make the exit faster |
| Everything appears at once | a 30–80 ms stagger |

Emil also requires that reviews be output as a **Before | After | Why** markdown table, which is a useful convention for our review skills.

---

## 6. Design system checklist (designsystemchecklist.com, full)

Src: https://www.designsystemchecklist.com/ ; source repo https://github.com/ardakaracizmeli/design-system-checklist (the English text in `src/translations/en/*.js`, flattened at `$SCRATCH/refs2/dsc.txt`). There are four areas.

### 6.1 Design language

- **Brand**
  - Vision (why you exist, your values)
  - Design principles (philosophical approach, everyday decisions)
  - Tone of voice (how you speak at every journey moment)
  - Terminology (standard terms kept consistent)
  - Brand assets (logo, fonts, icons, illustrations)
- **Guidelines**
  - Accessibility (color, hierarchy, assistive tech)
  - Writing guidelines (house style, grammar, action-oriented language)
  - Microcopy guidelines (standard writing for components, following platform conventions)
  - Terminology
  - Internationalisation (translation edge cases, **bi-directionality / RTL**)

### 6.2 Foundations (tokens)

- **Color**
  - Accessibility: accessible pairings, text/background at **WCAG AA or better**
  - **Semantic colors** as variables (disabled, backgrounds, actions, high-contrast text)
  - **Dark mode** palette following the OS preference
  - Usage guidelines, including how *not* to use colors
- **Layout**
  - **Units** in consistent increments (4-pt system: 4, 8, 12, 16…)
  - **Grid** per mobile, tablet and desktop (columns, gutters, margins)
  - **Breakpoints** (predefined sizes and orientations)
  - **Spacing** (vertical and horizontal rhythm independent of the grid)
- **Typography**
  - **Responsive type scale** (larger on desktop)
  - **Grid relation** (sizes and leading match the grid; text-icon bounding boxes)
  - **Readability** (tracking, leading, line length)
  - **Performance** (font loading, sensible fallbacks; system fonts solve it)
  - Guidelines
- **Elevation**
  - **Shadows** (3–4 elevation levels)
  - A **background color linked to each shadow level**: in light mode these may all be white; in dark mode *the surface color, not the shadow*, communicates z-distance
  - A **z-index system**
- **Motion**
  - **Easing** (standard, accelerated and decelerated functions)
  - **Duration** tokens
  - **Accessibility** (reduced motion: make it less prominent or remove it)
- **Iconography**
  - Accessible name for meaningful icons (aria-label); none for decorative ones
  - One consistent style (outlined *or* filled)
  - **Name icons by purpose, not appearance** ("play", not "triangle")
  - Grid-aligned bounding boxes
  - Keywords for discoverability
  - **Reserved icons** for system actions (navigation, add, delete) that are not reused elsewhere
  - Guidelines

### 6.3 Core components (29), with their checklist states

- **Accordion**: distinct active state icon; flexible content; subtle toggle transition; content announces trigger context.
- **Alert**: role colors with contrast; title support; **icon (for colorblind users)**; related actions; full-width on mobile; correct a11y role.
- **Avatar**: masks any image size; **fallback** (image, icon, initials); 2–3 sizes or more; background color with AA contrast; shapes; groups; a11y label.
- **Badge**: role colors (AA); variants (subtle/faded); sizes; icon; dismissible; empty (dot) state; positioning relative to the host.
- **Button**: role colors (AA); primary and secondary variants; sizes; icon (icon-only buttons **require an a11y label**); hover; active/pressed; **loading (spinner must not change the button's size)**; disabled; correct button-or-link role; **visible focus indicator**.
- **Breadcrumbs**: consistent icons; disabled items; **collapsed state** when overflowing; custom separator.
- **Calendar**: multi-month or vertical display modes; single and **range** selection; month switching; weekday labels; **i18n (date formats, first day of week)**; **arrow-key navigation**; announce selection.
- **Card**: flexible composition; media areas; actions or a whole-card tap target; full-width on mobile; card groups.
- **Carousel**: mouse navigation controls; flexible items; **peek of the next item on mobile** to show it scrolls; touch scroll; responsive; **keyboard navigation**.
- **Checkbox**: linked, clickable label (announced even if hidden); checked; **error state with text, not just color**; disabled (removes the value from submission); **indeterminate**; group; keyboard (native element).
- **Divider**: horizontal and vertical; a role only if non-decorative.
- **Dropdown**: flexible content; open on hover **and on focus**; dynamic positioning (stays in view); mobile adaptation; **focus moves inside and returns to the trigger on close**; keyboard close (Esc or tab out).
- **Icon**: token colors and `currentColor` inheritance; size scale paired with type; interactive icons must be wrapped in a button or link.
- **Image**: aspect-ratio support; fallback; **srcset / density**; alt text if non-decorative.
- **Link**: an icon only alongside text; role colors plus color inheritance; disabled; font inheritance; multiline wrapping; correct role.
- **List**: ordered and unordered; flexible content; announces its role and item count.
- **Loading indicator**: inherits colors; sizes; indeterminate vs time-remaining; **slows under reduced motion**; a11y label.
- **Modal**: flexible content; action area (bottom); **clear close action**; centered or side-sheet positioning; sizes; **focus trap: focus moves to the first focusable element and returns to the previously active element on close**; **Esc closes**; labelled by its title and subtitle (`aria-labelledby`/`aria-describedby`).
- **Pagination**: selected page highlighted and non-interactive; page ranges; items-per-page option; indeterminate page count mode; **full labels for AT ("Page 3 of 10")**; announce the current page.
- **Progress bar**: visible label; sizes; determinate vs indeterminate; a11y label.
- **Radio**: linked label; checked; error (text plus color); disabled; always used as a group; keyboard.
- **Select**: label; error (plus icon); disabled; placeholder (and reset to it); helper text; start icon; prefix (e.g. flags); sizes; a11y label.
- **Skeleton**: sizes and **shapes that match real components to avoid layout shift**; composable; reduced motion.
- **Switch**: label; checked (**applies immediately**); disabled; keyboard; a11y label.
- **Tabs**: flexible content; variants (pill or underline); always one selected; disabled; icons; equal-width option; **arrow keys, plus Home and End**.
- **Text area / Text field**: label (click focuses the field); error; disabled; **placeholder never replaces the label**; helper text; icon; prefix and suffix (e.g. card brand); sizes; a11y label.
- **Toast**: flexible content; role colors; icon; **timeout long enough, or a close button**; stacking; contextual action (e.g. **Undo**); **focusable actions, and the timeout pauses while focus is inside**; reduced motion.
- **Tooltip**: flips position to stay in the viewport; **open delay**; **opens on focus, not only hover**.

### 6.4 Maintenance

- **Documentation**: design-system principles; getting started; design and dev best practices; **component anatomy**; component properties aligned between design and code; composition examples; sandbox app; browser and OS support policy; **predictable release cycle for breaking majors**.
- **Local libraries**: when to build locally vs request from the system; horizontal vs vertical libraries; minimum quality bar; release-cycle alignment.
- **Team processes**: decision-making log; roadmap (time-box support); stakeholder map; **analytics on adoption**; support rotation ("shifts"); SLA for requests.
- **Community support**: channels per platform; issue and feature templates; regular update cadence; open office hours.
- **Contribution**: house rules (the system moves slower than product teams); contribution guidelines; feature-proposal template (cross-platform); recognize contributors.

**Rule (agent):** when generating a component library, check each component against its checklist row above. At minimum ship these states: default, hover (gated by media query), focus-visible, active, disabled, loading, error, empty, plus RTL and dark mode.

---

## 7. Conversion and checkout UX (Baymard Institute, growth.design)

### 7.1 Baymard: numbers (from search summaries of Baymard's pages)

- Average documented **cart abandonment is 70.19%** (Baymard's multi-year meta-average). Src: https://baymard.com/lists/cart-abandonment-rate
- Abandonment reasons (US, excluding "just browsing"):
  - **extra costs too high (shipping, tax, fees): ~40%+, the top reason**
  - delivery too slow: ~20%
  - didn't trust the site with card info: ~19%
  - **site wanted me to create an account: ~18%**
  - checkout too long or complicated: ~17%
  - Other commonly listed reasons [K]: couldn't see the total cost up front, website errors or crashes, unsatisfactory returns policy, not enough payment methods, declined card.
- **The average checkout has 5.1 steps and 11.3 form fields.** An ideal checkout needs only **12–14 form elements (7–8 fields)**. Src: https://baymard.com/blog/checkout-flow-average-form-fields
- **Large sites can gain ~35% conversion from checkout design fixes alone.** Src: https://baymard.com/research/checkout-usability ; https://baymard.com/blog/checkout-flow-ux-optimization

### 7.2 Baymard: design rules

Some are confirmed by search; those marked [K] are well-known Baymard findings.
- **Show the total cost (including shipping and taxes) early**, in the cart, with estimated delivery. Never surprise at the last step.
- **Guest checkout prominently**, ideally the first or most prominent option. Offer account creation *after* purchase on the confirmation page, reusing the data already entered (just add a password) [K].
- **Minimize fields**: **default billing address = shipping address** (checkbox checked); **collapse "Address Line 2" behind a link**; **a single "Full name" field** instead of first and last; auto-detect city and state from postcode [K]; hide the coupon field behind a link to avoid coupon-hunting abandonment [K].
- **Mark both required and optional fields.**
- **Inline validation**: on blur, remove errors when corrected, positive checkmarks (§3.1).
- **Preserve all data on errors** and auto-scroll to the error.
- **Adaptive, specific error messages** [K]: different copy per failure type (e.g. "The card number is missing a digit" vs a generic "Invalid card").
- **Card fields** [K]: accept spaces and auto-format into groups of 4; auto-detect card type (don't ask for it); keep the card field order matching the physical card; use numeric keyboards; visually "enclose" the payment fields to raise *perceived* security (trust matters, since ~19% abandon over it).
- **Delivery options as dates** ("Arrives Thu, Oct 8") rather than "3–5 business days" [K].
- **Enclosed checkout** [K]: remove the main navigation and distractions during checkout, but keep reassurance (returns, support).
- **No CAPTCHAs** in checkout [K]. Don't require typing an email twice [K].
- **Linear, clearly labelled steps** with a progress indicator (goal-gradient). Keep the order summary visible (working memory).
- **Mobile**: correct keyboard types, `autocomplete` everywhere, express wallets (Apple Pay / Google Pay / Shop Pay / passkeys) above the form, large tap targets, and no dropdowns for short option sets.

### 7.3 growth.design (psychology case studies)

Src: https://growth.design/psychology ; https://growth.design/case-studies
- "**106 Cognitive Biases & Principles That Affect Your UX**", organized into 4 problem categories (after Buster Benson's cognitive-bias codex): **Information** (too much, so users filter), **Meaning** (not enough, so users fill gaps), **Time** (users take shortcuts and jump to conclusions), and **Memory** (users remember selectively). Examples it covers: Hick's law, priming, cognitive load, anchoring, nudge, progressive disclosure, Fitts's law, banner blindness, visual anchors, Von Restorff, aesthetic-usability, decoy effect, default bias, endowment/endowed progress, loss aversion, social proof, scarcity, reciprocity, commitment and consistency, sunk cost, IKEA effect, labor illusion, peak-end, Zeigarnik, goal gradient, variable rewards, framing, curiosity gap, aha moment, delighters, familiarity bias [K for the non-searched names].
- **Case-study lessons** (comic-format breakdowns: Duolingo, Trello, Tinder, Too Good To Go, Letterboxd, Airbnb, Uber, Tesla, Adobe, Spotify, Apple…):
  - **Duolingo**: "gradual engagement". Let users finish the first lesson, earn XP and feel progress within minutes, **before** asking them to create a profile. Onboarding is simplified and easier to boost activation. Src: https://growth.design/case-studies/duolingo-user-retention
  - **Trello**: onboard by *doing*. The first board teaches via its own cards (learn-by-doing in context). Src: https://growth.design/case-studies/trello-user-onboarding
  - **Aha moments**: define activation concretely and design the shortest path to the first moment of value. Persona- or goal-based onboarding beats generic onboarding. Src: https://growth.design/case-studies/too-good-to-go-onboarding
  - **Letterboxd**: product-market fit via clear Jobs-To-Be-Done.
- **Rule (agent):** value before signup; ask for permissions and account creation only in context; empty states as onboarding; progress and endowed-progress indicators. Use these levers only in the user's interest (§4).

### 7.4 YC Requests for Startups (context only)

Src: https://www.ycombinator.com/rfs
- **Fall 2026** (13): The Primer (adaptive tutor for kids); Future of American Defense; **A Cloud for Small Software**; **Multiplayer AI** (a shared live agent session a team can watch, redirect and hand off); Compute at Sea; AI consumer products for 1B people; AI for the aging population; new OSes for the physical world; crypto; data for the real world; **Proving You're Human** (privacy-preserving personhood); AI-native compliance infrastructure; **Self-Maintaining APIs** (an agent opens fix PRs when a provider ships breaking changes).
- **Summer 2026** (15): AI for low-pesticide agriculture; AI-native service companies; AI personalized medicine; **Company Brain**; counter-swarm defense; **Dynamic Software Interfaces**; electronics in space; hardware supply chain; industrial capabilities in space; inference chips for agent workflows; SaaS challengers; **Software for Agents**; selling to huge companies; semiconductor supply chain 2.0; the AI OS for companies.
- **Relevance for our skills:** the UX frontier is agent-facing and generative UI ("dynamic interfaces", "software for agents", "multiplayer AI"). Skills should cover agent-status visibility (heuristic #1 for long-running agents), interruptibility and handoff (user control), and human verification without dark patterns.

---

## 8. Resilience and complex systems (Richard I. Cook, "How Complex Systems Fail", 1998/2000)

Src: https://how.complexsystems.fail/ (the canonical web edition); PDF at https://www.adaptivecapacitylabs.com/HowComplexSystemsFail.pdf. Titles are Cook's; the explanations are close paraphrases [K], and the numbering was cross-checked against the adamchainz talk.

1. **Complex systems are intrinsically hazardous systems.** Hazards are part of what the system *is* (transport, healthcare, power, and production software at scale). Defenses exist because the hazards are inherent. *Rule:* assume failure is normal, and design for failure rather than for perfect operation.
2. **Complex systems are heavily and successfully defended against failure.** Multiple layers of defense (technical, human, organizational: backups, training, policies). *Rule:* defense in depth, with redundancy, validation at every boundary, timeouts, retries with backoff, circuit breakers and rate limits.
3. **Catastrophe requires multiple failures; single point failures are not enough.** Overt failure happens only when small, individually innocuous failures line up (the Swiss-cheese model). *Rule:* remove single points of failure, and treat "near misses" as data.
4. **Complex systems contain changing mixtures of failures latent within them.** It is impossible to eliminate all latent flaws, and they change as technology and organization change. *Rule:* continuous testing, chaos and game days, dependency audits.
5. **Complex systems run in degraded mode.** The system is always partly broken and keeps working because of redundancy and people. *Rule:* design **graceful degradation** (partial results, stale-while-revalidate, read-only mode, feature flags that disable non-critical features). In the UI, show partial and degraded states honestly (§3.3).
6. **Catastrophe is always just around the corner.** The potential for catastrophe is a hallmark of complex systems and can't be designed away. *Rule:* keep runbooks, kill switches and rollback ready at all times.
7. **Post-accident attribution to a "root cause" is fundamentally wrong.** Failures need multiple contributors, so there is no single isolated cause; blaming a root cause reflects social and cultural needs, not the technical nature of failure. *Rule:* postmortems list *contributing factors*, not a root cause.
8. **Hindsight biases post-accident assessments of human performance.** Knowing the outcome makes the path to it look obvious and makes practitioners look careless. *Rule:* **blameless postmortems** that reconstruct what people knew *at the time*.
9. **Human operators have dual roles: as producers and as defenders against failure.** They run the system for output *and* protect against accidents; outsiders see only one role at a time. *Rule:* tooling should support both roles (safe defaults, dry-run modes, previews of destructive changes).
10. **All practitioner actions are gambles.** Actions happen amid uncertainty; after an accident the gamble looks reckless, and after a success it looks wise. *Rule:* make the risk visible at decision time (e.g. deploy UIs show blast radius, affected users, and a canary).
11. **Actions at the sharp end resolve all ambiguity.** Organizations are ambiguous about production-vs-safety trade-offs; the practitioner at the sharp end resolves it in the moment. *Rule:* make policies explicit (e.g. "rollback first, debug later") so operators aren't left to guess.
12. **Human practitioners are the adaptable element of complex systems.** People adapt continuously: restructuring, concentrating resources, arranging fallback paths, detecting early changes. *Rule:* give operators observability and manual overrides, and never fully remove human-in-the-loop controls for critical paths.
13. **Human expertise in complex systems is constantly changing.** Expertise must be continually developed and replaced (turnover, new technology). *Rule:* documentation, onboarding, runbooks and training on real (sandboxed) failures.
14. **Change introduces new forms of failure.** Even changes that reduce frequent failures can create new, rare, high-consequence ones, and new technology removes the frequent failures while adding new modes. *Rule:* incremental rollouts, feature flags, canaries, reversible migrations, and **treat every change as a risk.**
15. **Views of "cause" limit the effectiveness of defenses against future events.** Post-accident remedies aimed at "human error" (more rules, more checklists) often increase complexity and coupling. *Rule:* prefer systemic fixes (make the wrong thing hard, the right thing easy) over "be more careful" policies.
16. **Safety is a characteristic of systems and not of their components.** Safety is an emergent property; you can't buy or manufacture it separately. *Rule:* test end-to-end, and reason about interactions, not just unit correctness.
17. **People continuously create safety.** Failure-free operation is the result of people keeping the system within tolerable limits, mostly through routine adjustments. *Rule:* value and study the "normal work" that prevents incidents, not just the incidents.
18. **Failure-free operations require experience with failure.** Recognizing hazards and operating near the edge requires experience of failure. *Rule:* game days, chaos engineering, incident drills and sharing near-miss reports.

**UI and product implications (for our design skills):** build error boundaries per region (one failed widget must not blank the page); show offline, degraded and stale indicators; queue actions offline and retry them; make idempotent submit buttons (disable double-submit, and use idempotency keys server-side); offer undo for everything reversible; give admins previews and a dry run before bulk or destructive operations.

---

## 9. Accessibility (WCAG 2.2 AA; Apple and Google essentials)

Src: https://www.w3.org/TR/WCAG22/ (W3C Recommendation, Oct 2023; 87 success criteria). **Target Level AA**, the legal baseline in most jurisdictions (EU European Accessibility Act, in force since June 2025; ADA case law; Section 508).

### 9.1 New in WCAG 2.2 (A/AA) (confirmed by search)

- **2.4.11 Focus Not Obscured (Minimum), AA**: a focused component must not be *entirely* hidden by author content (sticky headers or footers, cookie banners, chat widgets). *Rule:* `scroll-padding-top` equal to the sticky header height, and don't cover the viewport bottom with a persistent banner.
- **2.5.7 Dragging Movements, AA**: anything done by dragging must also be possible with a single pointer without dragging (unless dragging is essential). *Rule:* sortable lists get up/down buttons or a "Move to…" menu; sliders accept a tap on the track plus arrow keys; kanban cards get a "Move to column" menu.
- **2.5.8 Target Size (Minimum), AA**: targets are **at least 24×24 CSS px**, or have enough spacing (a 24 px circle centered on each target doesn't intersect another). Exceptions: inline links in text, equivalent controls, user-agent controls, and essential presentation.
- **3.2.6 Consistent Help, A**: help mechanisms (chat, contact, FAQ) appear in the same relative order across pages.
- **3.3.7 Redundant Entry, A**: don't ask for the same information twice in a process. Auto-populate it or let the user select it ("Same as shipping").
- **3.3.8 Accessible Authentication (Minimum), AA**: no cognitive function test (remembering a password, solving a puzzle, transcribing) unless there's an alternative or assistance. *Rule:* **allow paste and password managers** (never block paste), support `autocomplete="current-password"`/`one-time-code`, passkeys and magic links. Object-recognition CAPTCHAs are allowed at AA but discouraged.
- AAA additions (nice to have): 2.4.12 Focus Not Obscured (Enhanced), **2.4.13 Focus Appearance** (a focus indicator at least 2 CSS px thick with 3:1 contrast change), and 3.3.9 Accessible Authentication (Enhanced). **4.1.1 Parsing was removed** in 2.2.

### 9.2 Key long-standing AA criteria that agents most often break [K, canonical]

- **1.1.1 Non-text content**: alt text for meaningful images; `alt=""` for decorative ones; icon-only buttons get `aria-label`.
- **1.3.1 Info and relationships**: semantic HTML (headings in order, lists, `<table>` with `<th scope>`, `<label for>`, fieldset and legend, landmarks `<header> <nav> <main> <footer>`).
- **1.3.5 Identify input purpose**: `autocomplete` tokens on personal-data fields.
- **1.4.1 Use of color**: color is never the only signal (errors get an icon and text; links in text get an underline).
- **1.4.3 Contrast (Minimum)**: **4.5:1** for text, **3:1** for large text (≥ 24 px regular or ≥ 18.66 px bold).
- **1.4.4 Resize text**: 200% zoom without loss (use rem units; no fixed-height text containers).
- **1.4.10 Reflow**: no 2-D scrolling at **320 CSS px** width (400% zoom). Tables and code may scroll within their own container.
- **1.4.11 Non-text contrast**: **3:1** for UI component boundaries (input borders, focus rings, icons that carry meaning, chart elements).
- **1.4.12 Text spacing**: the layout survives line-height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em.
- **1.4.13 Content on hover or focus**: tooltips and popovers are dismissible (Esc), hoverable (the pointer can move onto them) and persistent.
- **2.1.1 Keyboard / 2.1.2 No keyboard trap**: everything is operable by keyboard; modals trap focus *intentionally*, but Esc releases it.
- **2.2.1 Timing adjustable**: warn before session timeouts and allow extending them. **2.2.2 Pause, Stop, Hide**: anything that auto-moves for more than 5 s (carousels, marquees) can be paused.
- **2.3.1 Three flashes**: nothing flashes more than 3 times per second.
- **2.4.1 Bypass blocks** (a skip link); **2.4.2 Page titled** (unique `<title>` per route, updated on SPA navigation); **2.4.3 Focus order** (no positive tabindex); **2.4.4 Link purpose** (no bare "click here"); **2.4.6 Headings and labels**; **2.4.7 Focus visible** (never `outline: none` without a `:focus-visible` replacement).
- **2.5.1 Pointer gestures**: multipoint and path gestures have single-pointer alternatives. **2.5.2 Pointer cancellation**: activate on up-event, so the user can slide off to cancel. **2.5.3 Label in name**: the accessible name contains the visible label text. **2.5.4 Motion actuation**: shake or tilt features have UI alternatives and can be disabled.
- **3.1.1 Language of page**: `<html lang>`. **3.2.1/3.2.2 On focus / on input**: no context change on focus or on value change without warning (e.g. a select that navigates immediately).
- **3.3.1 Error identification / 3.3.3 Error suggestion / 3.3.2 Labels or instructions / 3.3.4 Error prevention** (legal and financial data can be reversed, checked or confirmed).
- **4.1.2 Name, role, value**: custom widgets follow the ARIA Authoring Practices (APG). **First rule of ARIA: use native HTML elements** (`<button>`, `<dialog>`, `<details>`, `<select>`) before ARIA. **4.1.3 Status messages**: toasts, "Saved" and result counts are announced via `role="status"`/`aria-live` without moving focus.

### 9.3 Platform touch-target and a11y essentials

- **Apple HIG**: minimum hit target **44×44 pt**. Support **Dynamic Type** (scale the layout with text, spacing in relative units), VoiceOver labels, traits and hints, Reduce Motion, Reduce Transparency and Increase Contrast, and system fonts (SF with optical sizes). Src: https://developer.apple.com/design/human-interface-guidelines/accessibility
- **Google Material**: minimum touch target **48×48 dp** (roughly 9 mm), with **≥ 8 dp spacing** between targets. The visual icon can be 24 dp inside a 48 dp target. Src: https://m3.material.io/foundations/designing/structure (Material accessibility, "touch targets")
- **Web translation**: use a ≥ 44 px hit area on touch (`@media (pointer: coarse)`) and never under 24 px (WCAG 2.5.8). Enlarge hit areas invisibly with padding or `::after { inset: -8px }`, and keep adjacent targets at least 8 px apart.
- **Focus management in SPAs**: on route change, move focus to the `<h1>` or main region and announce the new page title. On modal open, focus the first focusable element (or the dialog title); on close, restore focus to the trigger (see the design-system checklist).
- **Motion preferences**: `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast` (§5.6).
- **Test tooling**: axe-core / eslint-plugin-jsx-a11y in CI, keyboard-only walkthroughs, VoiceOver and TalkBack smoke tests, a 200% and 400% zoom check, and Rams-style automated PR review.

---

## 10. Mobile and touch UX (a cross-cutting addendum for the 2026 mobile-design skill)

Sources: Emil Kowalski `mobile-native` skill (https://github.com/emilkowalski/skill/tree/main/skills/mobile-native); NN/g mobile research (https://www.nngroup.com/articles/mobile-ux-study-guide/); https://www.nngroup.com/articles/hamburger-menus/

- **Thumb zone**: most people use a phone one-handed with the thumb, so primary actions and navigation go at the bottom (tab bar, bottom sheets, bottom-anchored CTAs). Destructive actions stay out of easy-tap zones.
- **Visible navigation** beats the hamburger: 4–5 top destinations go in a bottom tab bar, with a "More" tab for the rest (combo navigation).
- **Hard rules** (Emil):
  1. every fix ships with its reason
  2. **use media queries, not device sniffing** (`(hover: hover)`, `(pointer: fine|coarse)`, `env()`, `dvh`)
  3. **touch and mouse are not exclusive** (iPad with trackpad)
  4. **never disable zoom** (`user-scalable=no` and `maximum-scale=1` are a11y failures); fix the input font size instead
  5. **test on real hardware**, because emulation misses sticky hover, tap delay, rubber-banding, safe areas and the keyboard
- **Symptom → fix table:**
  - Sticky hover after a tap → wrap hover rules in `@media (hover: hover) and (pointer: fine)`, and give touch users `:active` feedback instead.
  - Gray or blue tap flash → `html { -webkit-tap-highlight-color: transparent }`, plus your own `:active` states.
  - Wrong height → `100dvh` for app shells and bottom-pinned UI; `100svh` for heroes (no scroll layout shift); avoid `100vh`/`lvh`.
  - Input zoom on iOS → input font-size ≥ 16 px (use `@media (pointer: coarse)` if desktop needs smaller).
  - Laggy tap → `touch-action: manipulation`, and give feedback on press (`:active` / `pointerdown`), not on `click`. Press feedback takes 100–160 ms ease-out.
  - Pull-to-refresh or scroll chaining → `html, body { overscroll-behavior: none }` (for app-like UIs), with `overscroll-behavior: contain` on inner scrollers. Never `touchmove` + `preventDefault`.
  - Notch or home indicator → `viewport-fit=cover` plus `padding: env(safe-area-inset-*)` on fixed headers, tab bars, toasts and sheets.
  - Long-press selecting button text → `user-select: none; -webkit-touch-callout: none` on controls only, **never on body text**.
  - Carousel fights vertical scroll → `touch-action: pan-y` on the horizontal track, or native `scroll-snap-type: x mandatory`.
  - Status bar mismatch → `<meta name="theme-color">` per `prefers-color-scheme`, plus `<meta name="color-scheme" content="light dark">`.
  - Keyboard covering inputs → the `interactive-widget=resizes-content` viewport key (Android).
- **Mobile baseline to ship before the first component:**
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">
  ```
  ```css
  html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; overscroll-behavior: none; }
  input, textarea, select { font-size: 16px; }
  button, a, [role="button"] { touch-action: manipulation; user-select: none; -webkit-user-select: none; }
  @media (hover: hover) and (pointer: fine) { /* all :hover rules */ }
  ```
- **Apple-feel interaction principles** (Emil `apple-design`):
  - respond on pointer-down
  - track 1:1 during gestures
  - **interruptibility is the most important principle** (never lock input during a transition; animate from the current presented value)
  - springs over durations, with velocity handoff at release and momentum projection
  - symmetric enter and exit paths, and hints in the direction of the gesture
  - rubber-band boundaries
  - translucent materials to convey hierarchy (`backdrop-filter`); never stack light glass on light glass
  - multimodal feedback (motion, sound and haptics on the same frame, used sparingly)
  - size-specific tracking (negative for large display text, slightly positive for small text) and leading inversely proportional to size
  - respect the user's text-size setting

---

## 11. Condensed "agent rules" cheat sheet (to seed SKILL.md files)

1. **States:** every data view implements empty, loading (skeleton), error (with retry), partial and ideal states. Every control implements default, hover (gated), focus-visible, active, disabled and loading.
2. **Feedback:** acknowledge input in under 100 ms (`:active`), show the result or progress in under 400 ms, use optimistic UI where safe, delay spinners about 300 ms, and show percent-done beyond about 10 s.
3. **One primary action per view.** A recommended default for every choice. Progressive disclosure for advanced options, behind a visible affordance.
4. **Forms:** single column; labels above; no placeholder-as-label; mark required *and* optional; validate on blur, re-validate on input after an error; preserve input; focus the first error; `autocomplete`, `inputmode` and `type`; font-size ≥ 16 px; allow paste; no CAPTCHA in core flows; don't ask for the same data twice.
5. **Errors:** say what happened, why and how to fix it, next to the source, with icon plus color plus text, in plain language, with no blame and an actionable fix.
6. **Destructive actions:** undo first; confirm only if irreversible, with specific verbs; for severe actions, type-to-confirm.
7. **Motion:** purpose first; nothing on keyboard or 100×/day actions; ease-out with custom curves; under 300 ms; transform and opacity only; no `transition: all`; never from `scale(0)`; origin-aware popovers; honor reduced motion by crossfading instead of removing everything.
8. **Touch:** targets of 44 pt / 48 dp (never under 24 px) spaced 8 px or more; primary actions in the thumb zone; visible bottom navigation for 4–5 destinations; gate hover with media queries; safe-area insets; `dvh`/`svh`; test on hardware.
9. **Accessibility:** WCAG 2.2 AA (4.5:1 text, 3:1 UI, visible focus not obscured, keyboard everything, single-pointer alternatives to drag, semantic HTML first, live regions for status).
10. **Conventions (Jakob's Law):** standard placement and patterns. Carry context for the user (working memory). Put the most important items first and last (serial position).
11. **Humane:** no dark patterns (confirmshaming, sneaking, hidden costs, roach motel, forced registration, preselected consent, fake urgency or social proof); all-in pricing early; easy cancel and delete; "All caught up" or "Load more" rather than endless feeds; notifications opt-in, contextual and configurable.
12. **Checkout:** guest first; total cost early; billing = shipping by default; Address Line 2 and coupon collapsed; single full-name field; card auto-format and type detection; express wallets; enclosed checkout with a visible summary.
13. **Resilience:** design for degraded mode (error boundaries per widget, offline and stale indicators, idempotent submits, retries); blameless contributing-factor postmortems; every change is a risk (flags, canaries, reversible migrations).
14. **Design system:** tokens for color (semantic plus dark), a 4-pt spacing scale, a type scale, 3–4 elevation levels (surface color in dark mode), z-index, motion (easing plus duration) and icons (named by purpose). Components meet the §6.3 checklist.
15. **Review output:** severity-grouped findings (Critical, Serious, Moderate) with file:line, a Before | After | Why table, and a WCAG or law citation for each finding.

---

## Source index

- Laws of UX: https://lawsofux.com/ (per law: `/aesthetic-usability-effect/ /choice-overload/ /chunking/ /cognitive-bias/ /cognitive-load/ /doherty-threshold/ /fittss-law/ /flow/ /goal-gradient-effect/ /hicks-law/ /jakobs-law/ /law-of-common-region/ /law-of-pragnanz/ /law-of-proximity/ /law-of-similarity/ /law-of-uniform-connectedness/ /mental-model/ /millers-law/ /occams-razor/ /paradox-of-the-active-user/ /pareto-principle/ /parkinsons-law/ /peak-end-rule/ /postels-law/ /selective-attention/ /serial-position-effect/ /teslers-law/ /von-restorff-effect/ /working-memory/ /zeigarnik-effect/`); mirror text at https://github.com/fmhall/software-laws/tree/master/ux-laws/laws
- NN/g:
  - https://www.nngroup.com/articles/ten-usability-heuristics/
  - https://www.nngroup.com/articles/error-message-guidelines/
  - https://www.nngroup.com/articles/error-messages-scoring-rubric/
  - https://www.nngroup.com/articles/empty-state-interface-design/
  - https://www.nngroup.com/articles/progressive-disclosure/
  - https://www.nngroup.com/articles/web-form-design/
  - https://www.nngroup.com/articles/form-design-placeholders/
  - https://www.nngroup.com/articles/required-fields/
  - https://www.nngroup.com/articles/response-times-3-important-limits/
  - https://www.nngroup.com/articles/hamburger-menus/
  - https://www.nngroup.com/articles/button-states-communicate-interaction/
  - https://www.nngroup.com/articles/usability-heuristics-complex-applications/
- Humane by Design: https://humanebydesign.com/principles (with `/transparent /resilient /empowering /finite /inclusive /intentional /respectful`)
- principles.design: https://principles.design/ ; lessons.design: https://lessons.design/ ; Web Field Manual: https://webfieldmanual.com/design
- Rams: https://www.rams.ai/ ; https://github.com/rams-design/rams-plugin
- Cook: https://how.complexsystems.fail/ ; https://www.adaptivecapacitylabs.com/HowComplexSystemsFail.pdf
- growth.design: https://growth.design/psychology ; https://growth.design/case-studies
- Baymard:
  - https://baymard.com/lists/cart-abandonment-rate
  - https://baymard.com/research/checkout-usability
  - https://baymard.com/blog/checkout-flow-average-form-fields
  - https://baymard.com/blog/inline-form-validation
  - https://baymard.com/blog/address-line-2
  - https://baymard.com/blog/required-optional-form-fields
  - https://baymard.com/blog/checkout-flow-ux-optimization
- Design System Checklist: https://www.designsystemchecklist.com/ ; https://github.com/ardakaracizmeli/design-system-checklist
- Emil Kowalski:
  - https://emilkowal.ski/ui/you-dont-need-animations
  - https://emilkowal.ski/ui/7-practical-animation-tips
  - https://emilkowal.ski/ui/agents-with-taste
  - https://github.com/emilkowalski/skill
  - Sonner: https://sonner.emilkowal.ski ; Vaul: https://vaul.emilkowal.ski [K URLs]
- YC RFS: https://www.ycombinator.com/rfs
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- Apple HIG accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility ; Material 3: https://m3.material.io/
