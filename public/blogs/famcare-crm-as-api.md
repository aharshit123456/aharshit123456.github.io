# CRM as an API

*By Harshit Agarwal*

A growth team has an idea on Monday: "give lapsed families a coupon for seven days", or "call anyone who drops off at payment". If every one of those ideas needs an engineer, a code change and a release, most of them never happen. But the obvious alternative, letting a marketing tool hand out discounts directly, puts money decisions somewhere nobody reviews them.

This post is about the middle path we took at FamCare: treat the CRM as just another API client. CleverTap journeys call a few backend endpoints to grant offers and raise support calls, and the backend keeps every rule that touches money. The patterns (idempotent webhooks, reason codes, facts-not-copy events, server-side floors) apply wherever a non-engineering tool needs to trigger real actions.

<div class="stat-row">
  <div class="stat"><div class="stat-num">7</div><div class="stat-label">CRM-facing endpoints on one shared contract</div></div>
  <div class="stat"><div class="stat-num">28</div><div class="stat-label">support touchpoints a journey can turn into a call</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">deploys needed to launch a new journey</div></div>
</div>

---

## Who and when, versus whether

FamCare is an in-home care marketplace in India: families book trained caregivers for babies and elders by the hour from an app. Our CRM and growth team lives in CleverTap, which runs *journeys*: flows that pick an audience, wait for events, and send pushes, WhatsApp messages or webhooks.

Coupons already existed, but a coupon was either public or targeted at a whole cohort. The CRM team wanted a journey to decide that *this* user, today, gets *this* coupon for seven days, and have it just work at checkout. The real request was bigger than one endpoint: a few verbs they could call from a journey, and enough facts from the backend that a journey could pick the right message without guessing.

The split that made it safe:

- **The CRM decides who and when.** Audiences, timing, channels, copy and frequency stay in the journey, where the CRM team can change them without a deploy.
- **The backend decides whether.** Is the user real, is the coupon live, has this grant already been made, does the price stay above our floor? Those rules live in code and run on every call.
- **Nothing is final until checkout.** A grant is permission to use an offer, not a reserved discount. Checkout validates it again.

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

It's the same principle as never trusting a browser with a price: the CRM can ask for anything, and the server only does what the rules allow.

## Designing an endpoint for a marketing tool

`POST /v1/coupons/assign` takes a FamCare user ID, a coupon (by code or ID), how long the grant lasts, how many uses, and the journey and campaign it came from. An unassign endpoint mirrors it.

Most of the design is about what happens when a marketing tool calls your API thousands of times, sometimes twice. Webhooks get retried, users re-enter journeys, and the person configuring the webhook isn't reading your API docs line by line. So:

- **One grant per user and coupon.** A journey that re-enters a user can't hand out the coupon twice. A repeat call returns `already_assigned` with the grant's current state.
- **Idempotency keys.** The journey sends a key per user and send. A retry with the same key never grants again, and the same key reused for a different user or coupon is a `409`, because that's a bug in the journey, not a retry.
- **A strict body.** Unknown fields are rejected, so a typo in a journey's payload fails loudly instead of being silently ignored.
- **Stable reason codes.** Every refusal says why (`coupon_expired`, `coupon_exhausted`, `user_not_found`…), so the CRM team can read a journey's failures in CleverTap without asking an engineer.
- **Concurrency on the total limit.** The coupon row is locked inside the same transaction as the grant upsert, so simultaneous calls can't push a coupon past its overall redemption limit.

Security is boring on purpose. A shared secret is checked in constant time against a *list* of accepted secrets, so it can be rotated without downtime: add the new one, update the journeys, remove the old one. A per-IP rate limit is keyed on the last `X-Forwarded-For` entry, the one our load balancer appends; earlier entries are supplied by the client and can be forged. Logs carry user IDs, never phone numbers.

Every new grant fires a `coupon_window_granted` event back to CleverTap, so the journey can wait for it before sending the message. That closes a nasty gap: nobody is ever told about a coupon that wasn't actually granted.

> [!NOTE]
> **Rejected: a new assignment table.** I had just built per-user coupon windows (a start, an end and a use count for one user and one coupon) for admins. Reusing them meant checkout, the admin pages and redemption counting already understood grants. A second table would have meant a second answer to "can this user use this coupon?"

### Invite-only coupons

The first version had a gap: anyone else could still type an assigned coupon's code. The existing ways to hide it didn't fit. Switching the coupon off also blocked grants, and targeting it at an empty cohort made the assign call refuse.

So coupons gained an *assigned-only* mode. Nobody can see or use such a coupon until a grant exists, and to everyone else it behaves exactly like a code that doesn't exist: same error, same wording, so it can't be discovered by guessing. A grant now overrides cohort targeting everywhere, which let the assign API stop checking cohorts at all.

### What "assign again" should mean

The first version never revived a used or expired grant, which felt like the safe choice. The feedback from the people using the API was that assigning a coupon again should behave like a fresh assignment. Now a spent or ended grant is renewed. A live grant is never touched, and a retry with the same idempotency key still never renews. The "safe" rule had been defined from the engineer's side; the right semantics came from the API's users.

## A second verb: free minutes

Once the contract existed, the next verb was cheap to add. The CRM team wanted a gift that isn't money: "add 30 free minutes to your next booking". `POST /v1/free-minutes/assign` reuses the same auth, rate limit, request IDs and error shape, and the app shows a checkbox at checkout when a grant applies.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/crm-free-minutes-offered.webp" alt="Checkout card offering to add free 30 minutes to the booking as a welcome back gift" />
    <img src="/assets/famcare/case-studies/crm-free-minutes-blocked.webp" alt="The same card greyed out, saying it is not applicable because a coupon is applied" />
  </div>
  <figcaption><b>In the app</b> — the gift at checkout, and the same card greyed out when a coupon is already on the order. Offers never stack, and the app says why.</figcaption>
</figure>

The hard part was checkout. The gift extends the same booking at the same price, so the longer booking must first pass the normal capacity and opening-hours checks.

Reservations were the subtle bit. The app creates a new unpaid booking on every Pay tap, so a naive "reserve the gift for this booking" would lock users out of their own gift after one abandoned attempt. Instead, reservations lapse after 30 minutes with no background job, and a new checkout can take over the user's abandoned one. Once paid, the gift is spent, even if the booking is later cancelled.

## Raising calls, not just offers

The same pattern fit support. A journey can call `POST /v1/touchpoints/ticket` for any of 28 touchpoints, from a checkout drop to a low rating or a lapsed regular, and a support ticket appears for the team to call.

The backend owns the registry of touchpoints: each one's priority, call-by time, cooldown, daily cap and an opening line for the caller. It skips customers who already booked. A shadow mode logs what a touchpoint *would* have raised without creating tickets, so a new journey can be watched on real traffic before it fills the support queue.

Seven endpoints now share the same auth, rate limit and error contract. I wrote six of them; a teammate added the seventh, for pass-expiry offers, by importing the same helpers. That's the real test of a contract: someone else can extend it without asking how.

## Send facts, let the journey choose the words

Calls from the CRM are only half the loop. A journey can only be as smart as the properties it can filter on, and many useful ones only exist on the server. The workhorse for sending them is a batched sender that uploads up to 100 events per request and returns a per-event result without ever raising, so a CRM outage can't break a nightly job. The nightly cohort sync, the price-drop job and the pass-expiry job all use it.

The rule for every event: **send facts, let the journey choose the words.** The clearest example is `price_drop_available`. Every 15 minutes in daytime hours, a job works out which customers a same-day price drop applies to and sends each one the slot, a summary of the day, and their own numbers: behaviour cohort, personal drop percentage, drops left, and whether this is the last one. CleverTap picks the message. The backend caps it at three events per customer per day, one per part of the day, and won't re-announce a slot unless the drop got meaningfully deeper.

| Event | Sent when | What a journey can use |
|---|---|---|
| `coupon_window_granted` / `_revoked` | a grant is made or ended | code, validity, uses left, reason it ended |
| `free_minutes_granted` / `_revoked` | a gift is made or ended | minutes, label, expiry |
| `price_drop_available` | a drop applies to this customer | cohort, personal drop %, drops left, best slot |
| `flash_sale_live` | an evening flash sale opens | depth, spots left, close time |

Evening flash sales follow the same pattern, so the push and the in-app countdown tell the same story. Keeping copy out of the backend lets the growth team rewrite any message without a deploy; keeping caps in the backend means no journey misconfiguration can spam a customer.

> [!WARNING]
> **Events have a price.** CleverTap bills every profile that receives an event as a monthly active user. A nightly sync running in a non-production environment against production-like users sent real events to our test project and pushed the account over its monthly user limit. Bulk sends now run only in production unless a setting explicitly allows otherwise. If your CRM bills per active profile, your test environments are a cost centre.

## When easy isn't effective: a person and a floor

The coupon API made it easy to give coupons, and the data showed that easy wasn't the same as effective. Very few journey-granted coupons were ever used, and no coupon had ever been granted from the support side. So the next piece put a person back in the loop: an offer suggested to the support agent while they're on a call with a customer.

The suggestion is plain rules, no model. It looks at completed bookings, days since the last one, recent cancellations and low ratings, and earlier support offers, then picks a tier:

| Tier | Floor, per hour | Suggested when |
|---|---|---|
| Standard | Highest | light, lapsed customers, or a small goodwill gesture |
| Harsh case | Middle | a cancellation, low rating or complaint in the last 30 days |
| High potential | Lowest | 3+ completed bookings, last one 30+ days ago; once per customer, ever |

The floor is the lowest price per hour a customer may pay after the offer. It's measured before GST and after the coupon, the same way our revenue numbers count a coupon: as a lower price, not as marketing spend. The card pre-fills an offer a little above the floor, and the agent can edit anything that stays above it. The largest allowed percentage is `1 − floor ÷ list price per hour`, and the server re-checks it on save, so editing the request can't get around it. Caps sit on top: per agent per day, one offer per customer per 30 days, seven days' validity, one use.

The offer reuses everything above. A booking offer is a one-off assigned-only coupon plus a grant tagged as coming from support, so it fires the same CleverTap event and a journey can follow up. The customer just sees a normal coupon.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/crm-receipt-coupon.webp" alt="Payment summary with a coupon discount row and a you saved banner" />
  </div>
  <figcaption><b>In the app</b> — a support offer redeems like any coupon: one discount row on the payment summary. Nothing new for the customer to learn.</figcaption>
</figure>

> [!IMPORTANT]
> **Trade-off: enforce the floor at assignment, not at checkout.** The discount maths is duplicated in three places in checkout, and none of them know the booking's hours. Enforcing the floor when the agent assigns the offer meant no checkout or app change. The cost, written into the spec: if the customer books something cheaper per hour than the reference price, a redemption can dip under the floor. Those are flagged for review, not blocked.

## Offers that end each other

With journeys and support agents both handing out offers, one customer could hold several. Admin switches, off by default, let one used offer, a paid pass or any paid booking end the others. "Ended" means expired, never deleted, so history stays, and the hook runs in its own savepoint so it can never fail a payment.

## Server-side ad events

The last piece points at ad platforms, with the same instinct: the server reports what it knows best. The app sends standard AppsFlyer events for add to cart, checkout and registration. The backend sends Meta's Conversions API the events it knows better than the phone does: sign-up, profile details added, and purchase.

- **Purchase is server-only.** The server knows the real paid amount after coupons and before tax. Sending it from the app as well would double count.
- **Hashed identity, whitelisted data.** Phone and email go only as SHA-256 hashes. Payloads are built from explicit whitelists, with a list of forbidden keys (child name, date of birth, medical notes, address, coordinates) that must never appear.
- **Exactly once.** Each event claims its ID in a log table with `ON CONFLICT DO NOTHING` before it's sent, so retries and duplicate hooks can't send it twice.
- **Never in the request path.** Hooks schedule a fire-and-forget task that never raises.

Nothing is sent unless a feature switch allows the user, the secrets are configured, and the app has uploaded the device context Meta needs.

Real traffic taught two lessons. First, Meta's diagnostics read some of our data as health-related and started blocking it. We dropped child age, relationship, pincode and zone from the payloads. In a sensitive category, assume the platform will classify your fields more strictly than you do.

Second, the same JSON bug appeared twice. Our database pool already encodes JSON columns, and in two places I encoded the value again. In the coupon API, grant metadata became a JSON string instead of an object, harmlessly, since nothing read it yet. In the ad events, the double-encoded device context broke a check constraint, so every server event was skipped until the fix. A test now fails if a pre-encoded string reaches the query.

## Takeaways

- **Treat the CRM as an untrusted client.** Let it decide who and when; keep "whether" and "how much" on the server, and re-check at checkout.
- **Design webhooks for retries and re-entry.** One grant per user and offer, idempotency keys that conflict loudly on misuse, strict bodies and stable reason codes.
- **Close the loop with events.** Tell the CRM what actually happened, and have journeys wait for that event before messaging anyone.
- **Send facts, not copy.** The backend owns numbers and caps; the journey owns words.
- **Build a shadow mode in from day one.** Being able to watch what a trigger *would* do is the cheapest safety net there is.
- **Put money floors where they can be enforced cheaply, and say what they miss.** A check at assignment with flagged exceptions beat a risky change to checkout.

The open question is measurement. A holdout group for CRM offers, customers who would have qualified but get nothing, is the only honest way to say what a grant actually changed, and it's the natural next step for this design.

---

*Stack in this piece: Python, FastAPI, Postgres (asyncpg), CleverTap server API and journeys, Meta Conversions API, AppsFlyer, Flutter. Counts come from the backend repository and internal analyses in October and November 2026; floor tiers are internal rules and no customer data is shown.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): code push for a Flutter app, why patches get refused, and what CI really costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [Three Outages and the Infrastructure They Left Behind](/blog/famcare-incidents-and-infra): three production incidents, the guardrails each left behind, and how we write up root causes.
- [All case studies](/case-studies)
