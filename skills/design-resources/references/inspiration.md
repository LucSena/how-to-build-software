# Inspiration, references, motion, and backgrounds (as of 2026-09)

Verification marks: **[V]** verified · **[P]** partially verified. Prices change often, so re-check before quoting.

## 1. Shipped-product pattern libraries

Use these when the pattern must *work*: onboarding, checkout, settings, paywalls, empty states.

| Name | URL | What it is | Pricing (approx.) | When to use |
|---|---|---|---|---|
| Mobbin [V] | https://mobbin.com | The largest real-app library: 1,428 apps, 621,500+ screens, and 323,900 flows (iOS, Android, web; homepage counts on 2026-09-30). **Mobbin MCP** (May 2026) lets agents query it on paid plans | Pro (1 member) and Team (per member) plans, billed yearly or quarterly; MCP from Pro; prices shown in local currency, so check the pricing page | How shipped apps solve a pattern; agent-queryable research |
| Refero [V] | https://refero.design | Design research for people and AI: real web and iOS screens and flows, now led by a "research mode" that takes a task description and returns analysis plus references (the homepage no longer publishes library counts, as of 2026-09). Figma plugin; **Refero MCP** on paid plans. Also publishes Refero Styles (DESIGN.md) and a research-first design skill | Free (about 3% of the library), Pro about $10/mo, Team about $12/seat/mo | Web-app-focused research; a cheaper Mobbin alternative with MCP |
| Page Flows [V] | https://pageflows.com | **Recorded video user flows** plus lifecycle emails and UI elements | $99/yr or $39/quarter per user; team plan $199/yr for 3–10 users (2026-09) | Studying end-to-end flows as video (onboarding, checkout, cancellation) and email sequences |
| Gummble [V] | https://gummble.com | 300,000+ screenshots, 21,000+ flows, 1,500+ apps; **MCP** for searching screens, flows, patterns, and microcopy | Free browse tier; paid about $9.99/mo | Budget pattern research with agent access |
| ScreensDesign [V] | https://screensdesign.com | iOS "UI/UX intelligence": 2,730 top-chart apps with full session recordings (first screen → paywall → after purchase) and **monthly revenue signals**; focused on onboarding and **paywalls**; also an App Store screenshots section and an AI screen generator | Paid (tiers unverified) | Subscription-app onboarding and paywalls backed by revenue data (pair with `conversion-ux`) |
| Appshots [V] | https://appshots.design | A curated mobile screenshot gallery: 120,000+ screens from 400+ apps, adding about 1.6K screens a week (2026-09) | Pricing not checked | Quick mobile visual research |

## 2. Visual direction and curation

Use these for *look and feel*. Most of what they show is marketing, not product UI.

| Name | URL | What it is | When to use |
|---|---|---|---|
| Godly [V] | https://godly.website | "A daily curation of exceptional design, websites and tools": a masonry feed filterable by Web, Interface, Branding, Product, Typography, Motion, and more, plus sections for websites, OG images, app screenshots, app icons, tools, and agent skills (2026-09). `godly.design` resolves here | Award-grade marketing sites, motion, and brand direction |
| Inspora [V] | https://inspora.design | A curated archive of recent visual design posts pulled from X (web, branding, product, motion, 3D, print), updated hourly, with creator attribution and source links. Free | Scanning current visual trends. Remember that trends are what the slop list is made of |
| Collect UI [V] | https://collectui.com | Daily hand-picked Dribbble shots (Daily UI and beyond), filterable by element | Component-level visual ideas. These are **concepts, not shipped products** |
| Deck Gallery [P] | https://deck.gallery | Curated pitch decks, keynotes, and brand guidelines, slide by slide; also sells deck templates | Pitch-deck and presentation design |
| dqnamo [V] | https://dqnamo.com | Portfolio of JP (dqnamo), a design engineer, including "The Kitchen": playful component and interaction experiments. Featured in DesEngs' minimal-site gallery | Interaction-experiment ideas; the minimal portfolio pattern |
| DesEngs "Minimum" gallery [V] | https://desengs.com | Part of the DesEngs directory: minimal personal sites of design engineers | Portfolio and personal-site inspiration |

## 3. Motion, video, and backgrounds

| Name | URL | What it is | When to use |
|---|---|---|---|
| transitions.dev [V] | https://transitions.dev | By Jakub Antalik: about 18 production-ready **CSS transitions** (dropdown, modal, panel reveal, number pop-in, text/icon swap, success check, error shake, shimmer, sliding tabs, accordion, plus-to-menu morph) with live tuning, `:root` custom properties, and `prefers-reduced-motion` guards. Also ships an agent skill | Standard micro-interactions without a JS animation library |
| Emil Kowalski [V] | https://emilkowal.ski | Articles ("You don't need animations", practical animation tips), the animations.dev course, Sonner and Vaul, and an agent skills repo | Deciding whether and how to animate (see `motion-design`) |
| HyperFrames (HeyGen) [V] | https://github.com/heygen-com/hyperframes | An Apache-2.0 framework and agent skills for authoring **video compositions** in HTML with animation runtimes (GSAP, Lottie, Three, WAAPI, CSS), with a motion doctrine, blueprints, and a render pipeline | Code-authored motion graphics and product videos |
| snapcn [V] | https://snapcn.dev | A Remotion component registry for product-demo video, themed from shadcn tokens (see `components.md`) | Demo clips that match your UI |
| Animos [V] | https://animos.app | **Not a gallery:** a browser tool that turns designs into motion showcases (30+ templates, 4K MP4/WebM export). Launched July 2026; freemium | Portfolio reels and product shots without code |
| Backgrounds Supply | https://backgrounds.supply | Paid packs of gradient and AI-generated backgrounds. **The site did not load on 2026-09-30; re-check it before recommending** | Slides, social, and occasional heroes. **Use sparingly:** gradient backgrounds are a leading AI-slop tell |

## 4. Listed as design resources but something else

These URLs circulate in design link lists. Here is what they actually are:

| URL | What it actually is | Where it fits |
|---|---|---|
| https://atlas.attio.com | **GTM Atlas by Attio**: a free guide to modern AI go-to-market (lead capture, qualification, outbound, retention) with a tools directory, written with operators from several startups. Not a design system | An example of a well-crafted long-form editorial site, or GTM reading |
| https://driver.rybicki.ai | **"Racing Driver Simulator"**: an unofficial text-based racing-career browser game (karting to the top in about 20 minutes, with a shareable career card) | An example of polished single-page game UX and shareable-card design |
| https://revyl.com | A YC F24 **AI mobile-testing platform**: natural-language end-to-end tests on cloud iOS/Android devices (native, React Native, Expo, Flutter), with CLI and CI integration | Mobile QA for the app you designed (see `testing-strategy`) |
| https://animos.app | A **design-to-motion video tool** (section 3), not an inspiration gallery | Motion showcases |
| https://www.rams.ai | An **automated design-review engine** (see `ai-design-tools.md`), not Dieter Rams' principles | Design review in PRs |

## 5. How to use references well

- **Collect 3–5 references for the *pattern*,** then design from the brief. Write down what each reference does well in one line ("the inline plan comparison removes a pricing page click").
- **Prefer shipped products** for patterns and flows. Dribbble concepts skip edge cases, states, and real content.
- **Never lift a brand's identity** (palette, type pairing, illustration style, copy voice) into another product. Extract the principle.
- **Trend feeds are a slop risk.** Whatever is trending is what models will converge on next. Use trend scanning to know what to avoid as much as what to adopt.
- When an agent can query a library through MCP (Mobbin, Refero, Gummble), ask for screens by **pattern + platform + constraint** ("iOS paywall with annual toggle and free trial, 2026"), not by brand.

## Sources

- Mobbin: https://mobbin.com ; Refero: https://refero.design ; Page Flows: https://pageflows.com ; Gummble: https://gummble.com ; ScreensDesign: https://screensdesign.com ; Appshots: https://appshots.design
- Godly: https://godly.website ; Inspora: https://inspora.design ; Collect UI: https://collectui.com ; Deck Gallery: https://deck.gallery ; dqnamo: https://dqnamo.com ; DesEngs: https://github.com/remvze/desengs
- transitions.dev: https://transitions.dev ; Emil Kowalski: https://emilkowal.ski ; HyperFrames: https://github.com/heygen-com/hyperframes ; Animos: https://animos.app ; Backgrounds Supply: https://backgrounds.supply
- GTM Atlas: https://atlas.attio.com ; Racing Driver Simulator: https://driver.rybicki.ai ; Revyl: https://revyl.com ; Rams: https://www.rams.ai
