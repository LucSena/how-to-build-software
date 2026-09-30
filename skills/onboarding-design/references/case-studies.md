# Onboarding case studies

Compact cases: what happened → why it worked or failed → the rule it teaches. Use them to persuade a team or to find a working example of a pattern. Figures appear only where a source supports them; vendor figures are attributed.

---

### 1. NN/g: swipe-through tutorials do not help
**What.** Nielsen Norman Group tested deck-of-cards tutorials (swipeable instruction screens on first launch) with 70 users across 4 mobile apps. The tutorials did not improve task performance, made the interfaces seem more complicated than they were, and asked users to memorize instructions out of context.
**Rule.** Replace up-front tutorials with a usable UI and contextual hints; if the UI needs a tutorial, fix the UI first.
**Source.** https://www.nngroup.com/articles/mobile-tutorials/ ; https://www.nngroup.com/articles/onboarding-tutorials/

### 2. Duolingo: the lesson comes before the account
**What.** New users pick a language and a goal and complete a first lesson, earning progress within minutes, before being asked to create a profile to keep it ("gradual engagement").
**Rule.** When the core experience needs no identity, deliver it first and ask for the account as a way to save progress.
**Source.** https://growth.design/case-studies/duolingo-user-retention

### 3. Trello: the tutorial is the product
**What.** Trello's first board teaches Trello through its own cards: the instructions are cards you drag, open, and archive, so learning and using are the same action.
**Rule.** Teach by doing with real objects in the real UI; Apple's HIG makes the same point ("teach through interactivity").
**Source.** https://growth.design/case-studies/trello-user-onboarding

### 4. Slack: value needs the team
**What.** Slack's first run gets a user sending a message quickly, and it treats inviting teammates as central to activation, because a workspace with one person has no value.
**Rule.** In multiplayer products, include a collaboration event in the activation metric and design the invite step, placed after a first solo action, framed around something to share.
**Source.** https://www.appcues.com/blog/slack-user-onboarding-experience ; https://userpilot.com/blog/slack-onboarding/

### 5. Linear: a demo workspace that models good practice
**What.** Linear pre-populates a demo workspace showing how a well-run team uses it, offers domain-based joining at workspace creation, and teaches the command menu (⌘K) early as the main way to work.
**Rule.** Sample data should demonstrate the destination and good habits, not random filler; teach the one interaction model that unlocks everything else.
**Source.** https://www.candu.ai/blog/linear-onboarding-teardown ; https://supademo.com/user-flow-examples/linear

### 6. Notion: one question, a handful of templates
**What.** Notion asks what the user wants to use it for and how they work, then offers a small set of templates matched to the answer instead of a blank page or a huge gallery.
**Rule.** A personalization question earns its place only if it changes what the user sees next; keep matched templates to a handful.
**Source.** https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users

### 7. Headspace: the goal carries through the funnel
**What.** Headspace asks "What brings you to Headspace?" (sleep, stress, focus, anxiety, just checking it out), plus experience and preferred time, and uses the answers to shape the first sessions and reminders.
**Rule.** Echo the declared goal in later screens (first session, reminder, paywall headline) so the flow feels like one conversation.
**Source.** https://tearthemdown.substack.com/p/headspace

### 8. Stripe: keys in the code, sandbox by default
**What.** When signed in, Stripe's docs place the developer's own test API keys into code samples, so snippets run when pasted; test mode and sandboxes let developers experiment without touching live money.
**Rule.** For developer products, remove every copy-paste step between reading and a working call, and make the safe environment the default.
**Source.** https://docs.stripe.com/api ; https://stripe.dev/blog/avoiding-test-mode-tangles-with-stripe-sandboxes

### 9. Vercel + Supabase: template to live before configuration
**What.** Vercel can clone a starter template into a new Git repository and deploy it from the dashboard; integrations such as Supabase inject environment variables, so the first deploy works without manual setup.
**Rule.** Let the first success happen before configuration; configuration is easier once something is running.
**Source.** https://vercel.com/docs/git/vercel-for-github ; https://supabase.com/partners/integrations/vercel

### 10. PostHog: no blank dashboards
**What.** PostHog offers dashboard templates (official, team-scoped, and "save as template") and, in an empty dashboard, AI starter prompts that open the assistant with a pre-filled request that builds the insights.
**Rule.** Blank canvases get templates or starter prompts; AI products should never open on an empty prompt box.
**Source.** https://github.com/PostHog/posthog.com/blob/master/contents/docs/product-analytics/dashboards.mdx

### 11. Facebook: a setup threshold, not an aha
**What.** Facebook's widely cited "7 friends in 10 days" is, in Reforge's framing, a setup threshold: with enough friends, the feed becomes interesting, which is the aha.
**Rule.** Separate setup, aha, and habit moments; the metric you optimize (friends added) serves the experience you want (an interesting feed).
**Source.** https://www.reforge.com/guides/define-your-setup-moment

### 12. Feature adoption: most features go unused
**What.** Pendo's 2019 Feature Adoption Report (a product-analytics vendor, 615 subscriptions analyzed) found that about 80% of features in the average product are rarely or never used.
**Rule.** Announce and measure adoption of the features you ship (tiered announcements, "New" badges that expire, adoption within 30 days of exposure) before building more.
**Source.** https://www.pendo.io/resources/the-2019-feature-adoption-report/

### 13. Marketplaces: supply before demand
**What.** Marketplace operators consistently find supply is the slower, costlier side to onboard; Airbnb's early growth relied on hands-on, city-by-city supply work such as helping hosts with listings.
**Rule.** Stage seller onboarding with a checklist, autosave drafts, defer verification to the last responsible moment, and offer human help to early supply.
**Source.** https://www.sharetribe.com/academy/onboard-initial-marketplace-supply/ ; https://fasterthannormal.co/intersections/airbnb-two-sided-trust

## Sources

All URLs are listed with each case above. Summaries of third-party teardowns (Candu, Supademo, growth.design, Appcues, Userpilot) are secondary sources describing the named products; re-check the product itself before quoting details, since onboarding flows change often.
