# Project Failures — Rewrites, Big Bangs, and Safety-Critical Software

Software projects fail for reasons that repeat: a big-bang cut-over as the first real use, a rewrite that discards encoded knowledge, integration left to the end, code reused outside the conditions it was validated for, and automation that humans cannot see or override. Each case: **What happened**, **Why**, **Rule**, **Source**.

## Contents
1. Launches and programmes: HealthCare.gov, NHS NPfIT
2. Rewrites and structure: Netscape, second-system effect, Brooks's law, strangler fig, microservices regret
3. Safety-critical software: Boeing 737 MAX, Therac-25, Ariane 5, Mars Climate Orbiter, Toyota
4. Records and trust: UK Post Office Horizon
5. The Standish CHAOS caveat
6. Rules

---

## 1. Launches and programmes

### HealthCare.gov (launched 1 Oct 2013)
**What happened.** The federal health-insurance marketplace was effectively unusable for roughly two months after launch. A rescue team fixed it with basic practices (monitoring, a daily stand-up, fixing the highest-impact problems first).
**Why (HHS Inspector General).** Absence of clear leadership; so much time spent on policy that too little remained for building; poor technical decisions; weak contract management across many contractors; policy and technical work kept apart.
**Rule.** One accountable technical owner. Integrate end to end early and continuously. Load-test the real critical path (including identity and payment) above expected peak before launch.
**Source.** https://oig.hhs.gov/documents/evaluation/2981/OEI-06-14-00350-Complete%20Report.pdf

### UK NHS National Programme for IT (2002–2011)
**What happened.** A centrally procured national electronic care record, the largest civilian IT programme of its time, was dismantled in 2011 with expected costs of more than £9.8bn; Parliament's Public Accounts Committee called it one of the worst contracting fiascos in public-sector history.
**Why.** A top-down, big-bang design imposed on local organisations; huge regional contracts; suppliers leaving; one design for very different clinical settings.
**Rule.** Gall's law: a working complex system grows from a working simple one. Deliver independently useful increments that real users adopt; never plan a single cut-over as the first real use.
**Sources.** https://publications.parliament.uk/pa/cm201314/cmselect/cmpubacc/294/294.pdf ; https://www.cl.cam.ac.uk/archive/rja14/Papers/npfit-mpp-2014-case-history.pdf

## 2. Rewrites and structure

### Netscape's rewrite — "Things You Should Never Do" (Spolsky, 2000)
**What happened.** Netscape discarded its working browser code to rewrite from scratch and went years without a major release while a competitor took the market. The rewrite later became Mozilla and Firefox — a win for the ecosystem, not for the company.
**Why (Spolsky).** Old code looks messy because it holds years of bug fixes; reading code is harder than writing it, so every team believes the old code is worse than it is; a rewrite hands competitors a lead and reintroduces fixed bugs.
**Rule.** Default to incremental refactoring or a strangler fig. Propose a rewrite only with a feature-parity inventory, a migration path that keeps the old system serving, and evidence that the old code is unrecoverable, not just unfamiliar.
**Source.** https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/

### Second-system effect and Brooks's law (Brooks, *The Mythical Man-Month*, 1975)
- **Second-system effect:** after a restrained first system, the second tries to include every deferred idea and bloats. *Rule:* write a "not doing" list next to the v2 scope.
- **Brooks's law:** adding people to a late project makes it later — ramp-up time plus communication paths growing as n(n−1)/2. *Rule:* when late, cut scope. The same applies to adding parallel agents to one codebase.
**Source.** https://github.com/dwmkerr/hacker-laws (Brooks' Law, Second-System Effect)

### Strangler fig and microservices regret
- **Strangler fig (Fowler):** put a facade in front of the old system, move one capability at a time, and retire old parts as traffic moves. Every step ships and every step can be reversed. https://martinfowler.com/bliki/StranglerFigApplication.html
- **Segment, "Goodbye Microservices" (2018):** describes merging many per-destination services back into one after version drift in shared libraries and the operational load outweighed the benefits. https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices
- **Amazon Prime Video (2023):** one monitoring service moved from a distributed serverless design, which passed video frames between components through object storage, to a single process and cut that service's infrastructure cost by about 90%. It is one service, not "Amazon abandons microservices". https://devclass.com/2023/05/05/reduce-costs-by-90-by-moving-from-microservices-to-monolith-amazon-internal-case-study-raises-eyebrows/
- **Rule:** start with a modular monolith; extract a service only for a measured force (independent scaling, a separate team, a different release cadence, failure isolation). Components that exchange large data at high frequency belong in one process.

## 3. Safety-critical software

### Boeing 737 MAX MCAS (2018–2019)
**What happened.** Two crashes (Lion Air 610, Ethiopian 302) killed 346 people. MCAS pushed the nose down based on a single angle-of-attack sensor; when that sensor failed, it activated repeatedly and aggressively. The US House committee report blamed faulty technical assumptions, a lack of transparency by Boeing management, and grossly insufficient FAA oversight.
**Why.** A single input for a safety-critical automatic action; automation that fought the pilots without being clearly visible or bounded; an assumed human reaction time that was never validated; commercial pressure to avoid retraining.
**Rule.** Automated corrective actions use redundant or cross-checked inputs, have bounded authority (maximum repetitions and magnitude), are visible when active, and are easy to override. Never hide an automation from its users to save documentation or training cost.
**Source.** https://democrats-transportation.house.gov/imo/media/doc/2020.09.15%20FINAL%20737%20MAX%20Report%20for%20Public%20Release.pdf

### Therac-25 (1985–1987)
**What happened.** A radiation-therapy machine gave massive overdoses in at least six accidents; several patients died.
**Why (Leveson and Turner).** Hardware interlocks from the previous model were removed and software was trusted instead; a race condition triggered when operators edited treatment data quickly; error messages were cryptic ("MALFUNCTION 54"); frequent harmless errors had taught operators to press "proceed"; the manufacturer first denied the machine could be at fault.
**Rule.** Do not remove a safety interlock because software "handles it". Error messages say what happened and what is safe to do. Fix false alarms, because users learn to click through them.
**Source.** http://sunnyday.mit.edu/papers/therac.pdf

### Ariane 5 Flight 501 (4 Jun 1996)
**What happened.** The rocket veered off course and self-destructed shortly after launch.
**Why.** Inertial reference software reused from Ariane 4 converted a 64-bit float to a 16-bit signed integer; Ariane 5's trajectory produced larger values, and the overflow was unprotected on the strength of Ariane 4 analysis. The primary and backup units ran the same software and failed the same way. The failing function served no purpose after liftoff.
**Rule.** Re-validate input ranges, units, and timing when reusing code in a new context. Identical redundant software is no protection against software faults. Turn off code the current phase does not need.
**Source.** https://en.wikipedia.org/wiki/Ariane_flight_V88

### Mars Climate Orbiter (lost 23 Sep 1999)
**What happened.** Ground software from one contractor reported thruster impulse in pound-force seconds; the navigation software expected newton-seconds, as the interface spec required. The trajectory error grew for months and the orbiter was lost.
**Rule.** Put units in types or names (`durationMs`, unit newtypes). Validate cross-team interface files against a schema that includes units. "Something looks off" in data is an escalation trigger.
**Source.** https://en.wikipedia.org/wiki/Mars_Climate_Orbiter

### Toyota unintended acceleration (Bookout v. Toyota, 2013)
**What happened.** Expert review of the engine-control source code reported extensive global mutable state, weak stack-overflow protection, and a single task whose failure would disable throttle control and many fail-safes together. The jury found for the plaintiffs; the root cause of the accelerations remains contested, but the code-quality findings stand.
**Rule.** Keep fail-safes out of the failure domain they protect (separate task, process, or host). Minimize global mutable state. Treat stack and memory bounds as safety properties.
**Source.** https://safetyresearch.net/toyota-unintended-acceleration-and-the-big-bowl-of-spaghetti-code/

## 4. Records and trust

### UK Post Office Horizon (prosecutions 1999–2015)
**What happened.** Fujitsu's Horizon accounting system showed shortfalls at branches; more than 900 sub-postmasters were convicted of theft, fraud, or false accounting. In 2019 the High Court found Horizon had bugs, errors, and defects that could cause discrepancies, and that Fujitsu staff had remote access to branch accounts that the Post Office had denied. The public inquiry published its first report volume in Jul 2025 (as of 2026-09).
**Why.** "The computer is right" treated as evidence; silent back-door data corrections; an organization defending its system instead of investigating it.
**Rule.** Every write to financial or legal records is attributable (who or what, when, why) in an append-only audit log, including admin and support fixes. No hidden fix-up access. Users can see the transactions behind any balance.
**Sources.** https://www.judiciary.uk/wp-content/uploads/2019/12/bates-v-post-office-judgment.pdf ; https://en.wikipedia.org/wiki/British_Post_Office_scandal

## 5. The Standish CHAOS caveat

The often-quoted Standish CHAOS figures on project success rates rest on unpublished data and methods. Glass (CACM 2006), Jørgensen and Moløkken-Østvold (2006), and Eveleens and Verhoef (IEEE Software 2010) criticized them; one key objection is that "success" measured against the initial estimate measures estimation accuracy, not delivered value. Do not cite the percentages as fact; cite specific cases, or say "commonly cited and methodologically contested".

## 6. Rules

- [ ] Incremental delivery that real users adopt; no big-bang cut-over as the first real use (NPfIT, Gall).
- [ ] Rewrites only with parity inventory, a strangler path, and a rollback (Netscape, Sonos).
- [ ] One accountable technical owner; end-to-end integration from the start (HealthCare.gov).
- [ ] Load-test the real critical path above peak, including identity and provisioning.
- [ ] When late, cut scope; write a "not doing" list for v2 (Brooks).
- [ ] Modular monolith first; services for measured reasons (Segment, Prime Video).
- [ ] Re-validate assumptions when reusing code; units in types (Ariane 5, Mars Climate Orbiter).
- [ ] Automation with redundant inputs, bounded authority, visibility, and override (737 MAX).
- [ ] Keep interlocks and fail-safes independent of what they guard (Therac-25, Toyota).
- [ ] Append-only audit trails for records that decide money or guilt (Horizon).

## Sources

Case URLs inline above. Also: Brooks, *The Mythical Man-Month* (1975); Gall, *Systemantics* (1975); Robert Glass, "The Standish Report: Does It Really Describe a Software Crisis?", CACM 2006; Eveleens and Verhoef, "The Rise and Fall of the Chaos Report Figures", IEEE Software 2010.
