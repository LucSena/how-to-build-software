# Chat and copilot patterns

Implementation-level patterns for conversational surfaces, copilot panels, and inline assist. Code is framework-neutral TypeScript and HTML; adapt to your component library.

## Contents

1. Anatomy
2. Messages
3. Streaming render
4. Scroll behavior
5. Composer
6. Accessible markup
7. Long threads and performance
8. Copilot panels and inline assist
9. Mobile

## 1. Anatomy

```
┌ header: title of thread · model/mode (only if meaningful) · share · new chat ┐
│ message list (scroll container)                                              │
│   user message · assistant message (steps · text · citations · actions)      │
│   [Jump to latest] (only when scrolled up during streaming)                  │
│ composer: attachments chips · textarea · @ / menus · Send⇄Stop               │
└ footer hint: short disclosure ("AI can make mistakes. Check sources.")       ┘
```

Split view when there is an artifact: conversation on one side, the document, code, or canvas on the other. The artifact is the product; the chat steers it.

## 2. Messages

- Distinguish user and assistant by layout and label, not color alone.
- Actions per assistant message: copy, retry/regenerate, feedback, and "insert/apply" when the output targets an artifact. Show them on hover and focus on desktop, always visible on touch.
- Copy gives inline feedback on the button (checkmark for about 2 s), not a toast.
- Regenerations are versions of the same turn ("2 / 3" with arrows), not new messages.
- Editing a previous user message creates a branch from that point; make it clear the later conversation is replaced or kept as another branch.
- Timestamps on hover or grouped by day; they are rarely needed per message.

## 3. Streaming render

```ts
// Batch tokens per animation frame: one DOM update per frame, not per token.
let pending = "";
let scheduled = false;

function onToken(token: string) {
  pending += token;
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    appendToActiveMessage(pending);
    pending = "";
  });
}
```

- **Re-render only the tail.** Split the Markdown into blocks; completed blocks are memoized and never re-parsed; only the last, open block re-renders each frame.
- **Incomplete Markdown**: while a code fence, table, or link is open, render it as in-progress (a code block with a working state, a table without the missing rows) rather than raw symbols that snap into formatting later.
- **Reserve space** for code blocks and images to limit layout shift in the transcript.
- **Sanitize**: render Markdown with raw HTML disabled or sanitized; show link destinations; load images only from allow-listed hosts (auto-loaded image URLs can carry exfiltrated data, see ai-native-architecture's security reference).
- **Stop**: abort the fetch or stream (`AbortController`), keep the partial text, and mark it "Stopped". The server must also cancel the upstream model call.
- **Reconnect**: if the stream drops, keep the partial text, mark it incomplete, and offer Retry. Resume from the server if the backend supports resumable streams.

## 4. Scroll behavior

```ts
const PIN_THRESHOLD_PX = 48;
const isPinned = (el: HTMLElement) =>
  el.scrollHeight - el.scrollTop - el.clientHeight < PIN_THRESHOLD_PX;

function appendAndMaybeFollow(list: HTMLElement, update: () => void) {
  const pinned = isPinned(list);  // measure before the DOM changes
  update();
  if (pinned) list.scrollTop = list.scrollHeight;
  else showJumpToLatest();
}
```

- Follow new content only while the user is pinned to the bottom. Once they scroll up, stop following and show "Jump to latest".
- On send, scroll the user's new message into view once; do not fight subsequent manual scrolling.
- Restore scroll position when returning to a thread.
- CSS scroll anchoring (`overflow-anchor`) keeps the viewport stable when content above changes; make sure it is not disabled on the list.

## 5. Composer

```ts
textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    if (event.isComposing) return;   // IME candidate confirmation, not a send
    event.preventDefault();
    form.requestSubmit();
  }
});
```

- Enter sends, Shift+Enter inserts a newline in chat; in document-like multi-line editors, Cmd/Ctrl+Enter sends and Enter inserts a newline.
- Auto-grow the textarea up to a max height, then scroll inside it. `field-sizing: content` does this in CSS (Baseline since 2026-06); use a JS fallback where needed.
- A visible label (or visually hidden label) for the textarea; the placeholder is a hint, not the label.
- Send is disabled only while the input is empty or uploads are in flight; while streaming, Send becomes Stop in the same position and size.
- Attachments: drag-and-drop over the whole panel, paste of images and files, chips with name, size, progress, and remove. State limits (types, size, count) before upload, and reject with a specific message.
- `@` mentions and `/` commands open a listbox anchored to the caret: arrow keys to move, Enter or Tab to select, Esc to close, each option with a one-line description.
- Preserve the draft per thread across navigation and after errors.

## 6. Accessible markup

```html
<section aria-label="Conversation">
  <article aria-labelledby="msg-42-label" aria-busy="true">
    <h3 id="msg-42-label" class="visually-hidden">Assistant said</h3>
    <!-- streamed content -->
  </article>
</section>

<!-- One polite status region for the whole chat -->
<div id="chat-status" role="status" class="visually-hidden"></div>
```

- While streaming, `aria-busy="true"` on the message. On completion, set it to `false` and write a short message into the status region ("Response ready", or the full text if it is brief).
- Step updates ("Searching documents") go to the same polite region, throttled so they do not chatter.
- Urgent failures that block the user use `role="alert"`; everything else stays polite.
- Focus stays in the composer after sending. Provide a keyboard path to the latest message (a heading per message lets screen-reader users jump).
- Stop is a real button with an accessible name ("Stop generating") and a shortcut such as Esc.
- Under `prefers-reduced-motion: reduce`, no typing effects or shimmer; reveal in larger chunks.

## 7. Long threads and performance

- Apply `content-visibility: auto` with a `contain-intrinsic-size` estimate to older messages, or virtualize very long threads.
- Keep syntax highlighting and heavy Markdown extensions lazy-loaded; highlight a code block once it is complete.
- Do not keep every token event in state; append to a string or rope per message.

## 8. Copilot panels and inline assist

- **Side panel**: knows what the user is looking at (selection, current record) and shows that context as a removable chip ("Using: Invoice #1042"). Results offer "Insert", "Replace selection", or "Apply", each previewed as a diff.
- **Ghost text** (completions): low-contrast inline suggestion; Tab accepts, Esc dismisses, typing continues normally. Never steal focus; never accept on Enter where Enter already has a meaning.
- **Selection toolbar** (rewrite, shorten, translate, explain): acts on the selection, shows the result as a suggestion alongside the original, and keeps Undo available after applying.
- **Smart defaults and autofill**: mark AI-filled fields until the user reviews them; one action clears all suggestions.
- High-frequency inline actions get no entrance animation; they are used hundreds of times a day.

## 9. Mobile

- The composer sits above the on-screen keyboard and respects safe areas; use dynamic viewport units (`dvh`) so the layout does not jump when the keyboard opens.
- Message actions are always visible or in a long-press menu with a visible alternative; hover does not exist.
- Input font size at least 16 px on iOS web to prevent auto-zoom.
- Stop and Send targets are at least 44×44 pt (iOS) or 48×48 dp (Android).

## Sources

- Vercel Web Interface Guidelines (textarea behavior, optimistic updates, polite live regions): https://github.com/vercel-labs/web-interface-guidelines
- Chrome modern-web-guidance, IME-safe Enter to submit and `field-sizing`: https://github.com/GoogleChrome/modern-web-guidance
- WAI-ARIA live regions and `role="status"`: https://www.w3.org/WAI/ARIA/apg/ ; WCAG 2.2 SC 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages
- AI chat interface anatomy: https://www.setproduct.com/blog/ai-chat-interface-ui-design
- NN/g, "Response Times: The 3 Important Limits": https://www.nngroup.com/articles/response-times-3-important-limits/
