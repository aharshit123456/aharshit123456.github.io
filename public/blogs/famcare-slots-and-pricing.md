# Honest Slots, Priced Idle Time

*By Harshit Agarwal*

This one is about two things at FamCare that ended up depending on each other. First, getting every screen in the app to give the same answer to "who can go?", and proving it with 270 YAML scenarios on a real database. Second, once availability could be trusted, putting a price on the hours nobody books.

<div class="stat-row">
  <div class="stat"><div class="stat-num">270</div><div class="stat-label">YAML scenarios on a real migrated Postgres</div></div>
  <div class="stat"><div class="stat-num">6</div><div class="stat-label">code paths sharing one definition of "eligible"</div></div>
  <div class="stat"><div class="stat-num">2×</div><div class="stat-label">every scenario runs twice, same answer both times</div></div>
  <div class="stat"><div class="stat-num">5 days</div><div class="stat-label">from zero to the first 239 scenarios</div></div>
</div>

---

## The problem: promised on one screen, refused on another

FamCare caregivers work rostered shifts out of hubs across the city, and families book them by the hour. Every booking passes through several pieces of code that all ask the same question: **is there a caregiver who can do this visit?**

The slot list asks it to decide what to show. The instant-booking button asks it. Recurring bookings, the duration picker and checkout ask it before taking money. Then matching asks it again to decide who actually goes.

Each of these had its own SQL. Over months of fixes, the rules about account state, check-in and missing roster rows got written slightly differently in each place. That produced the worst kind of marketplace bug: **a slot shown that checkout then refused**, or a slot sold that matching couldn't staff. Unit tests never caught it, because each query was correct by its own definition.

## One definition of "eligible"

The fix had to be structural, not another patch. I pulled the definition of who may be considered for a booking into a single module, written as composable SQL fragments: account state, hub and service, shift fit, the check-in policy, and conflicts with the travel buffer. Every caller now builds its `WHERE` clause from those fragments instead of writing its own.

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

| Caller | What it asks |
|---|---|
| Matching pool | who gets ranked |
| Assignment gate | who may actually be assigned |
| Admin manual assign | guards a human's choice too |
| Checkout capacity | can we sell this visit? |
| Slot lists | single, instant, all services |
| Batch capacity | recurring and back-to-back bookings |

Three details made it stick:

- **The policy is written at the top of the module, with the date it was decided.** Changing a rule means changing it there and then updating the scenarios. There's no second place to forget.
- **Shared numbers are shared constants.** "Instant" means a booking that starts within an hour, and checkout and the slot lists both read that one value, so a slot is never offered that checkout then treats differently. The tolerance for a caregiver running over on the same family's previous visit is also one number, used by every conflict check.
- **The one deliberate disagreement is written down.** A caregiver whose shift has started but who hasn't checked in is skipped by matching, but still counts as capacity for a visit later that day. That's on purpose (hiding those slots is exactly what emptied a hub's slot list, more on that below). It's documented in the module and pinned by its own scenarios.

> [!NOTE]
> **Rejected: fix each query until they agree.** That works until the next change to any one of them. Sharing the code is the only agreement that survives new features.

## A test suite written as YAML worlds

A shared module only helps if something proves the callers really agree. So alongside it I built a scenario suite. Each scenario is a small world in YAML (caregivers, their rosters and existing bookings, a customer's history, one request) plus the outcome we expect:

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

The runner seeds each world into a **real, migrated Postgres** and runs the **production code**, not a re-implementation of it. That means the matching pool, ranking and pick, checkout's capacity check, and every slot-list endpoint: single service, all services, recurring dates and times, instant, and the duration picker. It also covers back-to-back batches and the admin's one-click group assign.

### Parity is the default assertion

Unless a scenario explicitly opts out, every slot endpoint's answer must **match checkout's**. So a scenario written to test a check-in rule also proves that the slot list, the recurring picker and the duration picker agree with checkout about it.

### Deterministic, or it doesn't count

Allocation code reads the clock, does travel maths and makes a seeded random choice, so a naive test would be flaky. The harness freezes time on **both** sides of the database boundary: in Python, and inside SQL by replacing `now()`. IDs are derived from the scenario ID. Routing uses a straight-line estimate instead of a live engine. The random draw is seeded by the request ID. And **every scenario runs twice and must give the same answer**.

### Known gaps are tests too

Some scenarios describe behaviour we want but don't have yet. They're marked `known_gap` with a sentence explaining why, and they run as strict expected failures. If someone fixes the bug, the test goes red until the status is flipped to `pass`. So a gap can't close without anyone noticing, and a fixed bug can't quietly come back.

| Area | Scenarios |
|---|---|
| Check-in rules, every combination | 71 |
| Pool eligibility | 30 |
| Top pick and language | 29 |
| Real admin overrides + patterns | 22 |
| Endpoint and availability parity | 19 |
| Back-to-back batches | 17 |
| When the caregiver is revealed | 17 |
| Preferred-caregiver pacing | 14 |
| Pre-visit re-check | 13 |
| Other (ranking, adjacency, tiers…) | 38 |

The first 136 landed on day one, together with the shared module. Check-in alone grew to 71 once we wrote out every combination.

## Turning incidents and overrides into scenarios

The suite grew fastest when reality pushed back.

> [!WARNING]
> **The morning a hub showed nothing.** The first version of the shared policy required check-in for any booking dated today. One morning most of a hub's active caregivers hadn't checked in yet, so every service showed no slots and the app silently fell back to tomorrow.

We rewrote the rule within days. Check-in is now waived until a caregiver's shift starts. Availability doesn't look at it at all for later-today visits. Instant visits still need someone checked in and on shift. Then we wrote out **every combination** as scenarios: booking type × check-in × shift state, capacity, the one-hour edge, other days, and batches. That's 71 scenarios for one rule, because it's the rule that broke.

Admin overrides became data too. We took a month of real cases (over two hundred) where ops overrode the system's suggested caregiver. The distinct ones became scenarios and the rest were grouped into patterns, always with **the admin's choice as the expected answer**. Where the system already agreed, the scenario passes. Where it didn't, the scenario is a `known_gap` whose text says how many real overrides it explains, so the backlog is ordered by evidence. One pattern, about one in five overrides, was a caregiver running slightly over on the same family's previous visit. That's where the shared overrun tolerance came from.

### "No slots" is rarely a headcount problem

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

So the fixes went into the product, not hiring: clear "Full" labels instead of unexplained greyed-out chips, and an "only N left" cue. Almost nine in ten customers who saw an empty day simply picked another date.

## Where the suite sits among our tests

| Layer | Real database | Real HTTP | Catches |
|---|---|---|---|
| Unit tests | no, mocked | no | Logic in one function |
| Integration tests | in-memory fake | no | Service and repository chains |
| Schema tests | yes | no | Migrations and constraints |
| **Scenario suite** | **yes** | in-process | **Whether every screen and matching agree** |

The suite is also explicit about what it doesn't cover. Its README keeps a coverage map by area and a "not covered yet" list.

The next layer we're adding sends real HTTP requests to a running backend. We once had a column whose foreign key pointed at the wrong table. Every mocked test passed, and the endpoint failed on every call in production. Only a request through the real router against a real schema would have caught it.

## Pricing idle time

Rostered caregivers are paid whether or not a family books them, and on average only about half of rostered hours were booked. With availability we could finally trust, the next question was whether price could fill some of the rest.

### Why not surge pricing?

Surge was the first idea on the table. The data said no. On average caregivers were about half busy, and no day-and-hour cell reached 80%. The single tight hour, early evening, turned out to be a staffing gap (about a third fewer caregivers on shift), not a rush of demand. App taps also overstated morning demand by 1.5–2×.

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

Then come the **guardrails**, which matter more than the curve:

- A total cap and a per-hour price floor.
- A check on the value of each booked hour for the hub's day. This replaced an average-order-value guard which, it turned out, blocked every drop on cheap one-hour bookings, even on completely empty slots.
- Admins can deepen or soften an existing drop but never invent one.
- Changing a pricing tier needs one-time codes from two phones.
- A customer's price is held for ten minutes. A lower price applies silently; a higher one must be accepted.

### Simulate first, with production code

Before any customer saw a drop, we replayed real rosters and bookings **as they stood at each hour of the day**, and priced every slot from 8 AM to 8 PM at every viewing hour from 4 AM. The simulator imports the same pricing engine as production, not a copy. We checked the replay against the live simulator cell by cell, and all 715 matched exactly.

| Variant compared | What it does | Outcome |
|---|---|---|
| Gap + flat decay | A fixed step per idle hour, clock starting at the first same-day booking | Not shipped |
| Gap + ramped decay | Steps grow as the slot approaches | Ramp idea carried forward |
| Pace discount | Discount only when bookings beat the usual pace | Not shipped |
| Ramp window, clock from 06:00 | Ramp over the last hours, never before morning | Shipped |
| Minimum-utilisation gate, k = 2 vs 3 | Regular slots stay at full price until some demand shows up | **k = 2 shipped** |

The simulator prices slots, but it can't say how customers react to a price. So we used it to bound the downside instead of predicting the upside. Replayed over two weeks with zero new demand, about a third of same-day orders would have received a drop, at an average depth of about 6%. To break even, dropped slots needed about 7% more booked hours, against a large pool of idle hours to fill. Production then started more conservatively than the defaults, hub by hub.

## What went wrong in pricing

> [!WARNING]
> **The discount went to the wrong people.** In the first eleven days, about half the discount went to customers who would have booked anyway, and a dozen daily regulars took over a third of all drops. Six in ten drop bookings were made less than two hours out, and nearly half came from customers on their eleventh booking or later. Only a handful were genuine win-backs.

Version 2 made drops **about the customer, not just the slot**. Regulars don't get them, there's a lifetime cap per customer, and depth scales by behaviour cohort. Replayed on the same history, the same budget goes about **2× deeper to about half as many customers**.

We also set KPIs before claiming success:

- return on discount above 1.0
- discount under a small share of revenue
- idle hours down by at least 10%
- "price changed at checkout" errors kept rare

We don't have a holdout group yet, so uplift is still unproven, and we say so.

One more lesson: the engine reads only the first hour's utilisation, so a three-hour window that's mostly empty can get nothing. That redesign is next.

## Making a drop visible, and keeping it

A discount the customer doesn't notice is just lost margin. A discount that disappears between screens is worse, because it reads as a bait-and-switch. Most of the app work went into that second problem. The server **holds** a customer's drop for ten minutes, and the app has to carry that held price through every step that can re-price a booking.

- **On the slot grid:** each slot chip carries its drop, and the duration chips and the checkout strip show the drop for the length chosen.
- **Through the flow:** the held price survives adding to cart, stepping the duration, editing the time on the payment screen and checkout's own re-pricing. Each of those was a separate bug where the drop quietly vanished.
- **At payment:** the summary shows the base price and a separate price-drop row, in a receipt-style layout pinned by golden-image tests. If the price moved, a dialog explains it, and a higher price must be accepted.
- **Same rules as the server:** no drop badge on twin bookings, instant checkout or recurring checkout. A drop and a coupon never stack; the app clears the coupon and says so.
- **Measured end to end:** price-drop analytics events across booking and checkout, including why a checkout failed and which price the customer was shown.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/pd-slot.webp" alt="Slot grid with a price drop on the selected slot" />
    <img src="/assets/famcare/case-studies/pd-held.webp" alt="Checkout carrying the held price-drop price" />
    <img src="/assets/famcare/case-studies/pd-price-changed.webp" alt="Dialog explaining that the price has changed" />
    <img src="/assets/famcare/case-studies/pd-receipt.webp" alt="Payment summary with separate price drop and coupon rows" />
  </div>
  <figcaption><b>In the app</b> — a drop on the slot grid, the held price at checkout, the price-changed dialog, and the receipt-style payment summary.</figcaption>
</figure>


To decide how a chip should show a drop, I rendered **four options as golden images from real slot data**, so the team compared real prices rather than mock-ups:

1. a small saving label (what shipped first)
2. the price you pay with the old one struck through
3. a percentage tag
4. the best price with a "Lowest" flag and a one-line reason above the grid

The review also caught two gaps worth fixing: the ten-minute hold had no visible countdown, and clearing a coupon had no explanation.

Notifications got the same treatment in version 2. The server sends one `price_drop_available` event per customer, carrying their cohort, their own drop percentage, how many drops they have left and whether this is the last one. The CleverTap campaign picks one of five messages from that. For example, "we missed you" for a lapsed customer, a "plans changed?" note for someone who usually books a day ahead, or "last chance" when it's the final drop. No message has to guess who it's talking to.

## Flash sales: rarer, deeper, louder

The gradual engine tops out at a modest discount, which is too weak to fill an evening slot that's still mostly empty a few hours out. So the next design does the opposite. It's **rare, deep and time-boxed**, and it's loud about it.

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

**Who gets it.** Everyone except families who already book evenings regularly, since they'd book anyway. That's the lesson of the first price drops, applied up front. Each customer gets at most one flash booking a fortnight, and at most one flash push a day and two a week.

**Stored sales, not computed prices.** A sale is a database row with its depth, spots and close time. It isn't a price computed on the fly, and it isn't a coupon. The sale's ID is **signed into the ten-minute price hold**, so a client can't strip it to dodge the spot count or the fortnightly cap. A customer who got the price in time keeps it even if the sale closes mid-checkout.

**Where the customer sees it.** The server emits a `flash_sale_live` event and a CleverTap journey sends the push ("⚡ 55% off tonight's 7 PM slot. Ends 6:00 PM, only 3 caregivers left"). In the app, a slim **sticky strip** is pinned under the Home header: a teal bar with the offer, how many caregivers are left, and a live countdown. The countdown runs on server time with the app's existing clock-skew correction, so it ends when the sale ends, not when the phone thinks it should. The strip refetches on open, on resume, when the countdown ends and every two minutes. Tapping it, or the push's deep link, opens booking for today with the sale slot already selected.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/flash-home-strip.webp" alt="Home screen with the flash sale strip pinned under the header and a live countdown" />
    <img src="/assets/famcare/case-studies/flash-slot-picker.webp" alt="Slot picker with a 55 percent off flash chip on the 7 PM slot and spots left" />
  </div>
  <figcaption><b>In the app</b> — the sticky strip on Home, and the slot picker with the flash slot, its countdown and spots left.</figcaption>
</figure>


**Why the strip came before a sticky notification.** The app strip ships as an over-the-air patch, so it can reach customers in days. A sticky notification in the phone's notification shade (an Android ongoing notification with a countdown, or an iOS Live Activity) needs new native code, which a patch can't carry. So that went out in a store release, driven by the same sale record and event as the push and the strip.

**Status.** Every part has shipped behind a feature flag:

- the backend: sale rules, data model, pricing hook with the signed sale ID, scheduler, APIs
- the admin section: live sales, kill, force-open, per-hub settings, flash bookings labelled
- the app strip, with the booking and checkout UI and blanket golden coverage
- the sticky notification and Live Activity

Rollout goes to the team first, then one hub for a week, then the rest.

## What's next

- **Tests on the wire.** The HTTP regression layer, so every bug fix adds a case that a real client request would hit.
- **Close the known gaps**, in order of how many real overrides each one explains.
- **Widen flash sales** from the first hub to every hub, and tune depth and timing from what the first weeks show.
- **A real holdout group**, so the next pricing result is a measured uplift rather than a replay.

---

*Stack in this piece: Python, FastAPI, Postgres, pytest with YAML scenario specs, freezegun. Figures are ratios and counts from the backend repository and internal analyses in October and November 2026; no prices or revenue are shown.*
