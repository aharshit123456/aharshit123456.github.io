# Shipping a Flutter App Without the App Store

*By Harshit Agarwal*

A booking screen shows the wrong price. The fix is four lines of Dart, written and reviewed before lunch. Then it waits: a full store build, a Play Store and App Store review, and days or weeks of people getting around to updating. For a mobile team, the slowest part of a small fix is almost never the fix. This post is about how we moved most of our fixes out of that queue with over-the-air code push, and about what turned out to matter more than the tool: why patches get refused, why a patch is not a diff, and what it does to the CI bill.

FamCare is an in-home care marketplace in India. Families book babysitting and elder care by the hour from a Flutter app. When a sheet traps someone mid-booking or a price reads wrong, a slow fix means a parent who gives up and calls someone else.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~1.4–2.7 MB</div><div class="stat-label">a typical patch download, per platform</div></div>
  <div class="stat"><div class="stat-num">~20 min</div><div class="stat-label">an iOS patch on a hosted macOS runner</div></div>
  <div class="stat"><div class="stat-num">10×</div><div class="stat-label">macOS minute vs Linux minute</div></div>
</div>

## What code push is, and why the stores allow it

A mobile app is a signed binary that a store reviewed. **Code push** (or OTA patching) changes part of the app's behaviour after install, without a new binary: the app checks a server on launch, downloads a patch, and runs the new code the next time it starts.

JavaScript-based frameworks have done this for years, because their code ships as source and is interpreted. Flutter is harder: release builds compile Dart ahead of time to machine code, with no interpreter to hand new code to. **Shorebird** fills that gap. It ships a modified Flutter engine that can load a patch for the compiled Dart code inside an installed app.

Why do the stores tolerate this? Both have rules against an app silently becoming a different app. Apple's developer agreement allows downloading interpreted code as long as it doesn't change the app's primary purpose, create a storefront for other code, or bypass the operating system's security features. Google Play forbids downloading executable code from outside Play, with an exception for code that runs in a virtual machine or interpreter. Shorebird is designed to sit inside those exceptions; on iOS, for example, changed code runs in an interpreter while unchanged code keeps running as the compiled code Apple reviewed.

The spirit of both rules is a useful discipline: you may fix and adjust the app the reviewer saw, but not turn it into something else behind their back. It also explains the technical limit. A patch replaces Dart code and nothing more. Native code (Kotlin, Swift, third-party SDKs, the native halves of plugins) and assets (fonts, images) are baked into the signed binary and still need a store release. For us that limit is generous: most day-to-day changes are Dart, such as copy, layout, booking logic and analytics events.

## Release once, patch many times

I added Shorebird to the app and wrote the first release and patch workflows; a teammate added per-platform dispatch and the iOS signing fixes that followed. The pipeline has two halves.

**A release** is a store build that Shorebird knows about. The deploy workflow builds the Android bundle and the iOS archive with `shorebird release` instead of `flutter build`, uploads them to the stores, and registers that exact binary with Shorebird under its version and build number.

**A patch** is a manual GitHub Actions run. Whoever starts it picks the branch, the platform, and the release to patch. The workflow builds the Dart code from that branch, Shorebird compares it with the stored release, and if they're compatible the patch is published.

<figure>
  <div class="diagram">
    <div class="node muted-node">Release build<br>shorebird release</div>
    <span class="arrow">→</span>
    <div class="node">Play / App Store<br>one version + build</div>
    <span class="arrow">→</span>
    <div class="node accent">Patch build<br>branch + release version</div>
    <span class="arrow">→</span>
    <div class="node">Stable track<br>every user on that release</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Next launch:<br>download, then restart</div>
  </div>
  <figcaption><b>Fig. 1</b> — a release is built once and goes through the store. Patches are built from a branch, checked against that release, and published to everyone on it.</figcaption>
</figure>

> [!NOTE]
> **Decision: manual dispatch, straight to stable.** No automatic patch when code merges, and no separate test track: a patch reaches everyone on that release. We started on Shorebird's free tier, which has no rollback. The safety net is that a human chooses the branch and the release every time, and that Shorebird refuses anything that isn't pure Dart.

Shorebird applies a downloaded patch only when the app process restarts, and people rarely kill apps on purpose. A teammate added a small sheet for that: once a patch has downloaded, the app mentions it on Home, once per patch, never on top of a booking or payment.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/ota-patch-restart.webp" alt="Bottom sheet titled Update ready, asking the user to swipe the app away and reopen it to load downloaded fixes" />
  </div>
  <figcaption><b>In the app</b> — the "Update ready" sheet shown once a patch has downloaded.</figcaption>
</figure>

## The patches that reached nobody

My first version got the release half wrong, in a way that's easy to repeat. The deploy workflow uploaded a plain Flutter build to the Play Store and then pushed a tag. The tag triggered a second workflow, which built a *second* bundle with Shorebird's engine and registered it. That second bundle was never uploaded anywhere.

So the binary users installed had the stock Flutter engine, with no code to check for patches. Patches published cleanly, showed up in Shorebird's console, and reached zero phones. Nothing failed, so nothing told us.

The fix was to make both store builds use `shorebird release` directly, so the binary in the store and the binary Shorebird knows are the same file. The lesson: **verify not that the patch was published, but that the binary in users' hands can receive it.** Two builds that "should be the same" are two different binaries.

## Why a patch gets refused

Most of the work after launch was understanding refusals. Shorebird refuses if anything outside the Dart code changed. We have hit three kinds:

| Refusal | What actually changed | What we do |
|---|---|---|
| Asset diff | The Material Icons font, trimmed to the icons the code uses | Ship the full font in every release |
| Native diff, Android | Razorpay SDK bytecode, from R8 non-determinism or a newer SDK version | Opt-in "allow native diffs"; pin the Razorpay version per release range |
| Native diff, iOS | One data section in the binary, from the build machine | Allow native diffs after checking the list |

### The icon font is an asset

By default, Flutter **tree-shakes** the Material Icons font, keeping only the glyphs the code references. So adding or dropping one `Icons.*` reference in a patch changes the font file. Fonts are assets, and Shorebird refuses asset diffs.

There is an option to allow asset diffs anyway, and it's a trap: assets never ship in a patch, so a newly added icon renders as an empty box. The fix a teammate shipped was to build releases with `--no-tree-shake-icons`. Every release since carries the whole font, about 1.6 MB, so icon changes are no longer asset changes.

The catch is that a patch must be built exactly like its release, and older releases still have a trimmed font. So the patch workflow reads the build number from the release version and adds the flag only at or above a per-platform cutoff:

```bash
BUILD="${RELEASE_VERSION##*+}"          # "1.0.42+120" -> 120
if [[ "$BUILD" -ge "$FULL_ICON_FONT_FROM_ANDROID" ]]; then
  ICON_FLAGS="-- --no-tree-shake-icons"
fi
```

Those cutoffs were first left at zero, and patches for the first full-font releases failed on both platforms until a teammate set them, while also making those patches resolve the same Razorpay version their releases shipped with.

One more trap from the same family: a `const bool = false` guarding a widget lets the compiler strip that widget, and with it an icon from the trimmed font. A home-screen carousel is switched off with a runtime feature flag instead of a constant for exactly that reason.

### Native diffs on Android

One early patch was refused for native changes in the Razorpay payment SDK, even though the dependency lockfile was identical. It looked like R8, Android's code shrinker, producing slightly different bytecode across two CI builds. I added "allow native diffs" as an opt-in checkbox, off by default. Shorebird warns that patching over a real native change can crash the app, so someone has to read the diff and decide it's noise.

### iOS build noise

One of my iOS patches was refused with 47 "breaking" native differences, most inside Sentry's iOS SDK. I spent a while on a theory that unpinned Swift packages were drifting between builds. Then a teammate's patch, from a different branch, failed with the same 47 differences. Our code wasn't the cause: the hosted macOS runner doesn't reproduce the release binary byte for byte.

After both platforms moved to a fresh release, the iOS report became small and identical every time:

```text
Safe differences (2):
  - LC_UUID changed
  - LC_CODE_SIGNATURE or __LINKEDIT alignment padding changed
Breaking differences (1):
  - Data section payload changed: __TEXT,__const
```

That's build-machine noise. The standing iOS recipe on GitHub's runners is to allow native diffs after confirming the list is still just these lines; the alternative is a store release for every iOS fix. The lesson from my detour: when a refusal looks like your fault, reproduce it from an unrelated change before chasing a theory.

> [!WARNING]
> Releases have their own version of this problem. A `shorebird release` without a pinned Flutter version builds with Shorebird's latest Flutter. When Flutter 3.50.1 arrived it needed a newer Gradle than ours, and a deploy failed with no code change. Release builds now pin 3.47.9. Patches don't need the pin, because `shorebird patch` reuses the release's Flutter.

## A patch is the whole program, not a diff

This surprised me most. A patch isn't "the changes since the release". It's the entire Dart program, built from whichever branch you point the workflow at. Anything that branch lacks disappears for every user on that release.

We keep two long-lived branches: an integration branch where work lands first, and a production branch promoted from it. You'd expect to patch from production. One day that would have been a serious mistake. A promotion to the production branch had just been reverted, deleting about 9,000 lines across 55 files, including Monthly Care, a feature live in the current Android release. That branch also differed from the release in native files (`AndroidManifest.xml`, ProGuard rules, the Podfile). A patch from it would have deleted a live feature for every Android user, if Shorebird hadn't refused it first. We patched from the integration branch, which contained everything the release had.

<figure>
  <div class="diagram">
    <div class="node">Live release<br>has Monthly Care</div>
    <span class="arrow">→</span>
    <div class="node accent">Patch from integration branch<br>superset of the release</div>
    <div class="node muted-node">Patch from production branch<br>Monthly Care reverted</div>
  </div>
  <figcaption><b>Fig. 2</b> — the same release, two candidate branches. Only one of them contains everything users already had.</figcaption>
</figure>

iOS at that moment was on an older release, and the integration branch had gained an image asset that release lacked, so any iOS patch from it would be an asset diff. For a while the team kept a branch per iOS release with Dart-only changes cherry-picked onto it, until a new release on both platforms made it unnecessary.

Branches drift apart and back again, so "always patch from X" doesn't hold. What holds is a check before every dispatch: **diff the candidate branch against what's live** (`git diff --stat` against the release's commit) and look at what the previous patch was built from. If the branch is missing anything the release has, it's the wrong branch.

## When you need the store anyway

Some changes need native code: a new SDK, a Live Activity, a permission. Those go through the store, and the question becomes how to get people onto the new build.

The app sends its version and build number to the backend on every launch. An admin sets the latest version per platform and a force switch. If the installed build is older, the app shows an update sheet. A forced one can't be dismissed; an optional one has "Maybe later", and skipping hides it for the next 8 launches, resetting when a newer version is published.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/ota-update-forced.webp" alt="Forced update sheet with only an Update now button and a note that the update is required to continue" />
    <img src="/assets/famcare/case-studies/ota-update-optional.webp" alt="Optional update sheet with Update now and Maybe later buttons" />
  </div>
  <figcaption><b>In the app</b> — the forced and optional update sheets, from the app's screen-audit goldens.</figcaption>
</figure>

Forcing everyone is blunt, so for new features we **gate on the build** instead. The app sends its build number with every booking. When I built a configurable "how is it going?" push sent partway through a visit, it got a minimum-build setting: the scheduler only picks bookings made on a build at or above it, so an older app never gets a push it can't handle. The forced sheet is for the rare case where we want everyone off a build.

## The macOS tax

Code push moves work from the store to your CI, and CI isn't free. When we looked at the GitHub Actions bill, the interesting split was by runner:

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

Six percent of the minutes made up two fifths of compute spend. About three quarters of those macOS minutes were iOS patches, around 20 minutes each, and some patches went to both platforms when the change only mattered on one. The levers follow directly:

- **Patch only the platform that needs it**, and batch fixes instead of patching each one alone.
- **Build iOS on a self-hosted Mac.** The workflow already supports one; a machine you own makes those minutes nearly free.
- **Cancel superseded CI runs.** Every push to a pull request started a full Flutter QA run of about 27 Linux minutes, and nothing cancelled the previous one. A GitHub Actions `concurrency` group keyed on the pull request, with `cancel-in-progress`, fixes that in a few lines.

## Takeaways

- **Code push covers more than you'd think.** If most changes live in the Dart (or JavaScript) layer, most fixes can skip store review, within rules the stores publish.
- **Verify the binary, not the dashboard.** A successfully published patch reaches nobody if the store build isn't the registered one.
- **Treat refusals as a feature.** More than a quarter of our patch runs failed, mostly refusals doing their job. Keep escape hatches like "allow native diffs" opt-in, and read the diff every time.
- **Build patches exactly like their release.** Icon tree-shaking, a pinned SDK, the Flutter version: any differing input becomes an asset or native diff.
- **A patch is the whole program.** Diff the branch against what's live; the wrong branch doesn't fail, it quietly deletes features.
- **Gate features on the build number** and save forced updates for emergencies.

The obvious next step is a staged rollout. Shorebird can publish to a separate track and promote later, which would add a check on real devices before a patch reaches everyone: the one safety step this setup skipped at the start.

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
- [Three Outages and the Infrastructure They Left Behind](/blog/famcare-incidents-and-infra): three production incidents, the guardrails each left behind, and how we write up root causes.
- [All case studies](/case-studies)
