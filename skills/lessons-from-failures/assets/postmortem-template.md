# Postmortem: <short, neutral title> — <YYYY-MM-DD>

<!--
Blameless: describe what people knew and did, and why it made sense at the time.
Avoid "should have", "failed to", "careless", "human error". Name roles, not people, in the analysis.
Write the first draft within a few days, while memory and logs are fresh.
-->

**Status:** draft | in review | final
**Authors:** <names> · **Incident commander:** <name> · **Reviewers:** <names>
**Severity:** <SEV level> · **Incident window (UTC):** <start> – <end> · **Detected by:** <alert / customer / employee / chance>

## Summary

Two to four sentences a non-engineer can follow: what users experienced, for how long, what triggered it, and how service was restored.

## Impact

- **Users or tenants affected:** <count or share, which segments>
- **Journeys degraded:** <sign-in, checkout, API, …> · **Duration:** <minutes/hours per journey>
- **Data:** <none lost / lost / delayed / exposed — scope and whether recovered>
- **Error budget consumed:** <% of the SLO window>
- **External:** <SLA credits, support tickets, public status posts, regulatory notice>

## Timeline (UTC)

Include the lead-up (the change or condition that set things in motion), first signal, detection, key decisions, mitigation, and resolution. Mark what responders knew at each point.

| Time | Event | What responders knew or believed |
|---|---|---|
| hh:mm | <change deployed / config pushed / condition began> | |
| hh:mm | <first symptom (even if unnoticed)> | |
| hh:mm | <alert fired / report received> | |
| hh:mm | <incident declared, IC assigned> | |
| hh:mm | <hypothesis, action taken> | |
| hh:mm | <mitigation: rollback / flag off / failover / load shed> | |
| hh:mm | <service restored; monitoring through bake period> | |

**Time to detect:** <first symptom → alert> · **Time to mitigate:** <alert → user impact ended> · **Time to resolve:** <alert → fully resolved>

## Contributing factors

The conditions that combined. There is rarely one root cause; list several, including latent ones present long before the trigger. For each, say why it made sense or went unnoticed at the time.

| Factor | Type | How it contributed | Why it existed or went unnoticed |
|---|---|---|---|
| <e.g., config pushed to all regions at once> | change process | <…> | <config pipeline had no staged mode> |
| <e.g., backup job failing silently> | latent condition | <…> | <failure alerts went to an unmonitored address> |
| <e.g., delete tool accepted any ID type> | tooling / blast radius | <…> | <…> |

Types: change process · latent condition · tooling / blast radius · detection / observability · dependency · capacity / limit · communication / coordination · goal conflict (speed vs safety).

**Failure patterns matched** (from `lessons-from-failures`): <e.g., 2 config skips safety net; 5 untested backups; 10 unbounded action>

## What went well

Detection, tools, decisions, and people that limited the damage. These are defenses to keep.

## What was hard

Where responders were slowed: missing access, misleading dashboards, unclear ownership, tools that depended on the broken system, policy ambiguity they had to resolve in the moment.

## Where we got lucky

Things that limited impact but were not designed to (timing, a person who happened to be online, traffic being low). Luck is an unowned defense — consider turning it into a designed one.

## Action items

Each changes the system (guardrail, automation, alert, safer default, removed dependency), not a person's diligence. "Be more careful" and "add a checklist step" are not action items on their own.

| # | Action | Type | Owner | Priority | Due | Ticket |
|---|---|---|---|---|---|---|
| 1 | <e.g., stage config pushes: 1 cell → 10% → all, auto-halt on 5xx> | prevent | <one person> | P1 | <date> | <link> |
| 2 | <e.g., alert when backup job has not succeeded in 26 h; weekly restore drill> | detect | | P1 | | |
| 3 | <e.g., delete API accepts one ID type; dry run and per-run cap> | mitigate | | P2 | | |
| 4 | <e.g., host status page outside our infrastructure> | mitigate | | P2 | | |

Types: **prevent** (the trigger cannot happen again) · **detect** (we would know sooner) · **mitigate** (smaller blast radius or faster recovery) · **process** (only when a system change is not possible).

## Lessons and open questions

What we learned about how the system actually works, and what we still do not understand.

## Appendix

Links: dashboards, logs, chat transcript, related incidents, public status updates, vendor postmortems.

<!--
Review checklist before marking final:
- Summary readable by someone outside the team.
- Timeline includes what people knew, not only what happened.
- At least three contributing factors, including one latent condition.
- No blame language; counterfactuals rewritten as questions about the system.
- Every action item has one owner, a type, a priority, and a ticket.
- Shared where engineers will find it; follow-up review of action items scheduled.
-->
