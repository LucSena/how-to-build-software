# Laws of UX: all 30, as decisions

The 30 laws collected by Jon Yablonski at lawsofux.com, grouped by what they govern. Each entry gives the idea in one line, what to do in UI, and the common misuse. Definitions are paraphrased.

## Contents
- Perception and grouping (Gestalt): proximity, common region, similarity, uniform connectedness, Prägnanz
- Decisions and complexity: Hick, choice overload, cognitive load, Tesler, Occam, Pareto, Postel
- Memory: Miller, working memory, chunking, serial position, Zeigarnik, peak-end
- Expectations: Jakob, mental model, cognitive bias, paradox of the active user
- Attention and motor: Fitts, Doherty, selective attention, Von Restorff
- Motivation and time: goal-gradient, flow, Parkinson
- Aesthetics: aesthetic-usability effect

---

## Perception and grouping (Gestalt)

### Law of Proximity
**Idea.** Things near each other are read as a group.
**Do.** Use spacing to show structure: small gap inside a group (label→input 4–8 px), larger between items (16–24 px), largest between sections (32–48 px). Keep helper and error text closer to its own field than to the next one.
**Misuse.** Uniform spacing everywhere, so nothing groups; a label equidistant between two inputs.

### Law of Common Region
**Idea.** Elements sharing a bounded area are read as a group.
**Do.** Group related controls in a card, panel, or `<fieldset>` with a subtle background or 1 px border. The fieldset/legend gives the same grouping to screen readers.
**Misuse.** Card inside card inside card. More than two container levels is noise; use spacing and headings instead.

### Law of Similarity
**Idea.** Elements that look alike are read as related.
**Do.** Same function, same appearance: one link style, one destructive-button variant, one style for selected state. Make links visibly different from body text.
**Misuse.** Styling non-interactive text (headings, labels) like links, or links like plain text.

### Law of Uniform Connectedness
**Idea.** Visually connected elements (lines, shared frames, arrows) read as more related than unconnected ones.
**Do.** Connect steps in steppers and timelines; visually join a tab to its panel; give popovers an arrow or origin toward their trigger.
**Misuse.** Decorative connectors between unrelated items, implying relationships that do not exist.

### Law of Prägnanz
**Idea.** People interpret complex shapes as the simplest possible form.
**Do.** Simple geometric shapes, consistent icon strokes, few clear alignment lines.
**Misuse.** Ornament that competes with content; ambiguous icons that need a legend.

## Decisions and complexity

### Hick's Law
**Idea.** Decision time rises with the number and complexity of options.
**Do.** One primary action per view; recommended option first or badged; rare actions in an overflow menu; break complex tasks into steps.
**Misuse.** Oversimplifying into abstraction: hiding labels, merging distinct actions into one ambiguous button. Hick's law does not apply to well-practiced choices (experts scanning a known menu), so do not hide expert tools to satisfy it.

### Choice Overload
**Idea.** Too many options overwhelm and reduce satisfaction with the choice.
**Do.** Narrow first (search, filters, categories, a "best for most" default). For comparisons, show options side by side with the same attributes aligned row by row. 3 plans, 4 at most.
**Misuse.** Removing options users actually need instead of structuring them.

### Cognitive Load
**Idea.** Mental resources needed to understand and use an interface; intrinsic (the task) vs. extraneous (the design).
**Do.** Cut extraneous load: remove decoration, duplicates, and jargon; use defaults, autofill, and progressive disclosure.
**Misuse.** Hiding intrinsic complexity the user must actually decide about (e.g. burying fees).

### Tesler's Law (conservation of complexity)
**Idea.** Every system has complexity that cannot be removed; either the system or the user carries it.
**Do.** Push it onto the system: infer, detect, remember, and parse. Accept "tomorrow 3pm" and turn it into a date.
**Misuse.** "Simplifying" by removing a needed capability, which moves the complexity to workarounds outside your product.

### Occam's Razor
**Idea.** Prefer the solution with the fewest assumptions; a design is complete when nothing more can be removed.
**Do.** Before adding an element, ask what breaks without it. Delete duplicate links, redundant buttons, and decorative widgets.
**Misuse.** Removing affordances and labels that carry meaning.

### Pareto Principle
**Idea.** Roughly 80% of effects come from 20% of causes.
**Do.** Identify the 2–3 tasks that make up most use of a screen and make them frictionless; spend polish on the most-used flows first.
**Misuse.** Deleting the "20% features" that a smaller group depends on; move them to secondary layers instead.

### Postel's Law (robustness principle)
**Idea.** Be liberal in what you accept, conservative in what you send.
**Do.** Trim whitespace; accept phone and card numbers with spaces or dashes; accept several date formats; case-insensitive emails; normalize server-side; display one canonical format.
**Misuse.** Accepting input silently that you then misinterpret. Liberal acceptance needs clear feedback on how it was understood ("Wed 8 Oct, 15:00").

## Memory

### Miller's Law
**Idea.** Working memory holds a small number of items (the famous "7 ± 2").
**Do.** Chunk content into meaningful groups and label them.
**Misuse.** Using "7" as a hard cap on nav items, options, or tabs. The number describes memory, not scanning a visible list.

### Working Memory
**Idea.** A small, fast-fading store (roughly 4–7 chunks, fading in 20–30 s) used while doing a task.
**Do.** Keep context visible: order summary through checkout, selected filters as chips, persistent labels, visited-link styling, breadcrumbs. Auto-fill codes instead of asking users to copy them.
**Misuse.** Multi-step flows that ask users to recall earlier values; placeholder-only labels that vanish while typing.

### Chunking
**Idea.** Breaking information into meaningful groups makes it easier to process.
**Do.** Group long forms into titled sections; format numbers in groups (IBAN, card, phone); use headings, short paragraphs, and lists.
**Misuse.** Chunking by arbitrary size rather than meaning.

### Serial Position Effect
**Idea.** People best remember the first and last items in a series.
**Do.** Put the most important nav items at the ends (Home first, Account last); identifier columns leftmost and actions rightmost in tables; the key pricing row first and the guarantee last next to the CTA.
**Misuse.** Burying the one critical option mid-list.

### Zeigarnik Effect
**Idea.** Unfinished tasks are remembered better than finished ones.
**Do.** Visible progress and clear "what's left" (setup checklist 3 of 5, draft indicators, a partial card at the scroll edge that signals more content).
**Misuse.** Inventing incomplete tasks or fake "profile 60% complete" meters to nag users back.

### Peak-End Rule
**Idea.** Experiences are judged by their most intense moment and their end, not the average.
**Do.** Design the success moment (clear confirmation, next step), the last step of onboarding or checkout, and error recovery. Negative moments are remembered more vividly than positive ones.
**Misuse.** Confetti on trivial actions; a polished ending that hides a painful middle.

## Expectations

### Jakob's Law
**Idea.** Users spend most of their time on other products and expect yours to work the same way.
**Do.** Use established patterns and placements. When redesigning something heavily used, let users keep the familiar version for a while and migrate gradually.
**Misuse.** Using "convention" to justify copying a competitor's bad pattern, or to block improvements users clearly want.

### Mental Model
**Idea.** Users act on a compressed model of how they believe a system works.
**Do.** Match it: domain language, familiar object behaviors (spreadsheet-like tables, Trello-like boards, file-like documents). Find the model through research, not guesswork.
**Misuse.** Exposing the implementation model (tables, jobs, sync states) as the user model.

### Cognitive Bias
**Idea.** Systematic errors in thinking shape perception and decisions.
**Do.** Use knowledge of biases to prevent user errors (defaults, confirmations for real risk, clear framing). Watch for confirmation bias in your own reviews.
**Misuse.** Exploiting biases against the user's interest: this is the definition of a dark pattern (see `humane-design.md`).

### Paradox of the Active User
**Idea.** Users never read manuals; they start using the software immediately.
**Do.** Put help inside the flow: empty states that teach, inline hints, sample data, contextual tips triggered by behavior.
**Misuse.** Mandatory upfront tours; a docs link as the only help.

## Attention and motor

### Fitts's Law
**Idea.** Time to acquire a target depends on its size and distance.
**Do.** Large, close primary targets; hit areas ≥ 24×24 CSS px (WCAG 2.5.8 minimum), 44×44 pt on iOS, 48×48 dp on Android, ~8 px between adjacent targets. Put mobile primary actions in the thumb zone. Screen edges and corners are effectively infinite targets for mouse users.
**Misuse.** Big, easy targets for destructive actions placed next to frequent ones.

### Doherty Threshold
**Idea.** Productivity soars when system and user interact under ~400 ms, so neither waits on the other.
**Do.** Instant pressed feedback, optimistic updates for likely-successful actions, skeletons shaped like content. Progress indicators make waits tolerable even when imprecise.
**Misuse.** Fake progress bars or artificial delays that misrepresent real work. (An honest short "checking…" state for a security-relevant action is fine.)

### Selective Attention
**Idea.** People attend to the subset of stimuli related to their goal; they ignore anything that looks like an ad (banner blindness) and miss changes when attention is elsewhere (change blindness).
**Do.** Put important changes (price, validation, save state) next to the user's focus, give a local visual cue, and announce via a live region.
**Misuse.** Styling important content as a banner or promo; changing several things at once far from focus.

### Von Restorff Effect (isolation effect)
**Idea.** The item that differs is the one remembered.
**Do.** One visually distinct primary action; highlight the recommended plan. Use shape, icon, or text in addition to color.
**Misuse.** Highlighting everything: when every element is loud, none stands out, and it reads as advertising.

## Motivation and time

### Goal-Gradient Effect
**Idea.** Motivation increases as people get closer to a goal; artificial head starts help (endowed progress).
**Do.** "Step 2 of 4", progress bars, counting a completed account creation as step 1.
**Misuse.** Progress that resets, or step counts that grow after the user commits.

### Flow
**Idea.** Full immersion when challenge matches skill, feedback is immediate, and friction is low.
**Do.** No interrupting modals mid-task; autosave; keyboard shortcuts for experts; open references in side panels rather than navigating away.
**Misuse.** Upsell or survey prompts in the middle of focused work.

### Parkinson's Law
**Idea.** Tasks expand to fill the time available.
**Do.** State expected effort ("Takes about 2 minutes") and beat it: autofill (`autocomplete`), passkeys, wallet payments, sensible defaults.
**Misuse.** Artificial countdowns to rush decisions.

## Aesthetics

### Aesthetic-Usability Effect
**Idea.** People perceive attractive designs as easier to use and tolerate minor issues in them.
**Do.** Invest in consistent spacing, type, and radius, and measure task completion separately.
**Misuse.** Treating positive reactions to a pretty prototype as evidence of usability.

---

## Quick lookup: problem → law

| Symptom | Look at |
|---|---|
| Users hesitate or pick the wrong option | Hick, choice overload, Von Restorff |
| Users miss a button or mis-tap | Fitts, serial position, similarity |
| Users get lost between steps | Working memory, goal-gradient, uniform connectedness |
| Users say "that's not where I expected it" | Jakob, mental model |
| Users type data in "the wrong format" | Postel, Tesler |
| Users don't notice a change | Selective attention, proximity |
| Users abandon long tasks | Goal-gradient, Zeigarnik, Parkinson, peak-end |
| Screen feels "busy" | Cognitive load, Occam, Prägnanz, common region |

## Sources

- Laws of UX (Jon Yablonski): https://lawsofux.com/ — one page per law, e.g. https://lawsofux.com/hicks-law/, https://lawsofux.com/fittss-law/, https://lawsofux.com/doherty-threshold/, https://lawsofux.com/working-memory/, https://lawsofux.com/millers-law/
- Mirror of the law texts and takeaways: https://github.com/fmhall/software-laws/tree/master/ux-laws/laws
- WCAG 2.2 SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Apple HIG, accessibility (44×44 pt): https://developer.apple.com/design/human-interface-guidelines/accessibility
- Material Design 3, touch targets (48×48 dp): https://m3.material.io/foundations/designing/structure
