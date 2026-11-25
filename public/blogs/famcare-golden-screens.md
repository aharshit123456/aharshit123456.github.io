# A Golden Image for Every Screen

*By Harshit Agarwal*

The FamCare customer app has a lot of screens nobody looks at on purpose: the payment-failed dialog, a pass with one session left, the order page for a refund that went to the wallet. I wanted every one of them rendered from the real code, in every state, on every pull request, so UI review means looking at pictures instead of imagining them. This post covers the screen-audit golden suite: how it renders the real app from captured API data and a frozen clock, how CI decides which screens a change can touch, and what went wrong once the team started relying on it.

<div class="stat-row">
  <div class="stat"><div class="stat-num">686</div><div class="stat-label">full-screen goldens on staging</div></div>
  <div class="stat"><div class="stat-num">73 / 627</div><div class="stat-label">screens / states at launch</div></div>
  <div class="stat"><div class="stat-num">~3.7 of 10</div><div class="stat-label">test files re-checked per PR, on average</div></div>
  <div class="stat"><div class="stat-num">~6 min</div><div class="stat-label">to regenerate every screen on CI</div></div>
</div>

## The problem

FamCare is an in-home care marketplace in India. Families book babysitting or elder care by the hour from a Flutter app. Each screen has a happy path and many unhappy ones: the slot you picked was just taken, the payment failed, you're outside service hours, the caregiver is running late. Those are the states customers hit when they're already annoyed, and they were the ones nobody saw during review.

We already had **component goldens**: Flutter golden tests that render one widget and compare it to a committed PNG. The whole team writes them. On staging there are 585 of those images, and I wrote most of the test files (checkout receipt, the voice-agent screens, the booking UI groups). But a component golden shows a widget in isolation, with hand-made data. It can't show you that a pass card on checkout pushes the consent line below the fold, or that a dialog appears over a half-loaded screen.

What I wanted was a picture of **every real screen, in every visually distinct state**, made by the production widgets, with data that looks like what the backend actually sends.

## The design

The suite lives under `test/golden/audit/`, one test file per area: onboarding, home, booking, checkout, passes, tracking, history and support, profile, plus two smaller ones added since. Each test pumps a real screen from `lib/`, drives it into a state through the network and real taps, and takes a full-page 390×844 shot.

<figure>
  <div class="diagram">
    <div class="node muted-node">Captured JSON<br>+ real images</div>
    <span class="arrow">→</span>
    <div class="node">FakeBackend<br>answers every http call</div>
    <span class="arrow">→</span>
    <div class="node accent">Real screen widget<br>clock frozen at AUDIT_NOW</div>
    <span class="arrow">→</span>
    <div class="node muted-node">390×844 PNG<br>compared on Linux CI</div>
  </div>
  <figcaption><b>Fig. 1</b> — one audit golden. Only the network is replaced; the screen, theme, fonts and feature-flag state are the production ones.</figcaption>
</figure>

A shared harness gives every test the same world:

- **A fake backend with real responses.** Every `http` request the app makes goes to an in-memory `FakeBackend`, preloaded with JSON captured from the real API: production for the public catalogue, banners, pass plans, site config and feature flags, and a sanitised staging test account for user-shaped data like bookings, wallet and notifications. A test overrides one route when it needs a state (`backend.json(...)`, `backend.fail(...)`).
- **Real images.** `CachedNetworkImage` and `Image.network` are served from a folder of captured files through a URL-to-file manifest. Unknown URLs render transparent and get listed.
- **Production flags, empty prefs, leaked timers cancelled** after each test. That last one mattered sooner than expected: the harness reproduced a timer on Home that was never cancelled in `dispose()` and fired after the screen was gone.

The rule for test authors is "don't edit `lib/` for a test". Drive the state through the fake backend and taps; use provider overrides only when there's no other way.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/gold-passes.webp" alt="Buy 3 Get 1 pass page with three of four sessions left and a daily limit" />
    <img src="/assets/famcare/case-studies/gold-recurring.webp" alt="Recurring booking setup with the day-of-week sheet open and every day ticked" />
    <img src="/assets/famcare/case-studies/gold-payment-failed.webp" alt="Checkout with a payment failed dialog offering cancel or try again" />
  </div>
  <figcaption><b>In the app</b> — three of the 686 audit goldens: a session pass with three visits left, the recurring-days sheet, and the payment-failed dialog over checkout. All rendered by the real screens from captured data.</figcaption>
</figure>

The first version landed in one pull request: 73 screens, 627 states, about 410 tests and 676 goldens. It now holds 686 PNGs across ten test files.

## Decision 1: freeze the wall clock, not the app

The app reads `DateTime.now()` directly. Countdowns, "Next: 6:30 AM", open and closed hours and pass validity all change from one run to the next, so a naive golden would never match twice.

> [!NOTE]
> **Rejected: inject a clock into the app.** That's the textbook fix, but it means touching every screen that reads the time, in a codebase several people ship to every day. It also breaks the "don't edit `lib/` for a test" rule on day one.

So the clock is frozen from outside. Every audit run pins wall time to `AUDIT_NOW`, 11:20 AM IST on the day the fixtures were captured, so slot lists, pass validity and countdowns all line up with the captured data.

The first attempt used libfaketime. Its interposed `gettimeofday()` returned an error inside the Flutter tool process, which the Dart VM treats as fatal, so the run crashed before any test started. I replaced it the same day with an 80-line `LD_PRELOAD` shim in C. It pins `gettimeofday`, `clock_gettime(CLOCK_REALTIME)` and `time()`, and only inside the `flutter_tester` process. Every other process (the Flutter tool, `dart`, `git`) gets the real functions. The monotonic clock is untouched, so timers and animations still run normally while the date stands still.

## Decision 2: Linux only, and CI makes the baseline

Fonts and anti-aliasing render differently on macOS and Linux. Our component goldens get around that with a tolerant comparator. The audit suite takes the stricter route: its goldens only match on the GitHub Actions Linux runner with the frozen clock.

- `dart_test.yaml` skips the `audit` tag, so a plain `flutter test` on a laptop never runs them.
- `tool/golden_audit/run.sh` refuses to run on anything but Linux and explains what to do instead.

> [!NOTE]
> **Rejected: generate the baseline on a developer's machine, or in Docker locally.** Either one makes the baseline depend on whose laptop produced it, and a full local run is heavy. The very first baseline of 676 PNGs was committed by the CI bot, not by me.

## Decision 3: accept a UI change with a label

If only CI can render the truth, only CI can update it. So accepting a visual change is a PR label, `update-audit-goldens`, which starts `golden-audit-update.yml`:

<figure>
  <div class="diagram">
    <div class="node muted-node">Label added</div>
    <span class="arrow">→</span>
    <div class="node">plan<br>pin the commit SHA</div>
    <span class="arrow">→</span>
    <div class="node accent">regenerate<br>one job per area,<br>in parallel</div>
    <span class="arrow">→</span>
    <div class="node">commit PNGs +<br>coverage map</div>
    <span class="arrow">→</span>
    <div class="node muted-node">re-run QA,<br>drop label, comment</div>
  </div>
  <figcaption><b>Fig. 2</b> — the label workflow. If the branch moves while shards render, the commit step refuses and asks for the label again.</figcaption>
</figure>

A few details made it safe to leave on:

- **Every shard renders the same pinned commit.** The commit job checks that the branch head still equals that SHA before pushing anything.
- **Pushes made with the workflow token don't start new PR runs**, so the workflow dispatches Flutter QA on the new commit itself.
- **The bot removes the label and leaves a comment** saying to review the PNG changes before merging. An update accepts whatever renders now. The label is a request to look, not a stamp of approval.

## Decision 4: only re-check what a change can touch

Running every audit file on every PR took about ten minutes in one job, including PRs that only touched docs. The first fix, the same afternoon, was a path filter: skip the job unless `lib/`, assets, pubspec or the audit tooling changed. That still ran all eight areas for a one-line change in one screen.

The second version, also that day, selects test files from **line coverage**. `coverage_map.json` records, for every `lib/` file, which audit test files executed which lines. The label workflow refreshes it on every update. For a PR, `select_tests.py`:

- runs **everything** for changes that can alter every render: pubspec, assets, the theme, the harness, fixtures, the runner and the QA workflow itself;
- for each changed `lib/` hunk, runs the test files that **executed those lines**, translating line numbers from the map's commit to the PR's base. Comment- and import-only hunks are ignored;
- for every top-level or `static` `const`/`final`, or `enum`, that the diff touches, also runs the tests that use any file referencing that name. Constants are inlined at compile time, so coverage alone can't see who reads them;
- falls back to every test that uses a file when a hunk touches no executable line.

Replayed over 30 staging PRs at the time, it picked about 3.4 of 8 test files on average. Across the last 60 PR runs on CI, a quarter selected nothing, a little under a quarter ran all ten (usually design-token or lockfile changes), and the average was about 3.7 of 10.

## What a run costs

| Run | Jobs | Wall clock | Billed Linux minutes |
|---|---|---|---|
| One audit shard (verify) | 1 | 1–3 min | 2–3 |
| Typical PR (~4 shards) | ~6 | ~3 min | ~12 |
| Full regenerate via label | 13 | ~6 min | ~40 |

At GitHub's list price for Linux runners, a full regeneration is roughly a quarter of a dollar, and a typical PR check costs a few cents. The biggest line on the app's CI bill is macOS builds for over-the-air patches, not goldens.

## Reviewing UI as golden diffs

The point of all this is the diff. A PR that changes the booking flow now shows, in the files tab, every booking state it changed, before and after, rendered from the same captured data.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/gold-slots-before.webp" alt="Booking screen evening tab as first captured, with plain slot chips" />
    <img src="/assets/famcare/case-studies/gold-slots-after.webp" alt="Same booking golden after the redesign, with a Sold out chip and the slots grouped in a card" />
  </div>
  <figcaption><b>In the app</b> — the same golden, <code>booking__scheduled_evening_tab</code>, at launch and three weeks later, after a teammate's booking-flow redesign. Same data, same frozen time: the only difference is the code.</figcaption>
</figure>

Some ways the team has used it:

- **Design options from real data.** To decide how a slot chip should show a price drop, I rendered four options as goldens from the same real afternoon of slots: a small saving label (what we had), the price you pay with the old one struck through, a percentage tag, and a "Lowest" flag with a one-line reason above the grid. The team compared real numbers on real chips instead of mock-ups. That review also surfaced two gaps: the ten-minute price hold had no visible countdown, and clearing a coupon when a drop applies had no explanation.
- **Every state of a new feature.** The flash-sale app work came with 15 component goldens and 14 new audit cases: the Home strip at each discount, its final minutes, sold out, ended, logged out, the preselected slot, the one-hour notice and the checkout row. Their fixtures are pinned to `AUDIT_NOW`, so the countdowns read the same on every run.
- **A design critique of the whole app.** The first use of the suite was a written critique against 2x renders: 974 issues across the 627 states (125 critical) and 128 code findings, each pointing at a real rendered state. The headline was uncomfortable and useful: the app often told parents different things about the same money on different screens, like a refund time with three different wordings depending on where you looked.
- **A nudge on every PR.** A PR labeller I added flags any change to a visual file as `ui-change`, and as `needs-golden` when no golden test renders that file. It never fails the PR. It keeps one sticky comment up to date.

## What went wrong

> [!WARNING]
> **The baseline drifted past red checks.** Audit failures weren't a required check, so for a couple of weeks in November red audit shards didn't stop merges. The baseline on staging fell behind the app. The next PR to use the label got a diff of hundreds of PNGs that had nothing to do with it.

That drift then caught me out. On the catch-up day, the label ran on several branches and each run rewrote about 300 PNGs. I assumed it was re-encoding noise and reverted them on those branches. Decoding the images later showed real pixel changes, like a checkout screen that had gained a pass card. A later regeneration put the right images back on staging. The lesson is now a habit: **compare decoded pixels, never PNG bytes**, before calling a golden change noise.

Two smaller ones:

- **The audit suite inherited a 25% tolerance.** Component goldens use a comparator that passes unless more than a quarter of the pixels differ, so macOS-made goldens pass on Linux. The audit tests sit in the same folder and picked it up. Every failure I looked at was well above that line (40–67% of pixels). Comparing launch to today, roughly four in five of the screens that visibly changed moved less than a quarter of their pixels. So the check catches layout shifts, while the label diff is what catches a wrong price or colour.
- **Copy changes break taps.** Tests drive screens through real taps on visible text. When "Notify me!" became "Notify me" and "Care guidelines" gained a capital G, audit tests failed on staging until someone updated them.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/gold-diff.webp" alt="A failing golden: expected image, rendered image, and the isolated pixel diff of a booking confirmation screen" />
  </div>
  <figcaption><b>In the app</b> — what a failure hands you (here a component golden): the committed image, what the code rendered, and the isolated diff. A taller card pushed everything below it down, so most of the screen counts as changed.</figcaption>
</figure>

## Results

- **686 full-screen goldens** on staging, covering onboarding to support, plus 585 component goldens.
- **The whole infrastructure shipped in one day**: the harness and first 676 goldens, the clock shim, the path filter and then coverage-based selection.
- **A typical PR re-checks about a third of the suite** in around three minutes of wall clock. A quarter of PRs skip it entirely.
- **Accepting a UI change is a label**, and nobody's laptop renders the baseline.
- **UI review happens on pictures**: design options, new features and redesigns all arrive as before/after images of the real screens.

## What's next

- **Zero tolerance for the audit suite**, with its own comparator, since it only ever renders on one OS with one clock.
- **Make the audit check count**, so the baseline can't drift behind staging again.
- **Re-capture fixtures** when an endpoint's shape changes, from read-only GETs rather than hand edits, so the goldens keep showing what the backend really returns.

---

*Stack in this piece: Flutter, flutter_test and golden_toolkit, GitHub Actions on Linux runners, a C `LD_PRELOAD` shim, Python for test selection and coverage maps, optipng. Counts are from the app repository's staging branch and its CI runs in October and November 2026.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
