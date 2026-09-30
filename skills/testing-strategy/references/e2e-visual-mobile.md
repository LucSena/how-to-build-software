# End-to-End, Visual Regression, and Mobile Testing

Defaults for the slowest, most expensive test levels. Keep these suites small and focused on what only they can catch; push everything else down to unit and integration tests. Tool names are as of 2026-09 — use what the project already has.

## Contents
1. What deserves an end-to-end test
2. Playwright defaults (web)
3. Visual regression
4. Mobile testing: iOS, Android, React Native, Flutter
5. CI setup for slow suites

## 1. What deserves an end-to-end test

- The 5–20 journeys whose failure would be an incident: sign up/sign in, the core workflow, checkout/payment, permissions boundaries (user A can't see user B's data), critical integrations.
- Things only a real browser/device reveals: routing, cookies/sessions, redirects, file upload/download, service workers.
- **Not** every form validation rule, every error message, or every permutation — those belong in component/integration tests.

## 2. Playwright defaults (web)

**Locators** (in priority order): `getByRole(role, { name })` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId` (last resort). Role-based locators double as an accessibility check. Avoid CSS/XPath tied to layout.

**Assertions.** Use web-first assertions that retry until timeout: `await expect(page.getByRole("alert")).toHaveText("Payment failed")`. Never read a value and assert synchronously (`expect(await el.textContent()).toBe(...)`) — it doesn't wait.

**No manual waits.** No `page.waitForTimeout`. Wait for a visible state or a specific response (`page.waitForResponse`) only when no UI signal exists.

**Isolation.** Each test gets a fresh browser context (the default). Create test data per test through the API or DB seeding helpers, with unique names/tenants, so tests run in parallel without collisions.

**Authentication.** Log in once in a setup project, save `storageState`, and reuse it; keep one test that exercises the real login UI.

**Network.** Let your own backend run for real. Mock only third parties you can't control (`page.route`) — payment widgets, analytics, maps — and keep at least one sandbox test for the real integration elsewhere.

**Structure.** Fixtures for shared setup; small page objects or helper functions only for flows reused across files. Don't build a deep page-object hierarchy.

**Debuggability.** `trace: "on-first-retry"`, screenshots and video on failure; open traces with the trace viewer before guessing.

**Coverage of environments.** Run the main suite on one browser; run a smoke subset on WebKit and Firefox and on a mobile viewport (`devices[...]`) if users are there.

**Extras worth adding.** `@axe-core/playwright` scans on key pages (see `accessibility`); `page.clock` for time-dependent UI.

```ts
test("customer can pay an open invoice", async ({ page, api }) => {
  const invoice = await api.createInvoice({ amountCents: 4200 });   // seeded per test
  await page.goto(`/invoices/${invoice.id}`);
  await page.getByRole("button", { name: "Pay €42.00" }).click();
  await expect(page.getByRole("status")).toHaveText("Paid");
});
```

## 3. Visual regression

**Scope.** Design-system components (all variants × light/dark × key sizes) and a handful of key screens. Not every page.

**Tools.** Playwright `expect(page).toHaveScreenshot()` for screen-level checks; Storybook-based services (Chromatic, Percy, Lost Pixel, or similar) for component libraries with review workflows.

**Stability rules.**
- Generate and compare baselines in the **same environment** (same OS, browser build, fonts) — typically the CI Docker image. Font rendering differs across OSes and causes false diffs.
- Disable animations and caret blinking (`animations: "disabled"`); wait for fonts and images to load.
- Freeze time and use fixed seed data; mask dynamic regions (avatars, timestamps, ads).
- Set a small tolerance (`maxDiffPixelRatio` or `threshold`) rather than zero; tune it with evidence, never raise it to silence a real diff.
- Baseline updates happen in the PR that changes the UI, and reviewers look at the diff images.

## 4. Mobile testing

**Shape.** Most tests run off-device: view models, reducers, domain logic, and data layer on the JVM/host. Add a few UI flows on emulators/simulators and screenshot tests for key screens. Device UI tests are the slowest and flakiest layer — keep them few.

**iOS**
- Unit: XCTest or Swift Testing (`@Test`, `#expect`) for view models and domain logic; inject clocks, network clients, and persistence.
- UI: XCUITest for critical flows; locate by accessibility identifiers/labels; pass launch arguments to stub the backend and disable animations.
- Snapshot: a snapshot library (e.g., swift-snapshot-testing) for SwiftUI/UIKit views across Dynamic Type sizes, dark mode, and locales.

**Android**
- Unit: JUnit on the JVM; Robolectric when Android framework classes are needed; `kotlinx-coroutines-test` for coroutines and Flows.
- UI: Compose UI tests (`createComposeRule`, semantics-based finders) and Espresso for Views; prefer testing screens with fake repositories.
- Screenshot: JVM-based screenshot tools (Paparazzi, Roborazzi, or Compose Preview Screenshot Testing) — fast and device-free.

**React Native**
- Jest + React Native Testing Library for components and hooks.
- E2E: Detox or Maestro for critical flows.

**Flutter**
- Unit and widget tests (`testWidgets`) for most coverage; golden tests for visual checks; `integration_test` for on-device flows.

**Cross-platform flows.** Maestro (YAML flows) works across native, React Native, and Flutter when the team wants one e2e tool.

**Mobile-specific cases to cover** (at the cheapest level that can): offline and flaky network, permission denied/revoked, app backgrounded and restored (Android process death), deep links, push notification tap, large text / Dynamic Type, dark mode, RTL locales, small and large screens (tablets/foldables), slow devices.

**Real devices.** Emulators/simulators in CI for every PR; a small real-device pass (a device cloud such as Firebase Test Lab, AWS Device Farm, or BrowserStack) before releases for hardware-dependent features (camera, biometrics, Bluetooth, performance).

## 5. CI setup for slow suites

- Run unit + integration on every push; e2e smoke on every PR; full e2e and visual suites on PRs touching UI or before merge to main, according to runtime.
- Shard large suites across workers (Playwright `--shard`), and keep the critical-path suite under ~10–15 minutes so people don't bypass it.
- Upload traces, screenshots, videos, and logs as CI artifacts on failure.
- Report "passed on retry" as flaky (see `flaky-tests.md`).

## Sources

- Playwright best practices: https://playwright.dev/docs/best-practices ; locators: https://playwright.dev/docs/locators ; assertions: https://playwright.dev/docs/test-assertions ; authentication: https://playwright.dev/docs/auth ; visual comparisons: https://playwright.dev/docs/test-snapshots ; trace viewer: https://playwright.dev/docs/trace-viewer
- axe-core Playwright integration: https://playwright.dev/docs/accessibility-testing
- Apple, Swift Testing: https://developer.apple.com/xcode/swift-testing/ ; XCUITest (User Interface Tests): https://developer.apple.com/documentation/xctest/user_interface_tests
- Android testing fundamentals: https://developer.android.com/training/testing/fundamentals ; Compose testing: https://developer.android.com/develop/ui/compose/testing
- Paparazzi: https://github.com/cashapp/paparazzi ; Roborazzi: https://github.com/takahirom/roborazzi
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/ ; Detox: https://wix.github.io/Detox/ ; Maestro: https://maestro.mobile.dev/
- Flutter testing overview: https://docs.flutter.dev/testing/overview
- web.dev, testing strategies: https://web.dev/articles/ta-strategies
