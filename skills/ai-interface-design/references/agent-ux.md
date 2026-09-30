# Agent UX

Patterns for interfaces where an AI works through multiple steps, uses tools, runs for minutes, or acts on the user's behalf. The user is a supervisor: they need to see the plan, steer it, approve consequential actions, and review the outcome.

## Contents

1. Run lifecycle
2. Plans
3. Tool calls and steps
4. Long-running and background runs
5. Approvals
6. Steering, interruption, handoff
7. Reviewing results
8. Multiplayer sessions
9. Designing your product for agents as users

## 1. Run lifecycle

Model every run as an explicit state machine and design each state:

`queued → planning → running (step n of m) → waiting for approval → running → completed | completed with issues | stopped by user | failed | timed out`

- Each state has a visible label, the controls that make sense in it (Pause, Stop, Approve, Retry, Continue), and copy.
- State comes from real events emitted by the backend run (step started, tool called, approval requested, finished). Do not infer or animate status the backend has not reported.

## 2. Plans

### Show the plan as a checklist, not prose
**Rule.** Render the agent's plan as a stepper or checklist that updates live (pending, running, done, failed, skipped).
**Apply when.** Any run with more than two steps.
**Do / Avoid.** Do: "1. Find overdue invoices ✓ 2. Draft reminders (running) 3. Send (needs approval)". Avoid: a paragraph "First I'll look for overdue invoices, then…" scrolled away in chat.
**Why.** Visibility of system status (Nielsen #1); a list is scannable and shows position, while chat hides the plan.

### Let users edit the plan before high-stakes runs
**Rule.** For costly or risky tasks, show the plan first and let the user reorder, remove, or add steps before execution.
**Apply when.** Runs that take minutes, cost real money, or touch many records.
**Do / Avoid.** Do: "Review plan → Run". Avoid: starting a 20-minute run the user would have scoped differently.
**Why.** Correcting a plan is cheap; correcting executed actions is not (plan-and-execute pattern).

### Delegate progressively
**Rule.** Start new users and new task types with more checkpoints; reduce approvals as the user grants scoped trust.
**Apply when.** Introducing an agent capability.
**Do / Avoid.** Do: first run asks at each send; later "Allow sending reminders for this task". Avoid: full autonomy on first use.
**Why.** Trust is earned by observed reliability; control that relaxes with evidence feels respectful rather than bureaucratic.

## 3. Tool calls and steps

- One line per step, in plain language, with an icon for the tool type: "Searched 12 files for 'termination'", "Read contract.pdf (pages 3–7)", "Ran tests: 2 failed".
- Collapsed by default; expanding shows inputs and outputs (truncated with "show more"). Developers and power users rely on this; everyone else gets the one-liner.
- Failed steps are marked in place with the error in plain language and a retry control for that step.
- Group repetitive steps ("Read 38 files") instead of listing each one.
- Show elapsed time per long step and in total.

## 4. Long-running and background runs

| Duration | Pattern |
|---|---|
| Under ~10 s | Inline steps in the conversation |
| 10 s to a few minutes | Step list with elapsed time; the user can scroll or work elsewhere in the app |
| Minutes to hours | Background task: its own status page or task inbox, notification on completion or when approval is needed, survives closing the tab |

- The run lives on the server (durable, resumable); the UI reconnects and replays state.
- Notifications carry the outcome ("Drafted 14 reminders; 1 needs your approval") and deep-link to the review screen.
- Offer "Stop" at any time; say what has already happened ("5 of 14 reminders sent") so stopping is not a guess.

## 5. Approvals

What the preview must show, by action type:

| Action | Preview contents |
|---|---|
| Send email or message | Recipients (expanded, not "3 people"), subject, full body, attachments |
| Payment, refund, purchase | Amount and currency, payee, source account, reference |
| Delete or archive | Count, a sample of items, whether it can be undone and for how long |
| Code or document change | Diff per file or section, files touched |
| Permission or sharing change | Who gains or loses which access |
| Bulk update | Count, fields changed, before/after for a sample, filter used |
| External API call with effects | Target system, operation, key parameters |

Rules:
- Generate the preview from the actual tool-call parameters, not from the model's summary of its intent.
- Buttons: "Approve and send" / "Edit" / "Deny". Deny asks for an optional reason and returns it to the agent.
- Edit opens the parameters in normal form controls; the edited version is what executes.
- Remembered permissions are scoped (this action type, this task or session), listed in settings, and revocable. Never pre-select "Always allow".
- Pending approvals do not block forever: show them in the task inbox and notify; expire with a clear state if the context goes stale.
- For many similar actions, allow batch approval with the full list available and a count in the button ("Approve 14 reminders").

## 6. Steering, interruption, handoff

- **Pause** and **Stop** are always available; Pause keeps state, Stop ends the run and reports what was done.
- **Redirect** mid-run ("also include last quarter") without restarting, when the backend supports it; otherwise say that the change restarts the run.
- **Take over**: the user can finish a step manually (edit the draft, pick the file) and hand control back.
- **Confidence signaling**: the agent flags steps where it guessed ("Assumed EUR because the invoice had no currency") so review focuses there.
- **Handoff to a human** (support agents, reviewers) is explicit: who, when, and what context they receive.

## 7. Reviewing results

- End every run with a summary of what changed (created, updated, sent, failed), linked to each item.
- Show diffs for edits and keep an activity log with timestamps and the tool calls behind each change.
- Offer undo or rollback for reversible changes, with its time window.
- Ask for feedback at the result, tied to the specific step or output that was wrong.

## 8. Multiplayer sessions

Shared agent sessions that a team can watch, redirect, and hand off were listed in Y Combinator's Fall 2026 Requests for Startups ("Multiplayer AI"). Design implications:
- Presence: who is watching; who is currently steering (one driver at a time, with a visible "take control").
- Every instruction and approval is attributed to a person in the activity log.
- Approvals respect each person's permissions, not the session creator's.
- Late joiners get a summary of the run so far, not a raw transcript.

## 9. Designing your product for agents as users

YC's 2026 requests ("Software for Agents", "Dynamic Software Interfaces") reflect a shift: your product may be operated by an AI agent on a user's behalf. Make it operable without breaking safety:
- Semantic HTML, real labels, and stable accessible names help agents and assistive technology alike.
- Offer an API or tool interface for common tasks so agents do not scrape the UI.
- WebMCP (a draft W3C Community Group spec, in early preview in Chromium behind a flag as of 2026-09) lets a page register tools for browser agents, including declaratively on forms. Experiment behind feature detection only; mark read-only tools as such.
- Destructive or irreversible actions still require a confirmation the agent cannot complete by itself.

## Sources

- NN/g, "10 Usability Heuristics" (visibility of system status, user control): https://www.nngroup.com/articles/ten-usability-heuristics/
- UI design for AI agents (plan-and-execute, progressive delegation): https://fuselabcreative.com/ui-design-for-ai-agents/
- Y Combinator Requests for Startups: https://www.ycombinator.com/rfs
- WebMCP draft specification: https://webmachinelearning.github.io/webmcp/ ; Chrome modern-web-guidance WebMCP guides: https://github.com/GoogleChrome/modern-web-guidance
- OWASP Top 10 for LLM Applications 2025 (LLM06 Excessive Agency): https://genai.owasp.org/llm-top-10/
- Anthropic, "Building Effective Agents": https://www.anthropic.com/engineering/building-effective-agents
