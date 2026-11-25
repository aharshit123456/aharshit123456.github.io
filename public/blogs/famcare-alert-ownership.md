# Who Owns This Alert?

*By Harshit Agarwal*

At FamCare, families book trained caregivers by the hour from an app, for babies and for elders. When a payment goes through and no booking appears, a parent is waiting for someone who isn't coming. None of our existing tools could see that kind of failure. This post covers the monitor I built to catch it, how each alert now names the engineer who owns that part of the system, and the Activity tab that shows what each of us is working on, read straight from git.

<div class="stat-row">
  <div class="stat"><div class="stat-num">37</div><div class="stat-label">checks, every 60 seconds</div></div>
  <div class="stat"><div class="stat-num">2</div><div class="stat-label">runs in a row to go red, and 2 to recover</div></div>
  <div class="stat"><div class="stat-num">8</div><div class="stat-label">areas, each routed to an owner or the leads</div></div>
  <div class="stat"><div class="stat-num">6</div><div class="stat-label">repos synced into the Activity tab every 15 minutes</div></div>
</div>

## The problem

We already had the usual tools. Sentry caught exceptions. A private Prometheus and Grafana tracked request rates, and two global Grafana rules posted to Slack on a high 5xx rate or slow p95. None of them could answer the questions that matter to a care marketplace:

- Was a payment captured more than ten minutes ago while its booking is still waiting for payment?
- Are orders due in the next few hours still sitting without a caregiver?
- Has the payment gateway stopped calling our webhook while people keep checking out?
- Is the scheduler, which assigns caregivers and wakes up booked visits, still alive?

A CPU graph shows none of these. And the alerts we did have went to a shared channel with no owner attached.

So the work had two halves. First, monitor the business, not only the servers. Second, make every alert reach a person.

## The design

<figure><div class="diagram"><div class="node muted-node">famcare-monitor<br>own ECS task</div><span class="arrow">→</span><div class="node">37 checks<br>probes · SQL · traffic</div><span class="arrow">→</span><div class="node accent">Debounced state<br>ok · degraded · failing</div><span class="arrow">→</span><div class="node">Slack post<br>+ owner line</div><span class="arrow">→</span><div class="node muted-node">System Health<br>admin page</div></div><figcaption><b>Fig. 1</b> — one cycle. Every result is stored, but only a change of state (or a 30-minute reminder while red) reaches Slack.</figcaption></figure>

The monitor is the backend's Docker image with a different entrypoint, `monitor_main.py`, running as its own small ECS task (a quarter of a vCPU, half a gigabyte). Every 60 seconds it writes a heartbeat, runs each enabled check, stores the result, feeds it to a state machine, and posts to Slack on a state change.

The checks come in three kinds:

| Kind | What it does | Count |
|---|---|---|
| Probes | Calls read-only public routes over HTTPS as an anonymous guest: guest login, deep health, app config, version gate, the service list, prices, and the three availability routes | 9 |
| SQL invariants | Read-only queries on business state: captured payments still `pending_payment`, webhook silence, a low capture rate, orders stuck unassigned, visits running past their end, the scheduler heartbeat, database connections near the limit | 7 |
| Real traffic | Reads Prometheus for one route at a time: 5xx rate and p95 latency for login, payments, orders, coupons, passes and the caregiver app | 21 |

Each check belongs to one of eight groups: Platform, Login, Catalog, Availability, Payments, Orders, Caregiver App and Assignment. Those groups matter later, because they become the areas people own.

The admin side is a **System Health** page. It polls every 30 seconds and shows one row per check: its state, when it last passed, its p95, and a 24-hour strip. A dead monitor can't look healthy. If the monitor's heartbeat is more than 180 seconds old, every row turns `stale`, which renders red.

## Decisions that mattered

### Its own task, with its own heartbeat

The obvious home was a job inside the scheduler, which already ticks every minute. I rejected it because the scheduler is one of the things that breaks. If the monitor lived inside it, a dead scheduler would also mean a silent monitor. As a separate task, the monitor can still report that the scheduler has gone quiet. The scheduler's heartbeat write is guarded, so it can't break the scheduler's loop.

### Never probe a write route

The routes that matter most are writes: create a payment order, verify a payment, place a booking. Probing them would create real records in production, so the monitor never calls them. Two other kinds of check cover them. The SQL invariants check the state those writes leave behind. The traffic checks read what real users already did through Prometheus.

The first draft of the design had a special monitor token header and a stubbed phone number for the OTP route. I dropped both. The monitor gets an anonymous guest token from the same route the app uses on first launch, and that call is itself the Login check. No new auth code, and no OTP bypass to keep safe. The cost is that we never send a real OTP SMS, so the probe doesn't cover the SMS provider. The traffic checks on OTP send and verify partly cover it.

Traffic windows are sized per route. A busy route is judged over 10 minutes, a rare one over up to 24 hours, and too little traffic to judge counts as healthy. Silence isn't an outage. A route fails only when its error rate is high and it has at least a minimum number of errors, so one stray 5xx can't hold a six-hour window red. Money routes fail on a single error.

### Debounce in a pure function

The state machine in `monitoring/state.py` has no I/O. It takes the previous state and one result and returns the new state and whether it changed.

| From | Run result | Becomes |
|---|---|---|
| ok | 1 failure | still ok (counting) |
| ok | 2 failures in a row | failing, alert |
| failing | 1 pass | still failing |
| failing | 2 passes in a row | ok, "Recovered" |
| ok | 2 slow runs in a row | degraded, alert |
| degraded | 2 good runs in a row | ok |

While a check stays red, Slack gets a reminder every 30 minutes. If a check itself crashes, it reads as failing rather than taking the monitor down, and each check is time-boxed to 20 seconds. Because it is pure, its tests are plain function calls with no database.

### Ownership is data, and routing can never break the alert

The second half lives in a small `engineering` package. The design tables are simple: people (with a Slack member ID, email and git identities), areas (seeded from the eight monitor groups), area ownership with a primary and a backup, and an optional per-check override. Ownership rows are closed, never deleted, so the history of who owned what survives.

When a check changes state, the runner asks an `OwnerRouter` who to tell. Who gets pinged depends on what happened:

| Event | Primary owner | Backup |
|---|---|---|
| Turns red | Slack mention + email | none |
| Still red at the 30-minute reminder | Slack mention + email | Slack mention + email |
| Turns amber | Slack mention only | none |
| Recovers | Slack mention | only if they were pinged for this failure |

An area with no owner still posts and mentions the leads (the tech lead and me), so an alert always reaches a person. People marked as having left are never pinged. Slack text is escaped, so a name can't sneak in a channel-wide ping.

We considered Slack DMs and interactive buttons and left them out. Both need a new Slack app, and we only had an incoming webhook. A webhook post can still mention a person by member ID, and that is enough. Email goes through Amazon SES.

The rule I cared about most: **owner routing must never make monitoring worse than it was.** The router call is limited to 10 seconds. Any failure inside it returns an empty owner line and the normal Slack post still goes out. A 10-minute dedupe stops a retried Slack send from emailing someone twice. The whole thing shipped behind `MONITOR_OWNER_PINGS`, off by default. With the flag off and empty tables, the monitor posted exactly what it posted before. The rollout plan was to import the engineers, assign owners, send each person a test ping from the People tab, and only then turn the flag on. It went on in production the day after the monitor launched. The API has no Slack webhook of its own, so test pings are queued in a table and the monitor sends them on its next cycle.

Here is what an alert looks like now. The values are invented for this post:

```
:rotating_light: *FAILING* — `payments.captured_unbooked` (Payments) (was ok)
count=2, minutes=10
_Why:_ Money was taken but no booking was made: confirm each order below and check the payments webhook logs.
Owner: @payments-owner
```

The `_Why:_` line came later. A teammate added a stored diagnosis to every degraded or failing result: the affected rows for SQL checks, the response body for probes, and for traffic checks the 7-day baseline plus a verdict on whether to raise the threshold or investigate. Slack shows one line of it. System Health shows the full diagnosis when you expand a row.

## Seeing who is working on what

Ownership raised the next question: what is each owner working on? I didn't want status reports, so the Activity tab reads git.

<figure><div class="diagram"><div class="node muted-node">GitHub<br>read-only token</div><span class="arrow">→</span><div class="node">Scheduler job<br>every 15 min</div><span class="arrow">→</span><div class="node">Postgres<br>commits · PRs · branches</div><span class="arrow">→</span><div class="node accent">Activity cards<br>+ cached AI lines</div><span class="arrow">→</span><div class="node muted-node">Ask box<br>cited answers</div></div><figcaption><b>Fig. 2</b> — the Activity pipeline. The model only ever sees text we already stored, never code.</figcaption></figure>

A scheduler job syncs six repositories (backend, admin, customer app, caregiver app, the internal agent and infrastructure) incrementally, with a 180-day first backfill. It runs as a guarded background task, so a slow GitHub can't stall the scheduler. On a rate limit it keeps partial data, doesn't advance its cursors, and backs off until GitHub's reset time. The first version used REST. A first sync of all six repos came to roughly 15,000 REST calls, so I added a GraphQL client with the same method names, chosen by a setting. Production runs on GraphQL.

Each engineer gets a card built by a pure read model:

- **Now:** open PRs and unmerged branches, each with a step from branch to merged.
- **Shipped:** merges in the last 30 days, tagged by area.
- **Areas:** where their merged work landed over 90 days, matched by the same per-area code paths that route alerts.
- **Rhythm:** PRs merged per week over 12 weeks.
- **Watch:** branches with no commit for 14 days, and PRs waiting more than 2 days for review.

A promotion queue lists commits on staging that aren't on main yet, by repo and author, since we promote staging to main as a whole.

There are no scores and no rankings, by rule, in the design, the read model and the prompt.

The plain-language lines ("what this PR does", "what this person is focused on") are written ahead of time and cached by a hash of their inputs, so they regenerate only when a PR changes. The original design used Gemini. I switched to our internal agent service, which calls Claude through its CLI as a single turn with tools disabled. Only PR titles, descriptions, branch names and file paths leave the backend, never diffs, so a secret that was once committed can't leak into a summary. Every AI line says whether it came from the PR description or was inferred.

The Ask box builds a bounded context from stored data, never calling GitHub live. The model must cite PRs as `[repo#number]`, and the backend keeps only citations that were actually in the context it sent.

## What went wrong

- **The first traffic checks never ran for write routes.** I started with a fixed 10-minute window and a minimum of 20 requests. Write routes see about two requests an hour, so they never had enough traffic to judge. I went through about 270,000 requests of load balancer logs from two days and sized each route's window to its real volume. The same logs showed the caregiver app was about 16% of traffic and had no checks at all, so it got its own group.
- **Amber flapped every minute or two.** Only red was debounced, so one slow run turned a check amber and the next good run cleared it. The budgets also sat right on the normal p95 of the availability routes, and above 10 seconds that p95 is estimated inside a 10-second-wide histogram bucket, so it swings on a few dozen requests. Amber now takes two runs in a row like red. It reused an existing counter column, so no schema change. Budgets became about 1.4x the observed 7-day p90, p95 is judged only with at least 30 requests, and long windows need the last 15 minutes to agree. Slow availability is now tracked as performance work, not paged on.
- **A developer's test booking raised a real alert.** The order checks now skip developer accounts and dev hubs, as they already skipped dev-only services.
- **"No slots" isn't an error.** Zero capacity is a valid answer for 12% to 40% of availability calls. It is now recorded as a fact on the result, not a warning.
- **AI summaries depend on another service.** When the agent service is unavailable, the cards still show git data, with AI lines from cache or left empty. The fallback is a local runner I built that does the sync and summaries on a laptop and exports a bundle the Activity tab can upload.

## Results

The monitor, owner routing and Activity tab were built over two days in November 2026 and merged to staging and main. In production the monitor runs as its own service, and owner pings have been on since the day after launch. The Activity sync runs every 15 minutes over GraphQL. Before the monitor and ownership PRs merged, the full backend suite ran clean locally (7,271 and 7,442 passing tests). The monitoring and engineering code have about 80 and 310 focused tests of their own.

The bigger change is in the channel. A red alert now says what broke, gives the evidence, and names one person.

## What's next

- **Handovers.** The design has one more tab, Handovers, unbuilt for now. When someone leaves, the incoming engineer shadows the area as a backup and receives its alerts while the outgoing engineer is still primary. A KT doc is drafted from that area's git history, plus questions only the outgoing engineer can answer. Ownership switches over on a set date.
- **Harden the summary path,** so the local runner is only ever a fallback.
- **Close the OTP gap** with a safe way to probe the SMS provider.
- **Make availability faster,** so its latency budgets can come down.

---

*Stack in this post: Python, FastAPI, asyncpg, Postgres, AWS ECS Fargate, Prometheus, Slack incoming webhooks, Amazon SES, the GitHub GraphQL API, Claude (through our internal agent service), Next.js.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
