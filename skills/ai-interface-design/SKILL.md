---
name: ai-interface-design
description: Use when designing or building the user-facing side of an AI feature — chat interfaces, copilots and side panels, inline assist (autocomplete, rewrite, summarize in place), agent and background-task UIs, or generative UI that renders components from model output. Covers choosing the surface (and when chat is the wrong one), streaming text UX, stop/retry/edit controls, latency masking and progress, showing plans, tool calls, and sources or citations, uncertainty and error states, human-in-the-loop approvals with previews and undo, A2UI and AG-UI, composer affordances (suggested prompts, attachments, @mentions, slash commands), memory controls, AI disclosure and trust, accessible streaming with live regions, and empty states that teach capabilities. Also use when the user says "build a ChatGPT-like UI", "add an AI assistant", "the agent feels like a black box", "users don't trust the answers", or "the chat feels slow". Not for model, RAG, eval, or injection architecture (use ai-native-architecture).
license: MIT
metadata:
  version: "1.0.0"
  category: design
  related: "ai-native-architecture interaction-design accessibility ux-principles motion-design"
---

# AI Interface Design

An AI feature is a slow, fallible collaborator. The interface's job is to make its work visible, its output checkable, and the user unmistakably in control. Choose the surface from the task (chat is one option and often not the best), design every state including failure, and never make the machine look more human, more certain, or busier than it is.

## Before you start

If `.agents/project-context.md` exists (or `.claude/project-context.md`), read it first and treat it as ground truth for stack, platforms, scale, design system, and constraints. Only ask for what it does not cover. If it does not exist and the task is larger than a quick fix, suggest running the `project-context` skill — but never block on it.

## Core principles

1. **Fit the surface to the task, not the trend.** Chat hides structure and capabilities; forms, tables, and inline actions often serve the job better.
2. **Show real status within 100 ms and real progress after about 1 s.** Silence reads as broken, and fake progress destroys trust once noticed.
3. **The user can always stop, edit, retry, and undo.** Control is what makes a non-deterministic system tolerable.
4. **Make output checkable.** Sources, visible work, and diffs let users calibrate trust against evidence instead of tone.
5. **Preview side effects; approve the exact action.** A consequential action needs a human decision on concrete details, rendered from the real tool call.
6. **Be honest about the machine.** Disclose AI, do not fake emotions, typing, or confidence.
7. **Design failure as a first-class state.** Every response can fail, stop halfway, or be confidently wrong.

## Workflow

- [ ] **Define the job and the risk**: what the user delegates, how they verify the result, the cost of a wrong answer, and which actions have side effects.
- [ ] **Choose the surface** from the table below; write one line on why chat is or is not right.
- [ ] **Map the request state machine**: idle → submitted → working (steps) → streaming → complete | stopped | partial | error | needs approval. Check: every state has a design and copy.
- [ ] **Design the output**: prose vs components, citations, uncertainty cues, and actions on the result (copy, insert, apply, edit, regenerate).
- [ ] **Design control**: stop, retry, edit prompt, undo; approvals with previews for side effects (risk tiers below).
- [ ] **Design the empty state and the composer**: capabilities, grounded starters, attachments, mentions, commands.
- [ ] **Accessibility pass**: live-region politeness, focus, keyboard, reduced motion (rules below).
- [ ] **Test under real conditions**: throttled network, 10–30 s responses, injected failures mid-stream, very long outputs, IME and RTL input, a screen reader. Fix and repeat until the Gotchas are clean.

## Choosing the surface

| Surface | Best for | Avoid when |
|---|---|---|
| Chat | Open-ended questions, exploration, multi-turn clarification | The task has a known structure, results need comparing, or the action repeats many times a day |
| Copilot side panel | Help next to a primary artifact (document, code, dashboard) | The help is a one-step edit; do it inline |
| Inline assist | Rewrite, complete, summarize, or explain in place (ghost text, selection menu) | Multi-step work that needs a plan |
| Agent / task UI | Delegated multi-step work lasting minutes, reviewed at the end | Quick answers; the overhead feels bureaucratic |
| Canvas / split view | Co-creating an artifact: chat steers, the artifact is the product | Pure Q&A |
| Generative UI | Answers best shown as tables, charts, cards, or forms | Free-form explanation |
| Invisible AI | Classification, extraction, ranking, smart defaults shown as ordinary UI with review and override | Users must know AI is involved (legal, high stakes): disclose it |

**Chat is the wrong default when**: users do not know what to ask (the blank-box problem); the task is structured (booking, filtering, settings), where controls are faster and verifiable; the user needs to scan or compare (use a table); the action is high-frequency (use a button or shortcut); or the output is an artifact to edit (put it in an editor, not a bubble). A strong hybrid: natural-language input that **fills visible, editable structure** ("overdue invoices over $5k in the EU" → filters the user can see and adjust).

## Streaming UX

- Acknowledge the send within 100 ms: the message appears in the thread and **Send turns into Stop**.
- Aim for the first token in under about 1 s; until it arrives, show a working indicator or the first real step ("Searching your documents…").
- Render tokens as they arrive, batched per animation frame. Never slow the reveal below the model's real speed.
- Handle incomplete Markdown mid-stream (unclosed code fences, half tables, partial links) without re-laying-out the whole transcript per token; reserve space for code blocks.
- Auto-scroll only while the user is pinned to the bottom; when they scroll up, stop following and show "Jump to latest".
- **Stop** keeps the partial output, marks it as stopped, and aborts the upstream request.
- After completion: copy (inline checkmark, not a toast), retry/regenerate, edit the prompt, feedback; show versions ("2 / 3") when regenerating.
- Composer: Enter sends and Shift+Enter adds a newline (or Cmd/Ctrl+Enter sends in multi-line editors). Check `event.isComposing` so IME users (Japanese, Chinese, Korean) do not send half-composed text. Keep the draft if sending fails.

Detail and code: `references/chat-patterns.md`.

## Latency and progress

| Wait | Show |
|---|---|
| < 0.1 s | Nothing extra; it feels instant |
| 0.1–1 s | A subtle indicator, shown only after a 150–300 ms delay and kept visible at least 300–500 ms to avoid flicker |
| 1–10 s | What is happening, from real events: "Reading 3 files", "Querying invoices" |
| > 10 s | A step list or determinate progress with elapsed time; let the user keep working and notify on completion |
| Minutes | A background task with its own status page and a notification; closing the tab must not kill it |

Stream useful partial results early (the first section, the first rows). Every progress message maps to a real event from the run; if nothing is happening, do not animate as if it were.

## Showing work and sources

- **Plans** appear as a live checklist or stepper, not buried in chat prose.
- **Tool calls** collapse to one line ("Searched 12 files", "Read invoice #1042") that expands to inputs and outputs.
- **Reasoning** is shown as a short, collapsible summary when useful; never present it as a guarantee of correctness.
- **Citations** sit next to the claim they support, preview the quoted passage on hover or tap, and link to the exact location. Distinguish sources: "your documents", "the web", "general knowledge".
- Content that leaves the AI surface (inserted into a doc, sent in an email) carries its provenance where it matters.

## Uncertainty and failure

- Express uncertainty in words and structure: "I couldn't find a termination clause in this contract" beats a confident guess. Highlight low-confidence fields for review. Show numeric confidence only if it is calibrated.
- Every failure keeps the user's input and offers a next step:

| Failure | Design |
|---|---|
| Connection drops mid-stream | Keep the partial text, mark it incomplete, offer Retry |
| Rate limit or quota reached | Say when it resets and what still works; keep the draft |
| Input too long | Say what to remove, or offer a new thread seeded with a summary |
| Tool or step failed | Name the failed step; offer retry of that step or continue without it |
| Refusal | Say plainly what cannot be done and offer an allowed alternative; no lecture |
| Long task timed out | Show what was completed and offer to continue |
| Malformed output | Retry automatically once, then show an error with Retry |
| User says it is wrong | Edit and regenerate; feedback with an optional reason |

## Approvals and side effects

| Action type | Default |
|---|---|
| Read-only (search, read, summarize) | Run automatically; list in the steps |
| Reversible and user-owned (draft, edit own document) | Apply with a visible diff and Undo |
| Irreversible, external, financial, permission-changing, or bulk (send, pay, delete, publish, share) | Preview + explicit approval: Approve / Edit / Deny |

- The preview shows the exact effect: diff, recipients, amount, affected count ("Delete 214 rows"). Render it **from the actual tool-call parameters**, never from the model's own description of what it will do.
- The approve button names the action and object ("Send to 3 recipients"), never "OK".
- Remembered permissions are scoped ("for this task" or "for this session") and revocable in settings; never broad by default.
- Keep an activity log of what the agent did, with undo where possible.

Agent-specific patterns (background runs, handoff, multiplayer sessions, designing for agents as users): `references/agent-ux.md`.

## Generative UI

Default: the model chooses from **your** allow-listed components and supplies data; your code validates the props with a schema and renders them with design-system tokens, falling back to text if validation fails. Levels:
1. **Static**: a tool call maps to a pre-built component (weather card, invoice table).
2. **Declarative**: the model emits a constrained UI spec (for example Google's A2UI) rendered from an allow-list.
3. **Open-ended**: the model writes UI code, rendered only in a sandboxed iframe without credentials.

AG-UI standardizes the agent-to-UI event stream (run lifecycle, text deltas, tool calls, state deltas). A2UI and AG-UI are emerging as of 2026-09: put them behind an adapter and check their maturity before depending on them. Detail: `references/generative-ui.md`.

## Composer and input affordances

- Suggested prompts are grounded in the user's context or data ("Summarize the 4 overdue invoices"), 3–4 at most, and disappear once the user starts. Never a generic "Ask me anything".
- Attachments: drag, drop, and paste; chips with name, size, remove, and upload progress; limits stated before upload.
- `@` mentions pull specific context (files, people, records); `/` commands trigger actions. Both open keyboard-navigable menus with descriptions.
- Mode or model pickers appear only when the choice changes the outcome; name modes by outcome ("Fast", "Thorough") for general users.

## Memory, transparency, and trust

- Show when memory or personal context is used ("Using your preference: metric units"). Users can view, edit, and delete memories, and start a temporary chat that is not remembered.
- Say what is sent to an AI provider and whether it is used for training, at the point of use; link to the setting.
- Disclose AI: label AI-generated content others will see, never present a bot as a named human, and make handoff to a real person explicit.
- Show usage and remaining quota for metered features before the user hits the limit.

## Accessibility of streaming content

- Mark the streaming message `aria-busy="true"`; when it completes, announce once through a polite live region ("Response ready", or the text if short). Never announce every token.
- Status text ("Searching…") uses `role="status"` (polite). Reserve `role="alert"` for urgent failures.
- Each message is a labeled article or has a heading ("Assistant said") so screen-reader users can jump between messages.
- Keep focus in the composer after sending; do not move focus to new content. Stop is keyboard-reachable (Esc is a common shortcut).
- Under `prefers-reduced-motion`, drop typing and shimmer effects and reveal text in larger chunks.

## Empty states that teach

State what the assistant can and cannot do ("I can search your project's files and tickets; I can't see your email"), show 3–4 starters grounded in the user's data, and, for agents, offer task templates. An empty state is the capability manual most users will ever read.

## Gotchas

- **Chat as the only interface** for a structured task (filtering, booking, settings). Offer controls, or turn language into visible, editable structure.
- **Fake typing and fake thinking**: timed dots, a blinking cursor, or step text shown when nothing is running. Show real events or a neutral indicator.
- **Yanking the scroll** to the bottom while the user reads earlier output.
- **Stop that only hides the stream** while the request keeps running and billing.
- **Losing the prompt on error.** Always restore the input.
- **Announcing every token** to screen readers, or nothing at all.
- **Approval dialogs written by the model** ("I'll just update a few records") instead of generated from the actual call ("Update 1,204 records in Production").
- **"Always allow" as the default** permission choice.
- **Citations that link to a whole document**, or to nothing, so users cannot verify the claim.
- **Numeric confidence scores** that are not calibrated; users treat 87% as meaningful.
- **Rendering model HTML directly**, or letting generated components use arbitrary styles instead of design-system tokens.
- **Anthropomorphic manipulation** (ethics floor): simulated feelings to drive engagement ("I'll miss you"), guilt when leaving, sycophantic praise in UI copy, human names and photos on bots, nudges to come back. Never build these.
- **Routing cancellation or refunds through a chatbot** that loops instead of completing the task. That is obstruction.
- **Enter submits during IME composition**, breaking input for CJK users.

## Output format

For a design or review, produce:

```
AI interface spec
- Job & risk: what is delegated, how it is verified, cost of error
- Surface: chosen surface + why (and why not chat, if not)
- States: | state | what the user sees | controls | copy |  (idle, working, streaming, complete, stopped, partial, error, needs approval)
- Output: format (prose/components), citations, uncertainty cues, actions on output
- Control: stop/retry/edit/undo; approval matrix by action type
- Composer & empty state: starters, attachments, mentions/commands, capability statement
- Accessibility: live regions, focus, keyboard, reduced motion
- Test plan: slow network, mid-stream failure, long output, IME/RTL, screen reader
```

For implementations, end with **Done / Verified** (states exercised, a11y checks run) **/ Not checked**.

## References

| File | Read when |
|---|---|
| `references/chat-patterns.md` | building a chat or copilot surface: message list, streaming render, Markdown mid-stream, scroll anchoring, composer, attachments, live-region code |
| `references/agent-ux.md` | designing agent or background-task UIs: plans, tool-call display, progress, approvals, permissions, handoff, multiplayer sessions, making your app usable by agents |
| `references/generative-ui.md` | rendering components from model output, choosing static vs declarative vs open-ended, validating props, sandboxing, or evaluating A2UI and AG-UI |

## Related skills

- `ai-native-architecture` — streaming transport, tools, RAG, evals, and prompt-injection defenses behind the UI.
- `interaction-design` — general loading, empty, error, toast, undo, and confirmation patterns.
- `accessibility` — WCAG 2.2 AA details beyond streaming content.
- `ux-principles` — response-time limits, heuristics, and dark-pattern taxonomy.
- `motion-design` — restrained motion for streaming and progress, reduced-motion variants.
