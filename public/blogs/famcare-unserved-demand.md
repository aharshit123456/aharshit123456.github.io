# The Demand We Couldn't Serve

*By Harshit Agarwal*

A family opens the FamCare app, picks a service, looks at the time grid, finds nothing free and closes the app. In our analytics that used to look like `booking_screen_opened` followed by nothing. This post is about turning that silence into a number we could trust: what the server actually showed each customer, what the customer was actually trying to book, and whether the answer to "no slots" was more caregivers or something cheaper.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~1 in 4</div><div class="stat-label">slot-picker loads showed no open slot</div></div>
  <div class="stat"><div class="stat-num">6 vs 1</div><div class="stat-label">in 10 families found every slot full for today vs tomorrow</div></div>
  <div class="stat"><div class="stat-num">4 of 20</div><div class="stat-label">days in one hub were a true headcount shortage</div></div>
  <div class="stat"><div class="stat-num">~1 in 20</div><div class="stat-label">logged availability calls was a customer choosing a time</div></div>
</div>

---

## The problem: "no slots" was a silent failure

When a date has no caregiver with a long enough gap, the time grid greys out. Nothing errors. The customer picks another time, another date, or leaves.

We knew this happened, but not how often, where, or why. Our events were too blunt. "Caregivers busy" was one tag covering a real shortage, a missing caregiver ETA, a taken slot and a failed request alike. `slot_viewed` couldn't tell a real zero from a fetch that failed. And slot availability is computed live from rosters, bookings, attendance and admin config, none of which keep history. So "what was bookable at 2:05 PM last Tuesday" could only be guessed.

And the obvious reading of empty grids is "hire more caregivers", our biggest cost.

## First pass: Mixpanel alone

The first report was built only from app analytics. Over twenty days in October, we took every customer who fired `slot_viewed`, counted the ones whose view had zero available slots, and checked whether they booked within three days.

The method, roughly:

- **Lost customer:** saw zero slots, then made no booking within 3 days.
- **Missed bookings:** lost customers × the booking rate of customers who *did* see open slots in the same hub.
- **Extra caregivers:** missed bookings per day ÷ bookings one working caregiver does per day.

It said 55–63% of customers per hub saw zero at least once. But the report's limits section was longer than its findings. The hub came from each customer's profile, not from where they were when they looked. Developer traffic was mixed in. And it couldn't separate three very different causes: the evening cutoff, a genuine sell-out, and free caregivers whose free time was chopped into gaps too short to sell.

A parallel look at surge pricing added a warning about app events: only about **1 in 4 slot picks was a human choice**; the rest were the app selecting a default. Taps also made 8–10 AM look 1.5–2× bigger than real bookings.

## Recording what the server showed

So I made the backend keep evidence. Two tables, both written by calling the same production code the app calls.

**`availability_request_log`** gets one row per real customer request to the three availability endpoints: who asked, which hub and date, which service, booking type, zone, app build, whether Redis served it, how many slots existed, how many were open, and the first open one. The row's ID goes back to the app in an `X-Availability-Id` response header.

**`availability_slot_snapshots`** stores the full slot grid per hub, date and zone on every 15-minute slot boundary (today also every 5 minutes), so each slot is kept up to its own start time. Instant availability gets the same treatment, plus a reason per pricing tier when Instant says no: `not_checked_in`, `on_active_booking`, `booking_overlap`, `not_rostered_for_window` and so on. Those codes are a contract: add, don't rename.

On the app side I attached that header's ID to `slot_viewed`, `slot_selected` and the "no slots" popup, along with the hub, zone, lead time, load time and whether the fetch failed. A shared payload builder sends identical properties to Mixpanel and CleverTap.

<figure>
  <div class="diagram">
    <div class="node">App asks for slots</div>
    <span class="arrow">→</span>
    <div class="node accent">Backend logs the grid<br>returns X-Availability-Id</div>
    <span class="arrow">→</span>
    <div class="node">slot_viewed carries<br>availability_id</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Join to bookings<br>by user id</div>
  </div>
  <figcaption><b>Fig. 1</b> — one ID ties what the server showed to what the customer did next. Mixpanel's <code>$user_id</code> is our <code>users.id</code>, so outcomes come from the database, not from events.</figcaption>
</figure>

Only real HTTP requests are logged; snapshot jobs, chat journeys and tests are skipped. The write is fire-and-forget with a kill switch, so logging can never fail or slow a response. No coordinates are stored, and rows are purged after 90 days. The request log is about a megabyte a day; the snapshots are the heavy part, so the travel-aware location probes stay off by default.

> [!NOTE]
> **Rejected: keep estimating from Mixpanel.** Every analysis would have restated the same caveats. One ID returned in a header turned "we think they saw zero" into "here is the grid they were sent".

## The join, and its gotchas

Before trusting the join, I checked it:

- Sampled `slot_viewed.availability_id` values all matched a row in the request log.
- Mixpanel's `booking_confirmed` unique users came within about 4% of paid bookings in the database over two weeks. But `payment_success` had duplicate events, so outcomes are always read from the database.
- Ask for `$user_id`, not `distinct_id`. The plain `distinct_id` property comes back empty in Mixpanel's property lookups.

Then the time zone bit us twice.

> [!WARNING]
> **The +5:30 gotcha.** The app sends the wanted date and slot as `"YYYY-MM-DD HH:MM"` strings in IST. Mixpanel parses them as UTC datetimes and displays them 5½ hours later, so a 6 PM slot shows up as 11:30 PM. And Mixpanel's export days follow a project time zone behind IST, so asking for "today" between midnight and 5:30 AM IST returned a 400. The fix was to request whole UTC days around the window and trim by event time.

The bigger surprise was noise. The app asks for availability from four places, and only one is a customer choosing a time. Home prefetches Instant on every open and resume, and preloads schedules in the background. Over a two-week window, about **1 in 20** logged requests came from the booking screen's picker. The background preloads were almost never empty (about 14% of customers ever got a zero), while the Home Instant tile said "busy" to 85% of customers who saw it. Mixed together, those rows say nothing useful. So every report splits by **surface**, and only counts grids that existed: a request with no grid at all is out of hours or out of area, not a shortage.

## What the customer actually wanted

The server log can't say what the customer was looking for. A teammate added that from the app side: a `slot_status` event, sent once per visit to a time screen, saying how the visit ended (proceeded, left, backgrounded) and what the customer wanted. A greyed time they tapped counts as `slot_issue: sure`. A tab they opened, stayed on for ten seconds, or checked across two or more dates becomes their `wanted_period`, flagged if it had no open slot.

On top of that event I built the classification the admin uses. Mixpanel's raw export is pulled for the window, reduced to the newest event per `visit_id`, and each visit becomes one of four things: `proceeded`, `wanted_empty`, `slot_issue` or `other`. A customer is **lost to slots** when a visit ended without proceeding while the time they wanted was empty, and they made no booking within the window. The window defaults to 3 days and can be set from 1 to 30. Customers who come back later are counted separately as "booked later".

## The Missed Slots page

All of this lands on one admin page, built for ops rather than analysts. It opens with "The story in plain words", a set of sentences computed from the data below. "Looking for today: 6 out of 10 families find every slot full. Looking for tomorrow: only 1 out of 10." Under that sits a small goals table with where we are now and where we want to be in two weeks.

Over the most recent fourteen days it showed:

| Measure | Share |
|---|---|
| Customers who opened the picker and saw a full grid at least once | 59% |
| Of those, booked within 3 days anyway | 26% |
| Picker loads that were empty | 22% |
| Customers looking at **today** who saw a full day | 58% |
| Same, looking at **tomorrow** | ~10% |
| Same, looking 2–3 days ahead | 4–6% |
| Customers who saw the Instant tile and were told "busy" | 85% |

The gap is same-day. Booking ahead mostly works; last-minute mostly doesn't. The most common reason Instant said busy was every caregiver already being at a visit (about a third of the time). Mornings, caregivers haven't checked in yet; late at night Instant is closed.

The last section answers the hiring question directly. For each hub × weekday × shift band (morning, afternoon, evening) that lost families, it puts the lost visits next to the caregivers rostered in that band, how busy they were and how many hours they sat idle. Extra caregivers needed is lost visits ÷ visits one caregiver fits in the band at the hub's usual visit length, shown for a typical and a peak day. Then one word: **move** when idle hours already rostered in that band would cover it, **add** when they wouldn't. In the first run, about half of those shift bands said move.

<figure>
  <div class="diagram">
    <div class="node muted-node">Lost families<br>by wanted day + band</div>
    <span class="arrow">→</span>
    <div class="node">Rostered caregivers<br>busy % · idle hours</div>
    <span class="arrow">→</span>
    <div class="node accent">Idle covers it?<br>move : add</div>
  </div>
  <figcaption><b>Fig. 2</b> — the page doesn't stop at "you lost N families". It says whether the fix is a shift change or a new person.</figcaption>
</figure>

> [!NOTE]
> **Rejected: size hiring from the zero-slot count.** Caregivers were only about half busy on average. An empty grid next to idle rostered hours means the shifts are in the wrong place, not that we're short of people.

## The analyses that followed

**Floater caregivers.** Could a caregiver from a neighbouring hub be sent over when a hub hits zero? We replayed one hub over twenty October days, hour by hour, counting rostered caregivers with no booking overlapping that hour (plus a 15-minute buffer) in each hub. The hub showed zero slots at some point on every one of those days. Only 4 were a real headcount shortage with free caregivers nearby to send. On 2 more it was short but no neighbour was free. On the other 14, it still had a free caregiver at the cutoff hour.

<figure>
  <div class="chart">
    <div class="bar-col">
      <div class="bar-value">14</div>
      <div class="bar" style="height: 100%;"></div>
      <div class="bar-label">free caregiver, no gap long enough</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">4</div>
      <div class="bar accent" style="height: 29%;"></div>
      <div class="bar-label">short, a floater could help</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">2</div>
      <div class="bar" style="height: 14%;"></div>
      <div class="bar-label">short, nobody to send</div>
    </div>
  </div>
  <figcaption><b>Fig. 3</b> — one hub, twenty days that each hit zero slots. Most zeros were fragmentation, lead time or the evening cutoff, not headcount.</figcaption>
</figure>

Two patterns explained the rest. Every hub, almost every day, went to zero between 5 and 7 PM as shifts ended. And on early sell-out days the hub often still had one to six caregivers free, but no gap long enough once travel and buffers were counted. A floater fixes neither.

The commute decided the design. A floater arrives 30–45 minutes after the signal and needs the 15-minute buffer, so the first sellable slot is about an hour out: useless at 6 PM, fine for tomorrow. The recommendation was an ops alert on *advance* closures with live demand, a suggested donor and a one-tap temporary assignment, not automation. We expected it to fire once or twice a month. It isn't built yet.

**Telling people when a slot opens.** On the worst day in that window, a date closed a full day early. Of the customers who hit it, 89% simply switched to another date and 23% booked something within three days. A "slots are open again" push would only win back those who needed that exact date: worth doing, but small.

**Surge pricing.** The same evidence ruled out surge. Caregivers were about half busy, no day-and-hour cell reached 80%, and the tight 6 PM hour was a third fewer caregivers on shift, not more demand.

**The empty grid itself.** On real data, about 24% of slot views showed zero open slots, 13% showed between one and ten, the median view had 22 open and the 90th percentile 42. A sold-out afternoon was twenty faded chips and nothing else, which reads as broken. I rendered before/after goldens from that real data with a "Full" label and an "only N slots left" cue. That PR is still a draft. Meanwhile, in the newer booking-screen design a teammate built, a taken time reads "Sold out", so a customer can at least tell full from closed.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/demand-fully-booked.webp" alt="Start time grid with every morning slot greyed out and struck through" />
    <img src="/assets/famcare/case-studies/demand-empty-day.webp" alt="Start time section saying no slots available for this day" />
    <img src="/assets/famcare/case-studies/demand-sold-out.webp" alt="Evening slot grid with one taken time labelled Sold out" />
  </div>
  <figcaption><b>In the app</b> — a fully booked morning, an empty day, and the newer grid where a taken time says "Sold out" instead of just fading.</figcaption>
</figure>

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/demand-instant-wait.webp" alt="Dialog saying the next caregiver frees up in about 95 minutes, past Instant's 30-minute window" />
    <img src="/assets/famcare/case-studies/demand-slot-taken.webp" alt="Dialog saying the selected slot was just taken, with Go Back and Try Again buttons" />
  </div>
  <figcaption><b>In the app</b> — Instant explaining a long wait and pointing to a scheduled time, and checkout catching a slot taken in the meantime. Each is a moment the logs now record.</figcaption>
</figure>

## What went wrong

- **The first report trusted profile hubs and counted developer traffic.** The server log fixed both: hub at view time, developers filtered out.
- **Background calls looked like demand.** Until reports split by surface, Home's prefetches made Instant look far worse and schedules look far better than what customers saw.
- **The summary column was double-encoded.** The log's per-request summary was written as a JSON string inside a `jsonb` column, so the reports unwrap either form.
- **The export was slow.** Pulling fourteen days of events from Mixpanel takes about 20 seconds, which an admin proxy won't wait for. A cold request now waits up to 8 seconds, then answers "pending" while the build finishes in the background into a 15-minute cache.

## Results

- Every availability response a customer gets now has an ID, and the app's events carry it, so "what did this person see" is a lookup, not an estimate.
- The answer so far is mostly **timing, not headcount**: same-day demand against shifts that haven't started or have already ended, and free time cut into gaps too short to sell.
- The backend, app telemetry and admin page have shipped. The slot-gap code has 26 unit tests for its pure logic; the queries were checked against production data before release.

## What's next

- **Show the closest free time** when a day is full, and a "tell me when a slot opens" button, sent once per customer per date and only if enough slots opened.
- **A floater alert for advance closures**, by roster rather than live, measured for two weeks before anything is automated.
- **Land the "Full" and "only N left" grid work** that's still sitting in a draft PR.
- **Turn on location probes** for a few hubs, so the snapshots show availability by distance from the hub and not just per hub.

---

*Stack in this piece: Python, FastAPI, Postgres, Redis, Flutter, Mixpanel (raw export), CleverTap, Next.js. Figures are ratios from internal analyses in October and November 2026 and from the admin page's own output; no hub names, customer counts or order counts are shown.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
