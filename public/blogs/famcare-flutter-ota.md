# Shipping a Flutter App Without the App Store

*By Harshit Agarwal*

FamCare's customer app is Flutter, and like every mobile team we used to wait on store review for every fix. Since September we ship most Dart changes over the air with Shorebird instead: a GitHub Actions workflow builds a patch, and phones pick it up on their next launch. This post covers the pipeline, the reasons Shorebird refuses a patch, the time patching from the wrong branch would have deleted a live feature, what to do about builds a patch can't fix, and what all this does to the CI bill.

<div class="stat-row">
  <div class="stat"><div class="stat-num">134</div><div class="stat-label">patch workflow runs in ten weeks</div></div>
  <div class="stat"><div class="stat-num">~1.4–2.7 MB</div><div class="stat-label">a typical patch download, per platform</div></div>
  <div class="stat"><div class="stat-num">~20 min</div><div class="stat-label">an iOS patch on a hosted macOS runner</div></div>
  <div class="stat"><div class="stat-num">10×</div><div class="stat-label">macOS minute vs Linux minute</div></div>
</div>

---

## The problem: a store review for every fix

FamCare is an in-home care marketplace in India. Families book babysitting and elder care by the hour from the app. When a booking screen shows the wrong price or a sheet traps someone, the fix is usually a few lines of Dart. Getting those few lines to phones used to mean a full store build, a Play and App Store review, and then waiting for people to actually update.

Shorebird swaps the compiled Dart code inside an already-installed Flutter app. It can't touch native code or assets. But most of our day-to-day changes are Dart: copy, layout, booking logic, analytics events. That is exactly the part Shorebird can replace.

## Release, then patch

I added Shorebird to the app and wrote the first version of the release and patch workflows in mid-September. A teammate added per-platform dispatch and the iOS signing fixes that followed. The pipeline has two halves.

**A release** is a store build that Shorebird knows about. `deploy.yml` builds the Android bundle and the iOS archive with `shorebird release` instead of plain `flutter build`, uploads it to the stores, and registers that exact binary with Shorebird under its version and build number (for example `1.0.577+677`).

**A patch** is a manual `workflow_dispatch` of `shorebird-patch.yml`. Whoever dispatches it picks the branch to build, the platform, and the release version to patch. The workflow builds the Dart from that branch, Shorebird checks it against the stored release, and if it's compatible it goes out.

<figure>
  <div class="diagram">
    <div class="node muted-node">deploy.yml<br>shorebird release</div>
    <span class="arrow">→</span>
    <div class="node">Play / App Store<br>1.0.577+677</div>
    <span class="arrow">→</span>
    <div class="node accent">shorebird-patch.yml<br>branch + release version</div>
    <span class="arrow">→</span>
    <div class="node">Stable track<br>every user on 677</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Next launch:<br>download, then restart</div>
  </div>
  <figcaption><b>Fig. 1</b> — a release is built once and goes through the store. Patches are built from a branch, checked against that release, and published to everyone on it.</figcaption>
</figure>

### The first patches reached nobody

My first version got the release half wrong. `deploy.yml` uploaded a plain Flutter build to the Play Store and then pushed a `shorebird-release-*` tag. That tag triggered `shorebird-release.yml`, which built a *second* bundle with Shorebird's engine and registered it. That second bundle was never uploaded anywhere.

So the binary real users installed had the stock Flutter engine, with no code to check for or apply patches. Patches published fine in Shorebird's console and silently reached zero phones. On 26 September I changed both store builds to `shorebird release` itself (Android bundle and the iOS fastlane lane), so the shipped binary and the registered release are the same file. `shorebird-release.yml` still exists for manual backfills, but it hasn't been needed since.

> [!NOTE]
> **Decision: manual dispatch, straight to stable.** The workflow header calls it a "manual, deliberate hotfix push". There's no auto-patch on merge, and no staging track: a patch goes to the stable track and reaches everyone on that release. We started on Shorebird's free tier, which has no rollback. The safety net is that a human chooses the branch and the release every time, and that Shorebird refuses anything that isn't pure Dart.

Shorebird applies a downloaded patch only when the process restarts. A teammate added a small sheet for that: once a patch has downloaded, the app shows it on Home, once per patch, and never on top of a booking or payment.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/ota-patch-restart.webp" alt="Bottom sheet titled Update ready, asking the user to swipe the app away and reopen it to load downloaded fixes" />
  </div>
  <figcaption><b>In the app</b> — the "Update ready" sheet shown once a patch has downloaded.</figcaption>
</figure>

## Why Shorebird says no

Most of the work after launch was understanding refusals. Shorebird compares the new build with the stored release and refuses if anything outside the Dart code changed. We have hit three kinds.

| Refusal | What actually changed | What we do |
|---|---|---|
| Asset diff | The Material Icons font, trimmed to the icons the code uses | Ship the full font in every release |
| Native diff, Android | Razorpay SDK bytecode, from R8 non-determinism or a newer SDK version | Opt-in `allow_native_diffs`; pin Razorpay per release range |
| Native diff, iOS | One data section in the binary, from the build machine | `allow_native_diffs=true` after checking the list |

### The icon font is an asset

By default Flutter tree-shakes the Material Icons font down to the glyphs the code references. Add or drop a single `Icons.*` in a patch and the font file changes. Fonts are assets, and Shorebird refuses asset diffs. A patch against build 623 failed exactly this way.

There's an `allow_asset_diffs` checkbox, but it's dangerous. Assets never ship in a patch, so if an icon was *added*, the glyph is missing from the installed font and renders as an empty box. The fix a teammate shipped in October was to build releases with `--no-tree-shake-icons`. Every release since build 662 carries the whole font, about 1.6 MB, so icon changes are no longer asset changes.

The catch is that a patch must be built the same way as its release. Older releases still have a trimmed font. So the patch workflow reads the build number from the release version and adds the flag only at or above a per-platform cutoff:

```bash
BUILD="${RELEASE_VERSION##*+}"          # 677 from 1.0.577+677
if [[ "$BUILD" -ge "$FULL_ICON_FONT_FROM_ANDROID" ]]; then
  ICON_FLAGS="-- --no-tree-shake-icons"
fi
```

When those cutoffs were still 0, patches for build 664 failed on both platforms. A teammate set them to 662 and, in the same fix, made patches for builds 662–664 resolve the same Razorpay version those releases had shipped with.

One more trap from the same family: a `const bool = false` guarding a widget lets the compiler strip the widget, and with it an icon from the trimmed font. A home-screen carousel is switched off with a feature flag instead of a constant for exactly that reason.

### Native diffs on Android

One of the first patch attempts, on 21 September, was refused for native changes in the Razorpay SDK even though `pubspec.lock` was identical. It looked like R8 producing slightly different bytecode across two CI builds, not a dependency change. I added `allow_native_diffs` as an opt-in checkbox, default off, rather than forcing it on permanently. Shorebird's own warning is that a real native change patched over can crash the app, so someone has to look at the diff first.

### iOS build noise

iOS was the harder one. On 19 November my iOS patch was refused with 47 "breaking" native differences, most inside Sentry's iOS SDK. I spent a while on a theory that unpinned Swift packages were drifting between builds. Then a teammate's patch, from a different branch, failed with the same 47 differences. Our code wasn't the cause. The hosted macOS runner doesn't reproduce the release binary byte for byte.

Since both platforms moved to build 677, the iOS report is small and the same every time:

```text
Safe differences (2):
  - LC_UUID changed
  - LC_CODE_SIGNATURE or __LINKEDIT alignment padding changed
Breaking differences (1):
  - Data section payload changed: __TEXT,__const
```

That's build-machine noise, so the standing recipe for iOS on GitHub's runners is `allow_native_diffs=true`, after reading the list to make sure it is still just these. The alternative was a store release for every iOS fix, which defeats the point.

> [!WARNING]
> Releases have their own version of this problem. A `shorebird release` without a pinned Flutter version builds with Shorebird's latest Flutter. When Flutter 3.50.1 arrived it needed a newer Gradle than ours, and a deploy failed with no code change. Release builds now pin 3.47.9. Patches don't need the pin, because `shorebird patch` reuses the release's Flutter.

## Which branch to patch from

A patch isn't a diff. It's the whole Dart program, built from whichever branch you dispatch. Anything that branch lacks disappears for every user on that release.

In mid-November that nearly happened. On 12 November a staging-to-main promotion was reverted on `main`. The revert deleted about 9,000 lines across 55 files, Monthly Care among them. `main` also differed from the live release in native files: `AndroidManifest.xml`, ProGuard rules and the Podfile. The same day, Android release 671 shipped from a branch that *did* contain Monthly Care.

So a patch from `main` would have deleted a live feature for every Android user, and Shorebird would likely have refused it anyway for the native lines. We patched Android from `staging`, which was a superset of 671. The PR I had opened to prepare a `main`-based patch was left unused.

<figure>
  <div class="diagram">
    <div class="node">Release 671<br>has Monthly Care</div>
    <span class="arrow">→</span>
    <div class="node accent">Patch from staging<br>superset of 671</div>
    <div class="node muted-node">Patch from main<br>Monthly Care reverted</div>
  </div>
  <figcaption><b>Fig. 2</b> — the same release, two candidate branches. Only one of them contains everything users already had.</figcaption>
</figure>

iOS was a separate case. It was still on release 669, and `staging` had since gained a new image asset that 669 didn't have, so any iOS patch from `staging` would be an asset diff. The team kept a long-lived `staging-ios-669` branch with Dart-only changes cherry-picked onto it. A teammate cherry-picked my 19 November PRs there and shipped them as an iOS patch the next day.

On 23 November a new release, `1.0.577+677`, went out on both platforms. That day `main` and `staging` had identical trees, so patching from either was equivalent, and the iOS branch was no longer needed. The branches drift apart and back again, so this is a check rather than a rule: before dispatching, run `git diff --stat` between the candidate branch and what's live, and look at which release and commit the last patch run used. Patches are dispatched by several of us; teammates run most of them, and I've run about one in seven.

## Builds a patch can't fix

Some changes need native code: a new SDK, a Live Activity, a permission. Those go through the store, and then the question is how to get people onto the new build.

The app asks the backend on every launch with its version and build number. An admin sets the latest version per platform and a force switch. If the installed build is older, the app shows an update sheet. Forced, it can't be dismissed. Optional, it has "Maybe later", and a skip hides it for the next 8 launches, resetting when a newer version is published.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/ota-update-forced.webp" alt="Forced update sheet with only an Update now button and a note that the update is required to continue" />
    <img src="/assets/famcare/case-studies/ota-update-optional.webp" alt="Optional update sheet with Update now and Maybe later buttons" />
  </div>
  <figcaption><b>In the app</b> — the forced and optional update sheets, from the app's screen-audit goldens.</figcaption>
</figure>

Forcing everyone is a blunt tool, so for new features we gate on the build instead. Since May the app has sent its build number with every booking. The configurable booking pulse I built (a "how is it going?" push partway through a visit, still behind a flag) has a `gating.min_app_version_code` setting. The scheduler only picks bookings made on a build at or above it, so an older app is never sent a push it can't answer. The update sheet only gets involved when we really want everyone off a build.

## What it costs

In November we looked at the GitHub Actions bill. The customer app's repo was about 70% of it. The interesting split was by runner:

<figure>
  <div class="chart">
    <div class="bar-col">
      <div class="bar-value">6%</div>
      <div class="bar" style="height: 15%;"></div>
      <div class="bar-label">macOS share of minutes</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">41%</div>
      <div class="bar accent" style="height: 100%;"></div>
      <div class="bar-label">macOS share of compute spend</div>
    </div>
  </div>
  <figcaption><b>Fig. 3</b> — November 2026, all repos, as of the 25th. A hosted macOS minute costs about 10× a Linux minute.</figcaption>
</figure>

Most of those macOS minutes were iOS patches. In November there were 51 iOS patch jobs on hosted `macos-latest`, around 20 minutes each, about three quarters of all macOS minutes. The workflow's default iOS runner is `self-hosted`, meant for a Mac in the office, but that machine isn't registered as a runner, so people pick `github`. Some patches also went to both platforms when the change only mattered on one.

The second driver was ordinary CI. Every push to a PR started a full Flutter QA run (about 27 Linux minutes) and nothing cancelled the older one. In mid-November I shipped two small PRs, praja #1206 and sutram #1744, that add a `concurrency` group to cancel superseded PR runs and shorten artifact retention. It's too early to see the effect in the daily numbers.

The bigger levers are team decisions and are still open: bring the self-hosted Mac online, patch Android only when a change is Android-only, batch patches, and set a spending limit.

## What went wrong

- **Patches that reached nobody.** Until 26 September, every published patch targeted a binary no user had installed.
- **The trimmed icon font.** One icon added or removed was enough to block a patch, until releases shipped the whole font.
- **Cutoffs left at zero.** The full-font releases existed before the patch workflow knew about them, so patches for 664 failed on both platforms.
- **My wrong iOS theory.** I blamed package drift for the 47-difference refusal. A second failure on a different branch showed it was the runner.
- **An unpinned Flutter.** A new Flutter release broke a store deploy with no code change.

Of 134 patch runs since 21 September, 77 succeeded, 38 failed and 17 were cancelled. Most failures are refusals doing their job, and I'd rather have those than a bad patch on the stable track.

## Results

- Dart fixes reach users after an Android patch run of under half an hour and an iOS run of about 20 minutes, instead of a store review.
- Patches are small: about 2.6 MB per Android architecture and 1.4 MB on iOS for recent ones.
- Both platforms are on the same release, 677, with one documented recipe per platform.
- The app tells users when a patch is waiting, and new features can require a minimum build without forcing everyone to update.

## What's next

- **Use a staging track.** Shorebird now warns when no `--track` is given. Publishing to `staging` first and promoting after a check would give us the review step we skipped.
- **A self-hosted Mac**, or at least Android-only patches, to cut the macOS bill.
- **Wire the minimum supported build into the version check.** The config model already has the field, but the endpoint still forces with a single switch.

---

*Stack in this piece: Flutter, Shorebird code push, GitHub Actions, fastlane, FastAPI. Figures come from the app repository's workflow history, Shorebird patch run logs and the November 2026 Actions usage report; costs are shown as ratios.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
