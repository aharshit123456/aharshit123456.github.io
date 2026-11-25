# Honest Slots, Priced Idle Time

*By Harshit Agarwal*

You pick the 3 PM slot, tap pay, and the app tells you that slot isn't available after all. Every marketplace that sells time has some version of this bug, and it's rarely one broken query. It's several correct queries that disagree. This post is about how we made every screen give the same answer to "who can go?", how we proved it with tests written as tiny YAML worlds, and what we did once availability could be trusted: put a price on the hours nobody books.

<div class="stat-row">
  <div class="stat"><div class="stat-num">270</div><div class="stat-label">YAML scenarios on a real migrated Postgres</div></div>
  <div class="stat"><div class="stat-num">6</div><div class="stat-label">code paths sharing one definition of "eligible"</div></div>
  <div class="stat"><div class="stat-num">2×</div><div class="stat-label">every scenario runs twice, same answer both times</div></div>
</div>

FamCare is an in-home care marketplace in India. Families book babysitting or elder care by the hour from an app, and caregivers work rostered, paid shifts out of hubs across the city. So two things matter: selling only hours we can staff, and selling as many of them as we can.

## Six questions that were secretly one question

Every booking passes through several pieces of code that all ask the same thing: **is there a caregiver who can do this visit?**

The slot list, the instant-booking button, recurring bookings, the duration picker and checkout all ask it before taking money. Then matching asks it again to decide who actually goes.

Each of these had its own SQL. Over months of fixes, the rules about account state, check-in and missing roster rows drifted apart. That produced the worst kind of marketplace bug: **a slot shown that checkout then refused**, or a slot sold that matching couldn't staff. Unit tests never caught it, because each query was correct by its own definition. The bug only exists *between* the queries.

## One definition, many callers

The fix had to be structural. I pulled the definition of who may be considered for a booking into a single module, written as composable SQL fragments: account state, hub and service, shift fit, the check-in policy, and conflicts with the travel buffer. Every caller now builds its `WHERE` clause from those fragments instead of writing its own.

<figure>
  <div class="diagram">
    <div class="node muted-node">account<br>hub + service<br>shift fit<br>check-in policy<br>conflicts + travel</div>
    <span class="arrow">→</span>
    <div class="node accent">One eligibility<br>module</div>
    <span class="arrow">→</span>
    <div class="node">Matching pool<br>Assignment gate<br>Admin manual assign</div>
    <div class="node">Checkout capacity<br>Slot lists<br>Batch capacity</div>
  </div>
  <figcaption><b>Fig. 1</b> — one module, six callers. Rules about the caregiver live in one place. Rules about the request (pricing tiers, pending demand, slot caps) stay with each caller.</figcaption>
</figure>

That split is the real design decision: facts about the *caregiver* are shared, facts about the *request* stay local because they legitimately differ by screen. Even an admin's manual assign goes through the shared rules.

Three details made it stick:

- **The policy is written at the top of the module, with the date it was decided.** There's no second place to forget.
- **Shared numbers are shared constants.** "Instant" means a booking that starts within an hour, and checkout and the slot lists read that one value. The tolerance for a caregiver running over on the same family's previous visit is also one number, used by every conflict check.
- **The one deliberate disagreement is written down.** A caregiver whose shift has started but who hasn't checked in is skipped by matching, but still counts as capacity for a visit later that day (hiding those slots once emptied a hub's slot list, more on that below). It's documented in the module and pinned by its own scenarios.

> [!NOTE]
> **Rejected: fix each query until they agree.** That works until the next change to any one of them. Sharing the code is the only agreement that survives new features.

## Tests written as small worlds

A shared module only helps if something proves the callers agree, so alongside it I built a scenario suite. Each scenario is a small world in YAML (caregivers, their rosters and existing bookings, a customer's history, one request) plus the outcome we expect:

```yaml
# Later today, the caregiver's shift has started but she hasn't checked in.
- id: CHECKIN-002
  title: Not checked in, shift already started -> not matched, but still sold
  status: pass
  request: {service: nanny, start: "15:00", hours: 1}
  caregivers:
    asha: {checked_in: false}
  expect: {eligible: [], availability: bookable, browse: bookable,
           multiservice: bookable, batch_dates: bookable, tier_options: bookable}
```

It's table-driven testing taken one step further: each case is a whole world, small enough to read without opening the code.

The runner seeds each world into a **real, migrated Postgres** and runs the **production code**, not a re-implementation of it: matching, ranking, checkout's capacity check, every slot-list endpoint, back-to-back batches and the admin's group assign.

### Parity is the default assertion

Unless a scenario opts out, every slot endpoint's answer must **match checkout's**. A scenario written to test a check-in rule also proves that every picker agrees with checkout about it, for free.

### Freeze time on both sides of the database

Allocation code reads the clock, does travel maths and makes a seeded random choice, so a naive test would be flaky. The subtle part is that the clock lives in two places: freezing Python's clock isn't enough when SQL calls `now()` itself. The harness freezes time **in Python and inside the database** by replacing `now()`. IDs derive from the scenario ID, routing uses a straight-line estimate, and the random draw is seeded by the request ID. **Every scenario runs twice and must give the same answer**, which catches any nondeterminism that slipped through.

### Known gaps are tests too

Some scenarios describe behaviour we want but don't have yet. They're marked `known_gap` with a reason and run as strict expected failures: if one unexpectedly passes, the suite goes red until someone flips it to `pass`. A gap can't close unnoticed, and a fixed bug can't quietly come back.

Unit tests with mocks check logic in one function; schema tests check migrations. The scenario suite is the layer that answers whether every screen and matching agree. The largest areas are check-in rules (71 scenarios), pool eligibility (30), top pick and language (29) and real admin overrides (22), and the suite keeps a "not covered" list so nobody mistakes 270 scenarios for complete coverage.

## Let reality write the tests

The suite grew fastest when reality pushed back.

> [!WARNING]
> **The morning a hub showed nothing.** The first version of the shared policy required check-in for any booking dated today. One morning most of a hub's active caregivers hadn't checked in yet, so every service showed no slots and the app silently fell back to tomorrow.

The rule was right for matching and wrong for selling. Now check-in is waived until a caregiver's shift starts, availability ignores it for later-today visits, and instant visits still need someone checked in and on shift. Then we wrote out **every combination** as scenarios: booking type × check-in × shift state, capacity, the one-hour edge, other days, and batches. That's 71 scenarios for one rule, because it's the rule that broke.

Admin overrides became data too. We took a month of real cases (over two hundred) where ops overrode the system's suggested caregiver and turned them into scenarios and patterns, always with **the admin's choice as the expected answer**. Where the system disagreed, the scenario is a known gap that says how many real overrides it explains, so the backlog is ordered by evidence. One pattern, about one in five overrides, was a caregiver running slightly over on the same family's previous visit. That's where the shared overrun tolerance came from.

## Why the slot grid looked empty

With availability finally trustworthy, we could ask a better question. About a quarter of slot-list views showed no open slots, which looked like a hiring problem. Replaying one hub over twenty days said otherwise: only four of those days were a true shortage that an extra floating caregiver would have fixed. Most sell-outs were caregivers who were free but had **no gap long enough once travel and buffers were counted**.

<figure>
  <div class="chart">
    <div class="bar-col">
      <div class="bar-value">20</div>
      <div class="bar" style="height: 100%;"></div>
      <div class="bar-label">days replayed</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">4</div>
      <div class="bar accent" style="height: 20%;"></div>
      <div class="bar-label">true shortage</div>
    </div>
  </div>
  <figcaption><b>Fig. 2</b> — one hub, twenty days. Only four had a shortage an extra floating caregiver would have fixed.</figcaption>
</figure>

So the answer pointed at the product, not hiring. On one day we checked, almost nine in ten customers who saw an empty day simply picked another date. The natural fix is to explain the grid: a clear "Full" label instead of an unexplained greyed-out chip, and an "only N left" cue. I built those labels, but they are not in the app customers use today; the lesson stands either way. An empty grid is a fragmentation problem far more often than a headcount problem.

## Pricing idle time

Rostered caregivers are paid whether or not a family books them, and only about half of rostered hours were booked. Could price fill some of the rest?

### Why not surge pricing?

Surge was the first idea on the table. The data said no: no day-and-hour cell reached 80% utilisation. The single tight hour, early evening, turned out to be a staffing gap (about a third fewer caregivers on shift), not a rush of demand. App taps also overstated morning demand by 1.5–2×.

So surge stays at 1.0 in code. The real opportunity was the opposite one: **discount hours that would otherwise go idle**.

### The rule

Same-day slots get a drop made of two parts:

- A **gap-to-goal curve.** The further a slot's utilisation is below a goal, the deeper the discount, shaped by an exponent *k*.
- An **idle ramp.** Each full hour without a new booking in the last hours before the slot adds a small step. A step once earned is held, so a new booking doesn't reset it.

<figure>
  <div class="chart">
    <div class="bar-col">
      <div class="bar-value">½</div>
      <div class="bar" style="height: 100%;"></div>
      <div class="bar-label">k = 1 (linear)</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">¼</div>
      <div class="bar accent" style="height: 50%;"></div>
      <div class="bar-label">k = 2 (shipped)</div>
    </div>
    <div class="bar-col">
      <div class="bar-value">⅛</div>
      <div class="bar" style="height: 25%;"></div>
      <div class="bar-label">k = 3</div>
    </div>
  </div>
  <figcaption><b>Fig. 3</b> — share of the maximum drop a slot gets when it's halfway to the utilisation goal. Every k gives the full drop to an empty slot and nothing at the goal; k decides how fast it falls in between. At k = 3 a moderately full slot barely moves.</figcaption>
</figure>

The **guardrails** matter more than the curve:

- A total cap and a per-hour price floor.
- A check on the value of each booked hour for the hub's day. This replaced an average-order-value guard which, it turned out, blocked every drop on cheap one-hour bookings, even on completely empty slots.
- Admins can deepen or soften an existing drop but never invent one.
- Changing a pricing tier needs one-time codes from two phones.
- A customer's price is held for ten minutes. A lower price applies silently; a higher one must be accepted.

### Simulate with production code, and bound the downside

Before any customer saw a drop, we replayed real rosters and bookings **as they stood at each hour of the day**, and priced every slot from 8 AM to 8 PM at every viewing hour from 4 AM. The simulator imports the same pricing engine as production, not a copy; checked cell by cell against the live simulator, all 715 cells matched. We compared several variants this way (flat steps, growing steps, pace-based discounts, k = 2 versus 3). What shipped is a ramp over the last hours, never before 6 AM, with k = 2.

A simulator can't tell you how customers react to a price, so we used it to **bound the downside** instead of predicting the upside. Replayed over two weeks with zero new demand, about a third of same-day orders would have received a drop, at an average depth of about 6%. To break even, dropped slots needed about 7% more booked hours, against a large pool of idle hours to fill. Production then started more conservatively than the defaults, hub by hub.

## The discount went to the wrong people

> [!WARNING]
> In the first eleven days, about half the discount went to customers who would have booked anyway, and a dozen daily regulars took over a third of all drops. Six in ten drop bookings were made less than two hours out, and nearly half came from customers on their eleventh booking or later. Only a handful were genuine win-backs.

The people best placed to catch a last-minute price are the people who already use you every day. The second version made drops **about the customer, not just the slot**. Regulars don't get them, there's a lifetime cap per customer, and depth scales by behaviour cohort. Replayed on the same history, the same budget goes about **2× deeper to about half as many customers**.

We also set KPIs before claiming success, such as return on discount above 1.0 and idle hours down by at least 10%. A replay shows where money would go; only a holdout group that never sees a drop can prove uplift.

## A discount must survive every screen

A discount that disappears between screens reads as a bait-and-switch. So the server **holds** a customer's drop for ten minutes, and the app carries that held price through every step that can re-price a booking: adding to cart, changing the duration, editing the time and checkout's own re-pricing. Each was a separate bug where the drop quietly vanished. A drop and a coupon never stack (the app clears the coupon and says so), the payment summary shows the drop as its own row, and if the price moved, a dialog explains it.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/pd-slot.webp" alt="Slot grid with a price drop on the selected slot" />
    <img src="/assets/famcare/case-studies/pd-held.webp" alt="Checkout carrying the held price-drop price" />
    <img src="/assets/famcare/case-studies/pd-price-changed.webp" alt="Dialog explaining that the price has changed" />
    <img src="/assets/famcare/case-studies/pd-receipt.webp" alt="Payment summary with separate price drop and coupon rows" />
  </div>
  <figcaption><b>In the app</b> — a drop on the slot grid, the held price at checkout, the price-changed dialog, and the receipt-style payment summary.</figcaption>
</figure>

To choose how a slot chip shows a drop, I rendered **four options as golden images from real slot data** (a saving label, a struck-through price, a percentage tag, a "Lowest" flag), so the team compared real prices rather than mock-ups.

## Flash sales: rarer, deeper, louder

The gradual engine tops out at a modest discount, which is too weak to fill an evening slot that's still mostly empty a few hours out. Flash sales do the opposite. They're **rare, deep and time-boxed**, and loud about it.

<figure>
  <div class="diagram">
    <div class="node muted-node">4–5 PM<br>may open, on the hour,<br>if still mostly empty</div>
    <span class="arrow">→</span>
    <div class="node accent">Push + Home strip<br>selling, countdown</div>
    <span class="arrow">→</span>
    <div class="node">6 PM<br>closes 1 h before<br>(or sold out, or killed)</div>
    <span class="arrow">→</span>
    <div class="node muted-node">7 PM<br>slot</div>
  </div>
  <figcaption><b>Fig. 4</b> — example for a 7 PM evening slot. Bookings of 2 hours or more, scheduled only. The sale is 50–60% off depending on how empty the slot is, fixed at open so the push and the countdown never lie, and its spots come from free capacity. Every number is a per-hub setting with defaults; an admin can kill a live sale or force-open one.</figcaption>
</figure>

**Who gets it.** Everyone except families who already book evenings regularly: the lesson of the first price drops, applied up front. Each customer gets at most one flash booking a fortnight, and at most one flash push a day and two a week.

**Stored sales, not computed prices.** A sale is a database row with its depth, spots and close time. It isn't a price computed on the fly, and it isn't a coupon. The sale's ID is **signed into the ten-minute price hold**, so a client can't strip it to dodge the spot count or the fortnightly cap. A customer who got the price in time keeps it even if the sale closes mid-checkout. Because the sale is a stored fact, the push, the app and checkout all tell the same story.

**Where the customer sees it.** A push goes out ("⚡ 55% off tonight's 7 PM slot. Ends 6:00 PM, only 3 caregivers left"). In the app, a slim sticky strip under the Home header shows the offer, how many caregivers are left, and a live countdown. The countdown runs on server time with clock-skew correction, so it ends when the sale ends, not when the phone thinks it should. Tapping the strip or the push opens booking with the sale slot already selected.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/flash-home-strip.webp" alt="Home screen with the flash sale strip pinned under the header and a live countdown" />
    <img src="/assets/famcare/case-studies/flash-slot-picker.webp" alt="Slot picker with a 55 percent off flash chip on the 7 PM slot and spots left" />
  </div>
  <figcaption><b>In the app</b> — the sticky strip on Home, and the slot picker with the flash slot, its countdown and spots left.</figcaption>
</figure>

**Strip first, notification second.** The in-app strip could ship as an over-the-air patch and reach customers in days. A sticky notification (an Android ongoing notification with a countdown, or an iOS Live Activity) needs new native code, so it went out in a store release, driven by the same sale record.

## What I'd take to any marketplace

- **When screens disagree, share the definition, not the fix.** Rules about the resource are shared; rules about the request stay local.
- **Test with small worlds on a real database.** Make parity the default assertion and freeze time on both sides of the database.
- **Keep known gaps as strict expected failures**, so a fix can't go unnoticed.
- **Turn incidents and human overrides into test data.** The admin's choice is the expected answer.
- **Before discounting, check who it reaches.** Slot-only rules reward regulars.
- **Store promotions as rows and sign them into the price**, so every surface tells the same story.

---

*Stack in this piece: Python, FastAPI, Postgres, pytest with YAML scenario specs, freezegun. Figures are ratios and counts from the backend repository and internal analyses in October and November 2026; no prices or revenue are shown.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): code push for a Flutter app, why patches get refused, and what CI really costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [Three Outages and the Infrastructure They Left Behind](/blog/famcare-incidents-and-infra): three production incidents, the guardrails each left behind, and how we write up root causes.
- [All case studies](/case-studies)
