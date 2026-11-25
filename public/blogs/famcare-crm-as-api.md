# CRM as an API

*By Harshit Agarwal*

Growth teams move faster than release trains. At FamCare our CRM and growth team lives in CleverTap, and ideas like "give lapsed families a coupon" or "call anyone who drops off at payment" used to need an engineer or a manual step. This post is about the small set of APIs and server events I built so that CleverTap journeys can hand out offers and raise support calls on their own, while the backend keeps every rule that touches money.

<div class="stat-row">
  <div class="stat"><div class="stat-num">7</div><div class="stat-label">CleverTap-facing endpoints on one shared contract</div></div>
  <div class="stat"><div class="stat-num">28</div><div class="stat-label">support touchpoints a journey can turn into a call</div></div>
  <div class="stat"><div class="stat-num">3</div><div class="stat-label">price-per-hour floor tiers for offers given on a call</div></div>
  <div class="stat"><div class="stat-num">~600</div><div class="stat-label">test functions across these features</div></div>
</div>

---

## The problem: every campaign was a code change

FamCare is an in-home care marketplace: families book trained caregivers for babies and elders by the hour from an app. Coupons existed, and so did cohorts, but a coupon was either public or targeted at a whole cohort. The CRM team wanted something narrower. They wanted a journey in CleverTap to decide that *this* user, today, gets *this* coupon for seven days, and have it just work at checkout.

They wrote it up as a requirements document for a coupon assignment API. The real request was bigger: a few verbs they could call from a journey, and enough facts from the backend that a journey could pick the right message without guessing.

The split I settled on:

- **CleverTap decides who and when.** Audiences, timing, channels, copy and frequency stay in the journey, where the CRM team can change them without a deploy.
- **The backend decides whether.** Is the user real, is the coupon live, has this grant already been made, does the price stay above our floor? Those rules live in code and run on every call.
- **Nothing is final until checkout.** A grant is a permission to use an offer, not a reserved discount. Checkout validates it again.

<figure>
  <div class="diagram">
    <div class="node muted-node">CleverTap journey<br>picks user + offer</div>
    <span class="arrow">→</span>
    <div class="node accent">Webhook<br>auth, idempotency,<br>rules, grant row</div>
    <span class="arrow">→</span>
    <div class="node">Event back to CleverTap<br>coupon_window_granted</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Checkout<br>re-validates</div>
  </div>
  <figcaption><b>Fig. 1</b> — the journey asks, the backend decides and records, and tells CleverTap what happened so the next step of the journey can use it.</figcaption>
</figure>

## The coupon assignment API

`POST /v1/coupons/assign` takes a FamCare user ID, a coupon (by code or ID), how long the grant lasts, how many uses, and the journey and campaign it came from. It went from design doc to production in a few days in October 2026, and an unassign endpoint followed a few days after that.

Most of the design is about what happens when a marketing tool calls your API thousands of times, sometimes twice.

- **One grant per user and coupon.** A journey that re-enters a user can't hand out the coupon twice, and a repeat call returns `already_assigned` with the grant's current state.
- **Idempotency keys.** The journey sends a key per user and send. A retry with the same key never grants again, and the same key for a different user or coupon is a `409`.
- **A strict body.** Unknown fields are rejected, so a typo in a journey fails loudly instead of being silently ignored.
- **Stable reason codes.** Every refusal says why (`coupon_expired`, `coupon_exhausted`, `user_not_found`…), so CRM can read a journey's failures without asking us.
- **Concurrency on the total limit.** The coupon row is locked inside one transaction with the upsert, so simultaneous calls can't push a coupon past its overall redemption limit.

Security is boring on purpose: a shared secret checked in constant time against a list, so it can be rotated without downtime, and a per-IP rate limit keyed on the last `X-Forwarded-For` entry (the one our load balancer appends; earlier entries are client-supplied). Logs carry user IDs, never phone numbers.

Every new grant fires `coupon_window_granted` back to CleverTap, so the journey can wait for it before sending the message. Nobody announces a coupon that wasn't granted.

> [!NOTE]
> **Rejected: a new assignment table.** I had just built per-user coupon windows (a start, an end and a use count for one user and one coupon) for admins. Reusing them meant checkout, the admin pages and redemption counting already understood grants. A second table would have meant a second answer to "can this user use this coupon?"

### Invite-only coupons

The first version had a gap: everyone else could still type an assigned coupon's code. Hiding it meant switching it off, which also blocked grants, or an empty cohort, which made assign refuse.

So I added an `assigned_only` flag. Nobody can see or use such a coupon until a grant exists, and to everyone else it behaves exactly like a code that doesn't exist: same error, same wording. A grant now overrides cohort targeting everywhere, so the assign API stopped checking cohorts at all.

## A second verb: free minutes

Once the contract existed, the next verb was cheap to add. CRM wanted a gift that isn't money: "add 30 free minutes to your next booking". `POST /v1/free-minutes/assign` reuses the same auth, rate limit, request IDs and error shape, and the app shows a checkbox at checkout when a grant applies.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/crm-free-minutes-offered.webp" alt="Checkout card offering to add free 30 minutes to the booking as a welcome back gift" />
    <img src="/assets/famcare/case-studies/crm-free-minutes-blocked.webp" alt="The same card greyed out, saying it is not applicable because a coupon is applied" />
  </div>
  <figcaption><b>In the app</b> — the gift at checkout, and the same card greyed out when a coupon is already on the order. Offers never stack, and the app says why.</figcaption>
</figure>

The hard part was checkout. The gift extends the same booking at the same price, so the longer booking must pass the normal capacity and opening-hours checks first. And the app creates a new unpaid booking on every Pay tap, so a naive reservation would lock users out of their own gift after one abandoned attempt. Reservations lapse after 30 minutes with no background job, and a new checkout can take over the user's abandoned one. Once paid, the gift is spent, even if the booking is later cancelled.

## Raising calls, not just offers

The same pattern fit support. A journey can call `POST /v1/touchpoints/ticket` for any of 28 touchpoints, from a checkout drop to a low rating or a lapsed regular. The backend owns the registry: priority, call-by time, cooldown, daily cap and an opening line for the caller. It skips customers who already booked, and a shadow mode logs what a touchpoint *would* have raised without creating tickets.

Seven endpoints now share the same auth, rate limit and error contract. I wrote six of them, and a teammate added the seventh, for pass-expiry offers, by importing the same helpers.

## Facts out: server events for targeting

A journey can only be as smart as the properties it can filter on, and many useful ones only exist on the server. I added a batched sender, `send_events_bulk`, that uploads up to 100 events per request and returns a per-event result without ever raising. The team's nightly cohort sync, the price-drop job and the pass-expiry job all use it.

The rule for every event: **send facts, let the journey choose the words.** The clearest example is `price_drop_available`. Every 15 minutes in daytime hours, a job works out which customers a same-day price drop applies to and sends each one the slot, a summary of the day, and their own numbers: behaviour cohort, personal drop percentage, drops left, and whether this is the last one. CleverTap picks the message. The backend caps it at three events per customer per day, one per part of the day, and won't re-tell a slot unless the drop got meaningfully deeper.

| Event | Sent when | What a journey can use |
|---|---|---|
| `coupon_window_granted` / `_revoked` | a grant is made or ended | code, validity, uses left, reason it ended |
| `free_minutes_granted` / `_revoked` | a gift is made or ended | minutes, label, expiry |
| `price_drop_available` | a drop applies to this customer | cohort, personal drop %, drops left, best slot |

Evening flash sales follow the same pattern. A `flash_sale_live` event carries the sale's depth, spots left and close time, so the push and the in-app countdown tell the same story.

## Offers given by a person, with a floor

The coupon API made it easy to give coupons, and the numbers showed that easy wasn't the same as effective. Coupons were a small share of list revenue, very few CleverTap-granted coupons were ever used, and no coupon had ever been granted from the support side. So the next piece put a person back in the loop: an offer suggested to the support agent while they're on a call with a customer.

The suggestion is plain rules, no model. It looks at completed bookings, days since the last one, recent cancellations and low ratings, and earlier support offers, then picks a tier:

| Tier | Floor, per hour | Suggested when |
|---|---|---|
| Standard | Highest | light, lapsed customers, or a small goodwill gesture |
| Harsh case | Middle | a cancellation, low rating or complaint in the last 30 days |
| High potential | Lowest | 3+ completed bookings, last one 30+ days ago; once per customer, ever |

The floor is the lowest price per hour a customer may pay after the offer. It's measured before GST and after the coupon, the same way our revenue numbers count a coupon: as a lower price, not as marketing spend. The card pre-fills an offer a little above the floor, and the agent can edit anything that stays above it. The largest allowed percentage is `1 − floor ÷ list price per hour`, and the server re-checks it on save. Caps sit on top: per agent per day, one offer per customer per 30 days, seven days' validity, one use.

The offer reuses everything above. A booking offer is a one-off `assigned_only` coupon plus a grant with source `support`, so it fires the same CleverTap event and a journey can follow up. The customer just sees a normal coupon.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/crm-receipt-coupon.webp" alt="Payment summary with a coupon discount row and a you saved banner" />
  </div>
  <figcaption><b>In the app</b> — a support offer redeems like any coupon: one discount row on the payment summary. Nothing new for the customer to learn.</figcaption>
</figure>

> [!IMPORTANT]
> **Rejected: a floor check at checkout.** The discount maths is copy-pasted in three places in checkout, and none of them know the booking's hours. Enforcing the floor at assignment meant no checkout or app change. The cost, stated in the spec: if the customer books something cheaper per hour than the reference price, a redemption can dip under the floor. Those are flagged for review, not blocked.

It's merged and running behind the `support_offers` flag, with developer accounts first.

## Server-side ad events

The last piece points at ad platforms instead of CRM. The app sends standard AppsFlyer events for add to cart, checkout and registration. The backend sends Meta's Conversions API the events it knows better than the phone does: sign-up, profile details added, and purchase.

- **Purchase is server-only.** The server knows the real paid amount after coupons and before tax. Mapping it from the app as well would double count.
- **Hashed identity, whitelisted data.** Phone and email go only as SHA-256 hashes. Payloads are built from explicit whitelists, with a list of forbidden keys (child name, date of birth, medical notes, address, coordinates) that must never appear.
- **Exactly once.** Each event claims its ID in a log table with `ON CONFLICT DO NOTHING` before it's sent, so retries and double hooks can't send it twice.
- **Never in the request path.** Hooks schedule a fire-and-forget task that never raises.

Nothing is sent unless the `meta_capi` flag allows the user, the secrets are configured, and the app has uploaded the device context Meta needs.

## What went wrong

- **The same JSON bug, twice.** Our database pool already encodes JSON columns, and in two places I encoded the value again before handing it over. In the coupon API, grant metadata was stored as a JSON string instead of an object. Nothing read it yet, so no harm. In the ad events, the double-encoded device context broke a check constraint, so the upload failed and every server event was skipped until the fix. The coupon fix added a test that fails if a pre-encoded string reaches the query.
- **"Spent grants stay spent" was the wrong rule.** The first version never revived a used or expired grant, which felt safe. The feedback was that assigning a coupon again should behave like a fresh assignment. Now it renews a spent or ended grant. A live grant is never touched, and a retry with the same key still never renews.
- **Staging spent our CleverTap plan.** CleverTap bills every profile that receives an event as a monthly active user. Staging's nightly cohort sync ran against production-like users and sent real events to our test project, which pushed the account over its monthly user limit. Bulk sends now run only in production unless a setting explicitly allows otherwise.
- **Meta read us as a health app.** Once real events arrived, Meta's diagnostics flagged some of our data as health-related and started blocking it. We dropped child age, relationship, pincode and zone from the payloads.

## Offers that end each other

With journeys and support both handing out offers, one customer could hold several. Admin switches, off by default, now let one used offer, a paid pass or any paid booking end the others. "Ended" means expired, never deleted, so history stays, and the hook runs in its own savepoint so it can never fail a payment.

## Results

- CRM can give coupons and free-minute gifts from journeys without an engineer, and raise support calls the same way. Journey coupon grants have run in production since October.
- The contract held up as a pattern: a teammate built a new webhook on it.
- The data told us automatic grants alone weren't enough, so the next step added a human with a floor instead of more automation.
- Ad events were built and merged, server and app, in one day, then needed two days of real-world fixes.

## What's next

- **A checkout floor guard** for support offers, if under-floor redemptions show up in the history.
- **A CleverTap journey on the flash sale event**, so the push goes out from the CRM side.
- **A win-back flow** for people who saw "not serviceable yet" and never signed up: a short web form that books a call. The backend is merged, and nothing goes out until a campaign is switched on.
- **A holdout group** for CRM offers, so we can say what a grant actually changed.

---

*Stack in this piece: Python, FastAPI, Postgres (asyncpg), CleverTap server API and journeys, Meta Conversions API, AppsFlyer, Flutter. Shares and counts come from the backend repository and internal analyses in October and November 2026; floor tiers are internal rules and no customer data is shown.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [All case studies](/case-studies)
