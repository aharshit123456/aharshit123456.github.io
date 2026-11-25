# Who Owns This Alert?

*By Harshit Agarwal*

Picture a parent paying for a babysitter at eight in the morning. The payment goes through, but the booking never gets created. Every server is healthy, error rates are flat, latency is fine, and somewhere a parent is waiting for someone who isn't coming. Most monitoring stacks would stay green through this. This post is about two ideas that fixed it for us: monitor the promises the business makes, not just the machines, and make sure every alert lands on one named person rather than in a channel that belongs to everyone and therefore to no one.

FamCare is an in-home care marketplace in India. Families book trained caregivers by the hour from an app, for babies and for elders. Behind the app are payments, a scheduler that assigns caregivers and wakes up booked visits, and a separate app the caregivers use.

<div class="stat-row">
  <div class="stat"><div class="stat-num">37</div><div class="stat-label">checks, every 60 seconds</div></div>
  <div class="stat"><div class="stat-num">2</div><div class="stat-label">runs in a row to go red, and 2 to recover</div></div>
  <div class="stat"><div class="stat-num">8</div><div class="stat-label">areas, each routed to an owner or the leads</div></div>
</div>

## Green dashboards, broken promises

We already had the usual tools. Sentry caught exceptions. Prometheus and Grafana tracked request rates, and two global Grafana rules posted to Slack on a high 5xx rate or a slow p95. That is **infrastructure monitoring**: it tells you whether the machines are answering. It can't tell you whether the answers are right.

The failures that hurt a care marketplace are different. They look like this:

- Was a payment captured more than ten minutes ago while its booking is still waiting for payment?
- Are orders due in the next few hours still sitting without a caregiver?
- Has the payment gateway stopped calling our webhook while people keep checking out?
- Is the scheduler, which assigns caregivers and wakes up booked visits, still alive?

Each of these is a **business invariant**: a statement that should always be true about the data ("every captured payment has a booking within ten minutes"). When one breaks, every request may still return 200. The only way to see it is to ask the database directly.

The second problem was the destination. Our alerts went to a shared channel with no owner attached, where each reader assumes someone else has it. **Alert ownership** means every alert names the one person responsible for looking first, with a defined path when that person doesn't.

## A monitor that watches the business

<figure><div class="diagram"><div class="node muted-node">Monitor<br>own ECS task</div><span class="arrow">→</span><div class="node">37 checks<br>probes · SQL · traffic</div><span class="arrow">→</span><div class="node accent">Debounced state<br>ok · degraded · failing</div><span class="arrow">→</span><div class="node">Slack post<br>+ owner line</div><span class="arrow">→</span><div class="node muted-node">System Health<br>admin page</div></div><figcaption><b>Fig. 1</b> — one cycle. Every result is stored, but only a change of state (or a 30-minute reminder while red) reaches Slack.</figcaption></figure>

The monitor is the backend's own Docker image with a different entrypoint, running as a small ECS task of its own (a quarter of a vCPU, half a gigabyte). Every 60 seconds it writes a heartbeat, runs each enabled check, stores the result, feeds it to a state machine, and posts to Slack when the state changes.

The checks come in three kinds, and each kind sees something the others can't:

| Kind | What it does | Count |
|---|---|---|
| Probes | Calls read-only public routes over HTTPS as an anonymous guest: guest login, deep health, app config, version gate, the service list, prices, and the three availability routes | 9 |
| SQL invariants | Read-only queries on business state: captured payments still waiting for payment, webhook silence, a low capture rate, orders stuck unassigned, visits running past their end, the scheduler heartbeat, database connections near the limit | 7 |
| Real traffic | Reads Prometheus for one route at a time: 5xx rate and p95 latency for login, payments, orders, coupons, passes and the caregiver app | 21 |

Probes ask "does it answer?", SQL invariants ask "is the data consistent?", and traffic checks ask "is it working for real users right now?". Each check belongs to one of eight groups: Platform, Login, Catalog, Availability, Payments, Orders, Caregiver App and Assignment. Those groups matter later, because they become the areas people own.

On the admin side, a **System Health** page polls every 30 seconds and shows one row per check: its state, when it last passed, its p95, and a 24-hour strip.

## Put the watcher outside what it watches

The obvious home for the monitor was a job inside the scheduler, which already ticks every minute. I rejected it because the scheduler is one of the things that breaks. If the monitor lived inside it, a dead scheduler would also mean a silent monitor, and silence reads as "all good". As a separate task, the monitor can report that the scheduler has gone quiet. The scheduler's own heartbeat write is guarded so it can never break the scheduler's loop.

The same logic applies one level up: who watches the monitor? The System Health page does. If the monitor's heartbeat is more than 180 seconds old, every row turns `stale`, which renders red. A dead monitor can't look healthy.

## Never probe a write

The routes that matter most are writes: create a payment order, verify a payment, place a booking. Probing them would create real records in production, so the monitor never calls them. The other two kinds of check cover them instead. SQL invariants check the state those writes leave behind, and traffic checks read what real users already did, through Prometheus.

The first draft had a special monitor token and a stubbed phone number for OTP login. I dropped both: the monitor gets an anonymous guest token from the same route the app uses on first launch, and that call is itself the Login check. No new auth code, and no OTP bypass to keep safe. The trade-off is that no real OTP SMS is sent, so probes don't cover the SMS provider; traffic checks on OTP send and verify partly do.

### Size the window to the traffic

Traffic checks have a subtle failure mode: on a quiet route they never fire. My first version judged every route over a fixed 10-minute window with a minimum of 20 requests. Write routes see about two requests an hour, so they never had enough traffic to judge, and the checks that mattered most were the ones that never ran.

I went through about 270,000 requests of load balancer logs from two days and sized each route's window to its real volume. A busy route is judged over 10 minutes, a rare one over up to 24 hours. Too little traffic to judge counts as healthy, because silence isn't an outage. A route fails only when its error rate is high *and* it has a minimum number of errors, so one stray 5xx can't hold a six-hour window red. Money routes are the exception: they fail on a single error.

The same logs showed something we hadn't seen: the caregiver app was about 16% of traffic and had no checks at all. It got its own group.

## Debounce in a pure function

A check that flips on every blip trains people to ignore it. The fix is **hysteresis**: require a condition to hold for a few runs before changing state, in both directions. Our state machine takes the previous state and one result, returns the new state and whether it changed, and does no I/O at all.

| From | Run result | Becomes |
|---|---|---|
| ok | 1 failure | still ok (counting) |
| ok | 2 failures in a row | failing, alert |
| failing | 1 pass | still failing |
| failing | 2 passes in a row | ok, "Recovered" |
| ok | 2 slow runs in a row | degraded, alert |
| degraded | 2 good runs in a row | ok |

While a check stays red, Slack gets a reminder every 30 minutes. A check that crashes reads as failing rather than taking the monitor down, and each check is time-boxed to 20 seconds. Because the state machine is pure, its tests are plain function calls with no database.

The last two rows came from a lesson. At first only red was debounced, so one slow run turned a check amber and the next good run cleared it: amber flapped every minute or two. Two things were going on.

- **Missing hysteresis.** Amber now takes two runs in a row, like red, reusing an existing counter column, so no schema change.
- **A budget sitting on the noise.** The availability routes' latency budgets sat right on their normal p95, and above 10 seconds that p95 was estimated inside a 10-second-wide histogram bucket. Prometheus interpolates quantiles inside a bucket, so with a wide bucket and a few dozen requests the estimate swings a lot. Budgets became about 1.4x the observed 7-day p90, p95 is only judged with at least 30 requests, and long windows also need the last 15 minutes to agree.

Slow availability is now tracked as performance work rather than paged on. A page should mean "someone needs to act now".

The data taught two smaller lessons. A developer's test booking raised a real alert, so order checks now skip developer accounts and test hubs. And "no slots" isn't an error: zero capacity is a valid answer for 12% to 40% of availability calls, so it's recorded as a fact on the result, not a warning.

## Ownership is data

**Alert routing** is the step between "something broke" and "someone knows". Paging tools like PagerDuty model it with services, owners and escalation policies. We needed a small version of that, so ownership lives in a few tables: people (with a Slack member ID, email and git identities), areas seeded from the monitor's eight groups, area ownership with a primary and a backup, and an optional per-check override. Ownership rows are closed, never deleted, so the history of who owned what survives.

When a check changes state, the monitor asks a router who to tell. The answer depends on what happened:

| Event | Primary owner | Backup |
|---|---|---|
| Turns red | Slack mention + email | none |
| Still red at the 30-minute reminder | Slack mention + email | Slack mention + email |
| Turns amber | Slack mention only | none |
| Recovers | Slack mention | only if they were pinged for this failure |

That table is a tiny escalation policy: the primary hears first, the backup joins only if red persists, and amber is a heads-up rather than an interruption. An area with no owner still posts and mentions the engineering leads, so an alert always reaches a person. People marked as having left are never pinged. Slack text is escaped, so a name can't sneak in a channel-wide ping.

We considered Slack DMs and interactive "acknowledge" buttons and left them out. Both need a full Slack app, and we only had an incoming webhook. A webhook post can still mention a person by member ID, and that turned out to be enough. Email goes through Amazon SES.

## Routing must never make alerting worse

The rule I cared about most: **owner routing must never make monitoring worse than it was before.** Routing is an enrichment, so any failure in it must degrade to the old behaviour, never to silence.

- The router call is limited to 10 seconds. Any failure inside it returns an empty owner line, and the normal Slack post still goes out.
- A 10-minute dedupe stops a retried Slack send from emailing someone twice.
- The whole feature sat behind a kill switch, off by default. With the switch off and empty tables, the monitor posted exactly what it posted before.

Rollout followed from that: import the engineers, assign owners, send each person a test ping from the admin panel, and only then turn the switch on. The admin API doesn't hold a Slack webhook of its own, so test pings are queued in a table and the monitor sends them on its next cycle.

Here is what an alert looks like now. The values are invented for this post:

```
:rotating_light: *FAILING* — `payments.captured_unbooked` (Payments) (was ok)
count=2, minutes=10
_Why:_ Money was taken but no booking was made: confirm each order below and check the payments webhook logs.
Owner: @payments-owner
```

The `_Why:_` line came later, from a teammate. Every degraded or failing result now stores a diagnosis: the affected rows for SQL checks, the response body for probes, and for traffic checks the 7-day baseline plus a verdict on whether to raise the threshold or investigate. Slack shows one line; System Health shows the full diagnosis when you expand a row.

## Reading what owners work on from git

Ownership raised the next question: what is each owner working on? I didn't want status reports, so an Activity tab in the admin panel reads git instead.

<figure><div class="diagram"><div class="node muted-node">GitHub<br>read-only token</div><span class="arrow">→</span><div class="node">Scheduler job<br>every 15 min</div><span class="arrow">→</span><div class="node">Postgres<br>commits · PRs · branches</div><span class="arrow">→</span><div class="node accent">Activity cards<br>+ cached AI lines</div><span class="arrow">→</span><div class="node muted-node">Ask box<br>cited answers</div></div><figcaption><b>Fig. 2</b> — the Activity pipeline. The model only ever sees text we already stored, never code.</figcaption></figure>

A scheduler job syncs six repositories incrementally, with a 180-day first backfill. It runs as a guarded background task, so a slow GitHub can't stall the scheduler. On a rate limit it keeps the partial data, doesn't advance its cursors, and backs off until GitHub's reset time. A first sync over the REST API came to roughly 15,000 calls; GraphQL fetches nested data in one request, so I added a GraphQL client with the same method names, chosen by a setting.

Each engineer gets a card built by a pure read model: open pull requests and unmerged branches, merges in the last 30 days, which areas their work landed in over 90 days (matched by the same per-area code paths that route alerts), a 12-week rhythm, and a watch list of branches idle for 14 days or pull requests waiting more than 2 days for review. There are no scores and no rankings, by rule, in the design, the read model and the prompt. The tab answers "who is on what", not "who is doing best".

Plain-language lines ("what this pull request does") are generated ahead of time and cached by a hash of their inputs. They come from our internal agent service, which calls Claude through its CLI as a single turn with tools disabled. Only titles, descriptions, branch names and file paths leave the backend, never diffs, so a secret that was once committed can't leak into a summary. Every AI line says whether it came from the pull request's description or was inferred.

The Ask box builds a bounded context from stored data and never calls GitHub live. The model must cite pull requests as `[repo#number]`, and the backend keeps only citations that were actually in the context it sent, so an invented reference is dropped before anyone sees it.

## Takeaways

- **Write down your business invariants and query them.** "Every captured payment has a booking within ten minutes" is a SQL query, and it catches failures no CPU or error-rate graph will.
- **Don't let the watcher share a failure mode with what it watches.** Run the monitor separately, give it a heartbeat, and make a stale heartbeat look red.
- **Never probe writes in production.** Check the state writes leave behind, and read real traffic for the rest.
- **Size alert windows to traffic, and debounce in both directions.** A fixed window ignores quiet routes; a flapping state trains people to ignore it.
- **Make ownership data, with a fallback.** Every alert names one person, escalates to a backup if it persists, and goes to the leads when an area has no owner.
- **Enrichment must fail open.** Routing, diagnosis and summaries can add to an alert, but a bug in them should never stop the alert itself.

The natural next step is handovers: when someone leaves an area, the incoming engineer shadows it as backup, a knowledge-transfer document is drafted from the area's git history, and ownership switches over on a set date. The tables already keep ownership history, so most of the data is there.

---

*Stack in this post: Python, FastAPI, asyncpg, Postgres, AWS ECS Fargate, Prometheus, Slack incoming webhooks, Amazon SES, the GitHub GraphQL API, Claude (through our internal agent service), Next.js.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): code push for a Flutter app, why patches get refused, and what CI really costs.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [Three Outages and the Infrastructure They Left Behind](/blog/famcare-incidents-and-infra): three production incidents, the guardrails each left behind, and how we write up root causes.
- [All case studies](/case-studies)
