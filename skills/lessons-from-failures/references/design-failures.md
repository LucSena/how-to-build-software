# Design Failures — Redesigns, Dangerous UIs, Dark Patterns, and Why Design Fails

Product and UI failures follow the same logic as outages: a change removed something people relied on, went to everyone at once, and had no way back — or an interface let one ordinary click do extraordinary damage. Each case: **What happened**, **Why**, **Rule**, **Source**. Where the research could not verify specific numbers, they are left out.

## Contents
1. Interfaces that let one action do unbounded damage: Hawaii alert, butterfly ballot
2. Redesigns and rewrites users rejected: Sonos, Snapchat, Digg v4, Windows 8
3. Products without a job: Google Wave, Google+
4. Dark patterns with legal consequences: Amazon, Epic
5. Accessibility as a legal floor: Robles v. Domino's
6. Why design fails: the mental-model gap and process causes
7. Pre-ship checklist for any redesign

---

## 1. Interfaces that let one action do unbounded damage

### Hawaii false ballistic missile alert (13 Jan 2018)
**What happened.** During an unannounced drill, a warning officer sent a live "BALLISTIC MISSILE THREAT INBOUND TO HAWAII … THIS IS NOT A DRILL" alert to phones and broadcast systems. The officer picked the live template from a drop-down list that mixed live and test templates, then confirmed a generic "Are you sure that you want to send this Alert?" prompt, identical for tests and live alerts and without the message text; the officer later said they believed the attack was real. A correction took 38 minutes to go out.
**Why (FCC).** Live and test actions sat side by side and looked alike; the same confirmation appeared for drill and live, so it confirmed nothing; no second-person check; no prepared correction path; ambiguous drill procedures.
**Rule.** Separate test and live structurally (different screens, colors, environments), not by list position. Confirmations restate the specific consequence ("Send a LIVE alert to every phone in the state?"). Mass or irreversible actions need two-person approval, and the correction or undo path is built at the same time as the action.
**Source.** https://docs.fcc.gov/public/attachments/DOC-350119A1.pdf

### Palm Beach "butterfly ballot" (Nov 2000)
**What happened.** Candidate names on two facing pages shared one central column of punch holes, so the second hole did not belong to the second name on the left page. A peer-reviewed analysis (Wand et al., *American Political Science Review*, Dec 2001) found that the ballot caused more than 2,000 Democratic voters to vote by mistake for Buchanan; the certified statewide margin was 537 votes.
**Rule.** Alignment and proximity carry meaning: labels sit next to their controls. Usability-test high-stakes forms with representative users, including older and first-time users.
**Sources.** Wand et al., "The Butterfly Did It", *APSR* 95(4), Dec 2001: https://websites.umich.edu/~wmebane/butterfly.pdf ; https://en.wikipedia.org/wiki/2000_United_States_presidential_election_in_Florida

## 2. Redesigns and rewrites users rejected

### Sonos app (May 2024)
**What happened.** Sonos shipped a rebuilt app that dropped features people used daily — sleep timers, alarms, queue editing, local library search, and some accessibility features — and added connectivity problems on existing systems. The company committed an estimated $20–30M to fixes; CEO Patrick Spence stepped down in Jan 2025, and his successor, Tom Conrad, called it "a profound mistake".
**Why.** A rewrite with no feature-parity gate, shipped on a date rather than when ready, with no way back to the old app, on a hardware product where the app *is* the product.
**Rule.** Parity inventory (every feature, setting, and accessibility capability) blocks release until each item is shipped or explicitly retired with notice. Old and new side by side, opt-in beta, and a rollback.
**Sources.** https://www.cnbc.com/2025/01/13/sonos-ceo-patrick-spence-steps-down-after-app-update-debacle.html ; https://www.digitaltrends.com/home-theater/a-profound-mistake-sonos-ceo-talks-about-its-broken-app-and-why-its-been-so-hard-to-fix/

### Snapchat redesign (2017–2018)
**What happened.** The redesign reorganized core navigation, mixing friends' content and publisher content in new places. It went to all users; a petition to reverse it drew very large support, and Snap later reported its first-ever quarterly decline in daily users, which it attributed in part to the redesign. Parts of the change were rolled back.
**Rule.** Core navigation changes roll out gradually (percentage or opt-in) with a way back. Measure retention and task success by segment, especially heavy users whose muscle memory you are breaking.
**Source.** https://techcrunch.com/2018/08/07/snapchat-earnings-q2-2018/

### Digg v4 (Aug 2010)
**What happened.** A full rewrite launched with outages, removed features the community relied on, and shifted the front page toward publisher content at the same time. Users revolted and moved to Reddit, and Digg never recovered its position.
**Rule.** Never combine a rewrite, a business-model change, and feature removal in one release. Community products run on trust; change one thing at a time and keep what users use.
**Source.** https://en.wikipedia.org/wiki/Digg

### Windows 8 (Oct 2012)
**What happened.** A full-screen, touch-first Start screen replaced the Start menu on every PC, including mouse-and-keyboard desktops, and key functions moved behind invisible gestures and hot corners. Windows 8.1 brought back a Start button, and Windows 10 restored the Start menu.
**Rule.** A design optimized for a new context must not be imposed on the dominant existing one. Hidden, gesture-only controls fail the discoverability test.
**Source.** https://en.wikipedia.org/wiki/Windows_8

## 3. Products without a job

### Google Wave (2009–2010) and Google+ (2011–2019)
**What happened.** Wave combined email, chat, and wiki without a clear job to be done and launched invite-only, so most users had no one to collaborate with; development stopped within about a year. Google+ was pushed by coupling it to other products (for example, requiring a Google+ profile for YouTube comments); engagement stayed low and the consumer product closed in 2019.
**Rule.** Start from the user's job, not the technology. Do not force adoption through coupling (required accounts, removed alternatives); earn it. Launch social products where users' networks already are.
**Sources.** https://en.wikipedia.org/wiki/Google_Wave ; https://en.wikipedia.org/wiki/Google%2B

## 4. Dark patterns with legal consequences

### Amazon Prime (FTC settlement, Sep 2025)
**What happened.** Amazon agreed to pay $2.5B — a $1B civil penalty and $1.5B in refunds — over FTC allegations that Prime enrollment used confusing designs to sign people up during checkout and that cancellation was deliberately convoluted. It agreed to obtain express informed consent and provide an easy cancellation path.
**Source.** https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-secures-historic-25-billion-settlement-against-amazon

### Epic Games / Fortnite (FTC, Dec 2022)
**What happened.** Epic agreed to pay $245M in refunds over design that led to accidental purchases with a single button press and over locking accounts of users who disputed charges.
**Source.** https://www.ftc.gov/news-events/news/press-releases/2022/12/fortnite-video-game-maker-epic-games-pay-more-half-billion-dollars-over-ftc-allegations

**Rule for both.** Cancellation takes no more steps than sign-up. Paid actions need a confirming step that states the price. Nothing pre-checked for consent or upsells. Declining is as easy as accepting. (Details: `ux-principles`, `conversion-ux`.)

## 5. Accessibility as a legal floor

### Robles v. Domino's Pizza (2019)
**What happened.** A blind customer could not order through Domino's website or app with a screen reader. The Ninth Circuit held that the ADA applies to websites and apps connected to physical places of public accommodation, and the US Supreme Court declined to hear Domino's appeal in 2019.
**Rule.** WCAG 2.2 AA is the baseline for customer-facing flows; test sign-up and checkout with a screen reader and keyboard only. Accessibility regressions in a redesign are release blockers.
**Source.** https://en.wikipedia.org/wiki/Robles_v._Domino%27s_Pizza

## 6. Why design fails

### The mental-model gap (Norman)
Failures happen where the designer's model of the system differs from the user's. Norman's two gulfs (Hutchins, Hollan, and Norman, 1986; *The Design of Everyday Things*) diagnose which side broke:
- **Gulf of execution** — "How do I do this?" Fix with signifiers, clear labels, placement, and mapping.
- **Gulf of evaluation** — "Did it work? What state is it in?" Fix with feedback and visible system status.

The cases through this lens: Hawaii (operator's model "drill", system state "live"); Sonos (users' model "my sleep timer is always there"); Windows 8 (users' model "a desktop with a Start menu"); Therac-25 (operators' model "Malfunction 54 is harmless"). *Rule:* before a redesign, write down the user's current mental model — top tasks and where they expect things — and keep it, or teach the change in context (notice, migration guide, opt-in period).

### Process causes
- **No testing with users.** About five users in a *qualitative* round find most usability problems; the right move is many small rounds (test, fix, retest). The figure does not apply to quantitative studies, which need many more participants (Nielsen; see NN/g's qualitative-vs-quantitative caveat).
- **Opinion over evidence.** Kohavi's data from Microsoft experiments: about a third of ideas improved the target metric, a third were flat, and a third made it worse; across companies, most ideas do not improve the metric they target. Decide by test, not by the highest-paid person's opinion.
- **Happy path only.** Missing loading, empty, error, partial, and permission states make users think work was lost. Design with real content, including worst cases (long names, zero and 10,000 items, translations, expired sessions, double submit).
- **Handoff gaps.** Static mockups omit states, focus order, responsive behavior, and error copy, so developers invent them inconsistently. Hand off a state matrix and review in the browser.
- **Design by committee and vanity metrics.** One accountable decision-maker per surface; measure task success, errors, and retention by cohort — not page views or time in app, which rise when the UI gets harder.
- **Trends over legibility.** Low-contrast grey text, ultra-thin type, and heavy glass effects fail contrast checks with real content.

## 7. Pre-ship checklist for any redesign

- [ ] Evidence for the change (research, support tickets, analytics), not opinion.
- [ ] Parity inventory: every feature, setting, shortcut, integration, and accessibility capability — shipped or retired with notice.
- [ ] User's current mental model written down; top tasks still in expected places or taught in context.
- [ ] Every state designed: loading, empty, error, partial, offline, permission-denied.
- [ ] Usability round with ~5 representative users (including heavy users), fixed, retested.
- [ ] Accessibility parity checked with screen reader and keyboard.
- [ ] Rollout: opt-in beta or percentage rollout; old path kept; switch-back available for a stated period.
- [ ] Metrics: task success and retention per segment plus guardrails; rollback trigger defined.
- [ ] No dark patterns in any flow the redesign touches.
- [ ] Irreversible or mass actions: specific confirmations, two-person approval where warranted, and an undo or correction path.

## Sources

- Hawaii: FCC report https://docs.fcc.gov/public/attachments/DOC-350119A1.pdf
- Sonos: https://www.cnbc.com/2025/01/13/sonos-ceo-patrick-spence-steps-down-after-app-update-debacle.html
- Snap Q2 2018: https://techcrunch.com/2018/08/07/snapchat-earnings-q2-2018/
- FTC Amazon: https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-secures-historic-25-billion-settlement-against-amazon
- Norman's gulfs: https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/
- Five users: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/ ; caveat https://www.nngroup.com/articles/5-test-users-qual-quant/
- Kohavi: https://exp-platform.com/Documents/2013-06%20eMetricsOnlineControlledExperimentsNR.pdf
- Other case URLs inline above.
