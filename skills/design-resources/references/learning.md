# Learning: principles, research, and design engineering (as of 2026-09)

Reading and reference sites worth pointing people and agents to. Each entry says what it actually is and what to take from it.

## 1. UX principles and research

| Name | URL | What it is | Take from it |
|---|---|---|---|
| Laws of UX [V] | https://lawsofux.com | Jon Yablonski's collection of about 30 psychology-based UX laws (Fitts, Hick, Jakob, Miller, Tesler, Doherty threshold, peak-end, Zeigarnik, Gestalt laws…), each with a summary and takeaways | Named mechanisms to justify decisions (see `ux-principles`) |
| NN/g: 10 Usability Heuristics [V] | https://www.nngroup.com/articles/ten-usability-heuristics/ | Nielsen Norman Group's canonical heuristics and hundreds of research articles (error messages, empty states, forms, response-time limits, progressive disclosure) | The heuristic-review rubric (see `design-review`); research-backed answers to specific questions |
| Baymard Institute [V] | https://baymard.com | Large-scale e-commerce and form usability research (checkout, cart abandonment, form fields, inline validation) | Checkout and form rules with evidence: show total cost early, guest checkout, fewer fields (see `conversion-ux`) |
| growth.design [V] | https://growth.design | Comic-format product case studies (onboarding, retention) and a library of 100+ cognitive biases and principles for UX | Psychology applied to real flows, used ethically |
| Humane by Design [V] | https://humanebydesign.com | Jon Yablonski's 7 principles for ethical technology (transparent, resilient, empowering, finite, inclusive, intentional, respectful) with patterns | The ethics floor: finite feeds, respectful notifications, easy deletion |
| Deceptive Design [P] | https://www.deceptive.design | Harry Brignull's catalog of dark patterns (confirmshaming, roach motel, hidden costs, sneak into basket…) | What never to build |
| principles.design [V] | https://principles.design | Ben Brignell's open-source collection of hundreds of published design principles from companies and governments, plus guidance on writing principles | How to write principles that take a position (for design-system docs) |
| Web Field Manual [V] | https://webfieldmanual.com/design | Jon Yablonski's curated link directory of web design resources (best practices, process, accessibility) | A reading list, not a rule source |
| lessons.design [P] | https://lessons.design | A designer's personal essay site on why he designs the way he does | Reflective reading; not a rules source |

## 2. Design systems

| Name | URL | What it is | Take from it |
|---|---|---|---|
| Design System Checklist [V] | https://www.designsystemchecklist.com | An open-source checklist covering design language, foundations (color, layout, type, elevation, motion, iconography), 29 core components with their required states, and maintenance | The component-state checklist and maintenance practices (see `design-systems`) |
| DTCG 2025.10 [V] | https://www.designtokens.org/tr/2025.10/format/ | The first stable W3C Community Group design-token format (Format, Color, Resolver) | The token file format |
| DESIGN.md spec [V] | https://github.com/google-labs-code/design.md | Google's agent-readable design-system format and CLI | How to document a system for agents |

## 3. Design engineering

| Name | URL | What it is | Take from it |
|---|---|---|---|
| Emil Kowalski [V] | https://emilkowal.ski | Design engineer (Sonner, Vaul); essays on animation and craft; the animations.dev course; an agent skills repo | The frequency rule for motion, easing and duration defaults, "taste is trained" |
| Rauno Freiberg, Web Interface Guidelines [V] | https://interfaces.rauno.me | The original interface guidelines that preceded Vercel's list (interactivity, typography, motion, touch, accessibility) | Detailed interaction and typography rules |
| Vercel Web Interface Guidelines [V] | https://github.com/vercel-labs/web-interface-guidelines | The maintained successor, with AGENTS.md for agents | A review checklist for web UI |
| floguo: Design Engineering notes [P] | https://floguo.com/notes/design-engineering | Flo Guo's living document on the design-engineer role, guidelines, agent skills, tools, and essays. Key lines: "material understanding beats tool proficiency"; think in the final medium | Onboarding reading on the role |
| DesEngs [V] | https://desengs.com | By remvze (MIT, Astro): a curated, dated feed of tools, articles, videos, and communities for design engineers (browse by Read, Watch, Listen, Use, Build, Learn), plus the "Minimum" gallery of minimal personal sites and a DSGNRS list | Finding people and tools to study |
| Designeer [P] | https://designeer.xyz | A curated hub launched in 2026: about 120 component and motion libraries, 60+ building tools (editors, coding agents, deploy), utilities, visuals, and designers to follow; "vetted for craft, not just popularity". Behind a bot check that blocked automated reading on 2026-09-30, so these counts are from the first pass | Discovering libraries, MCP servers, and agents |
| Design Engineer Tools [V] | https://designengineer.tools | By James Warner: a curated list of inspiration, AI code tools, component libraries, web utilities, desktop utilities, and video/capture tools | Setting up a design-engineering workstation |

## 4. Systems thinking and product context

| Name | URL | What it is | Take from it |
|---|---|---|---|
| How Complex Systems Fail [V] | https://how.complexsystems.fail | Richard I. Cook's 18 short points on failure in complex systems (catastrophe needs multiple failures; systems run in degraded mode; hindsight bias; change introduces new failure modes) | Design honest degraded, partial, and offline states; undo and dry runs for risky actions (see `reliability`) |
| Y Combinator Requests for Startups [V] | https://www.ycombinator.com/rfs | YC's list of problem areas it wants founders to work on. Recent lists feature agent-facing software, dynamic interfaces, and multiplayer AI | Context for where interface design is heading: agent status, interruptibility, human verification |

## Sources

- Laws of UX: https://lawsofux.com (law texts mirrored at https://github.com/fmhall/software-laws)
- NN/g articles: https://www.nngroup.com/articles/
- Baymard: https://baymard.com/research/checkout-usability
- growth.design: https://growth.design/psychology ; Humane by Design: https://humanebydesign.com/principles
- principles.design: https://principles.design ; Web Field Manual: https://webfieldmanual.com/design
- Design System Checklist source: https://github.com/ardakaracizmeli/design-system-checklist
- Emil Kowalski: https://github.com/emilkowalski/skills ; Rauno Freiberg: https://github.com/raunofreiberg/interfaces
- DesEngs: https://github.com/remvze/desengs
- How Complex Systems Fail: https://how.complexsystems.fail ; YC RFS: https://www.ycombinator.com/rfs
