# A Care Marketplace on One Boring Backend

*By Harshit Agarwal*

When you order food, the hard part is over once the order is placed. When a family books a caregiver, the hard part is only starting. Someone has to travel across a city, ring the right doorbell, prove it's really them, and then look after a baby or an elderly parent for hours, while the system tracks every step and stays ready for an emergency. What does a backend look like when a small team has to get all of that right, without a platform team behind it?

This post is my answer from running engineering at FamCare. It's less about clever technology than about the few rules that let boring technology carry the weight.

<div class="stat-row"><div class="stat"><div class="stat-num">1,400+</div><div class="stat-label">API routes, one FastAPI codebase</div></div><div class="stat"><div class="stat-num">400+</div><div class="stat-label">schema migrations, rebuilt and checked in CI</div></div><div class="stat"><div class="stat-num">~7,000</div><div class="stat-label">automated backend tests</div></div><div class="stat"><div class="stat-num">4</div><div class="stat-label">client apps on the same API</div></div></div>

## A booking is a physical event, not an order

FamCare is an in-home care marketplace in India. Families book babysitting or elder care by the hour from an app, and a trained caregiver comes to the home. Along the way the system has to take money, pick and send the right person, show the family where that person is, prove they've arrived, and react within seconds if something goes wrong.

That gives the backend four jobs that pull in different directions:

- **Money** must be exactly right.
- **State** must never skip a step.
- **Real time** must reach the right phone.
- **Safety** must work even when everything else is having a bad day.

Our answer was deliberately boring technology plus a short list of rules we don't bend.

## One codebase, one image, four roles

There's one backend. Four clients talk to it: the customer app, the caregiver app, the admin panel and a public live tracking page. Everything behind the load balancer runs on AWS ECS Fargate from a single Docker image.

<figure><div class="diagram"><div class="node muted-node">4 client apps</div><span class="arrow">→</span><div class="node">Load balancer</div><span class="arrow">→</span><div class="node accent">ECS Fargate<br>one image, four roles</div><span class="arrow">→</span><div class="node">Postgres · Redis · S3</div></div><figcaption><b>Fig. 1</b> — every process runs the same image with a different command, so the API, scheduler and monitor share one copy of the business rules.</figcaption></figure>

The "one image, four roles" idea is worth stealing. The API, the background scheduler, the monitor and the migration runner are the same build started with different commands. There's no second service that re-implements "what counts as a late booking" slightly differently, because there's only one copy of that code.

| Layer | Piece | Notes |
|---|---|---|
| Clients | Customer app | Flutter, OTP login |
| | Caregiver app | React + Capacitor |
| | Admin panel | Next.js, cookie proxy |
| | Live tracking page | Public, signed link |
| Edge | Load balancer | REST, a WebSocket channel per role, SSE for admin. Path rules split production and staging |
| ECS roles | API | 2–10 tasks, autoscaled, with a routing (OSRM) sidecar |
| | Scheduler | 60 s tick, runs jobs, writes a heartbeat row |
| | Monitor | Its own task, alerts to Slack |
| | Migrate | Runs before every deploy |
| Data | Aurora Postgres | Serverless v2, raw SQL, the source of truth |
| | Redis | Pub/sub fan-out and cache, every key prefixed by environment |
| | S3 | Documents and assets |
| Outside | Third parties | Payments and webhooks, push (FCM), SMS OTP, email, masked calls, SOS voice conference, CRM and product analytics, LLMs and speech, background checks, face liveness |

The backend is a single FastAPI service in modern Python. It has about a hundred domain packages (bookings, assignment, payments, wallets, pricing, SOS and so on), each split the same way: router, service, repository, models.

It talks to Postgres in **raw SQL through asyncpg, with no ORM**. That's a trade-off. You write more SQL by hand, but every query is visible in code review and in the slow-query log exactly as it runs, with nothing generated behind your back. Transactions all go through one helper, so "what's in this transaction?" always has one answer.

## Make the state machine a table

<figure><div class="diagram"><div class="node muted-node">pending pay</div><span class="arrow">→</span><div class="node">new</div><span class="arrow">→</span><div class="node">assigned</div><span class="arrow">→</span><div class="node">en route</div><span class="arrow">→</span><div class="node">arrived</div><span class="arrow">→</span><div class="node">in progress</div><span class="arrow">→</span><div class="node accent">completed</div></div><figcaption><b>Fig. 2</b> — the main booking path. Each step has a guard that must pass before the booking can enter it.</figcaption></figure>

Many systems model status as a string column that any code path may overwrite. That works until two code paths disagree about what "assigned" can turn into. A **finite state machine** fixes this by listing the legal moves up front: from each state, these are the states you may go to, and this is the condition you must meet to get there.

We keep the allowed moves in one explicit transition table:

| State | Guard to enter it |
|---|---|
| new | Payment captured, or reconciled later |
| assigned | Matching, automatic or by an admin, under a lock |
| en route | Caregiver sets off |
| arrived | Geofence: inside ~200 m of the home |
| in progress | Face check plus the family's one-time code |
| completed | Activity log submitted |
| scheduled (side state) | Parked if the visit is hours away. The scheduler wakes it up |

Inside the cancellation window, cancelling needs an explicit fee confirmation. Completed and cancelled are final.

Two details make the table trustworthy. First, every transition takes a **row lock** on the booking before it checks anything. A row lock means a second transaction that wants the same booking has to wait until the first one commits, so two phones tapping at once can't both win. Second, the guards are physical as well as logical. A caregiver can't mark *arrived* from across town, and a visit can't *start* until a face check passes and the family reads out a one-time code.

Humans still need an escape hatch, so admins can override the table. Middleware writes every admin action to an audit log, which makes the override visible instead of silent.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/sys-booked.webp" alt="Booking confirmed screen before the caregiver is revealed" />
    <img src="/assets/famcare/case-studies/sys-in-progress.webp" alt="Visit in progress with a countdown timer and the PIN to end the visit" />
  </div>
  <figcaption><b>In the app</b> — a confirmed booking before the caregiver is revealed, and a visit in progress with its timer and the one-time PIN.</figcaption>
</figure>

## Assume the payment provider will lie by omission

Payment providers tell you what happened through webhooks, an HTTP call to your server when a payment succeeds. Webhooks get delayed, retried, duplicated and occasionally lost. If you treat them as the only source of truth, sooner or later a customer pays and no booking appears. We defend in three layers:

- **Webhooks are idempotent.** An operation is idempotent if doing it twice has the same effect as doing it once. Each provider event ID is stored with a unique constraint, so a replayed webhook hits the constraint and becomes a no-op.
- **A reconciler closes the gap.** Every five minutes it asks the provider about orders still marked "created". If the customer actually paid, the booking gets activated, idempotently, as if the webhook had arrived. Push is the fast path; polling is the safety net.
- **Assignment is serialised.** One checkout can fire the assignment step several times at once. Batch assignment runs under a Postgres **advisory lock**, a lock on an application-chosen key rather than a table row. It's a cheap way to say "only one process may do this job at a time" using the database you already have.

## Real time across many servers

The customer watches the caregiver travel, the caregiver gets new jobs, and ops watch everything. Each role has its own WebSocket channel. The admin panel uses Server-Sent Events instead, relayed through its own same-origin proxy so the browser never holds a token.

Long-lived connections create a classic problem once you have more than one server. A WebSocket is pinned to whichever API task accepted it. With 2–10 tasks behind the load balancer, the task holding a customer's socket often isn't the one that received the caregiver's location update.

The standard fix is a **fan-out bus**. Every broadcast goes through Redis pub/sub, and every task delivers the message to whichever of its own sockets care about it.

<figure><div class="diagram"><div class="node muted-node">Caregiver<br>update</div><span class="arrow">→</span><div class="node">API task A</div><span class="arrow">→</span><div class="node accent">Redis pub/sub</div><span class="arrow">→</span><div class="node">API task B</div><span class="arrow">→</span><div class="node muted-node">Customer's<br>socket</div></div><figcaption><b>Fig. 3</b> — whichever task receives an update publishes it; whichever task holds the socket delivers it.</figcaption></figure>

Staging and production even share one Redis, which is safe because every key and channel is prefixed with the environment name.

## Conventions that delete whole classes of bugs

Some bugs are best fixed by making them impossible to write:

- **Money is integer paise** (hundredths of a rupee). No floats, no rounding drift, no "₹99.99999". Wallet balances have a ledger behind them.
- **Phones are ten digits.** Normalised at every entry point and backfilled once, so "+91…" and "0…" never create a second account.
- **Time is UTC, business days are IST.** Stored as timestamps with a time zone, and converted only where a rule talks about "today".
- **One definition per question.** Eligibility, pricing and feature flags each have one pure function that every caller uses. Why that matters so much is a story for a separate post.

None of these is clever. Each removes a family of bugs for good.

## Treat migrations like production code

With several engineers shipping schema changes every week, migrations were our most dangerous artefact. Most migration tools chain revisions: each migration names the one before it, and the newest is called the **head**. When two people branch from the same head, you get two heads, and the order in which they apply becomes a coin toss. Raw-SQL migrations give us full control; these rules make that control safe:

- **New migrations ship with a test that applies them to a real Postgres.** This started after a foreign-key bug sailed past mocked tests.
- **A committed schema snapshot must match the migration chain.** CI rebuilds the schema from scratch and compares. The snapshot doubles as a reviewable diff of what each change does to the database.
- **Exactly one head, re-pointed when changes land.** This came from an incident where two branches' migrations raced and a live database silently skipped a schema change. CI now renumbers diverged heads automatically, but it never renames a migration that has already run anywhere.
- **Drift checks run inside the network.** Every six hours a short-lived task compares the live databases with the code, so CI never needs database credentials.

## Infrastructure: import first, change later

Production was first built by hand in the AWS console. That's normal for a young company and a problem for an older one: nobody can review a console click. Before adding anything, we mirrored it into Terraform without changing a byte.

<figure><div class="diagram"><div class="node muted-node">Read-only<br>discovery</div><span class="arrow">→</span><div class="node">Generic<br>modules</div><span class="arrow">→</span><div class="node">terraform import<br>per resource</div><span class="arrow">→</span><div class="node accent">plan until<br>0 changes</div><span class="arrow">→</span><div class="node muted-node">Build<br>staging</div></div><figcaption><b>Fig. 4</b> — we ran plan again and again until it showed zero changes and zero forced replacements, and only then built anything new.</figcaption></figure>

`terraform import` attaches an existing resource to a definition in code. `terraform plan` then shows what Terraform *would* change to make reality match the code. A plan with zero changes is proof that the code describes production exactly. Getting there is tedious, but it means the first apply is a no-op rather than an outage. Today about 120 resource definitions live in code, and the rule is simple: no one-off console edits.

### A second environment without a second load balancer

The staging environment has its own ECS cluster and its own private database, which can scale to zero when idle, so tests can never touch production data. It shares production's network and load balancer through path rules:

| Path | Goes to |
|---|---|
| `/api/*` | production |
| `/staging/api/*` | staging |

That needed no DNS changes and no second load balancer. The load balancer can't rewrite paths, so the app simply serves under a configurable path prefix. Separate where it matters (compute and data), shared where it's safe (network and edge).

### Small decisions that carried weight

- **Give each field exactly one owner.** CI owns the running image; Terraform owns the shape of the service. Terraform ignores task definition revisions, after an apply once came close to rolling production back to an older image because two tools thought they owned the same field.
- **Scale on the database, not just CPU.** The API scales out on CPU *and* on sustained database connection pressure, because CPU-only scaling missed a connection pool filling up. Every query also gets a default timeout, after an incident where the pool got stuck.
- **Pay for use, not for headroom.** Serverless Postgres bills for capacity actually used, so raising its ceiling costs nothing until it's needed. We also switched off an AWS recording service nobody read, which cut a noticeable line from the bill.

## Changing behaviour without a deploy, or an app release

### Flags with one evaluator

Feature flags live in the database with four states: off, developers only, live, and targeted at named user groups. One pure function evaluates them. We built them in-house instead of using our analytics tool's flags because server code, like pricing, has to get exactly the same answer as the app. Two evaluators would eventually disagree.

Tunable numbers (geofence radius, cancellation window, kill switches) live in an admin-editable settings table, so ops can change a radius without an engineer.

### The customer app updates itself

App store review takes days. Production builds of the customer app are made with Shorebird, which can push Dart code patches **over the air**: the installed app fetches updated Dart code from a patch server, with no store review in between. The catch is that a patch can't change native code or bundled assets, so our patch pipeline refuses such changes unless someone explicitly opts in. Releases ship the full icon font, so using a new icon in a patch isn't an asset change.

For changes a patch can't carry, the backend can mark old builds as unsupported. The app then shows an update sheet that can't be dismissed. Individual features can also require a minimum app build, so the server never offers something an old client can't render.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/sys-force-update.webp" alt="Update available sheet that cannot be dismissed" />
  </div>
  <figcaption><b>In the app</b> — the update sheet an unsupported build gets. It can't be dismissed.</figcaption>
</figure>

## Monitor the business, not just the servers

The monitor is its own service, not a job inside the scheduler. If the scheduler is what broke, the monitor still runs. Every minute it checks:

- **Read-only probes** of the paths a customer takes: guest login, the deep health check, the catalogue, the version check, availability.
- **Business invariants in SQL:** a payment captured with no booking, webhooks gone quiet, orders stuck without a caregiver, visits running long, the scheduler's heartbeat, database connections near the limit.
- **Traffic:** error rates and 95th-percentile latency on login, payment, order and caregiver routes.

Alerts are debounced: two failures to go red, two passes to recover. That bit of hysteresis stops a flaky check from flapping a channel into uselessness. Alerts go to Slack only when state changes, and they tag the engineer who owns that area. Errors also flow to Sentry, logs to CloudWatch, and metrics to a private Prometheus and Grafana.

> [!IMPORTANT]
> The idea I'd steal from this setup: alert on business invariants, not just on servers. "A payment was captured but no booking exists" is the alert that protects your customers and your books. A CPU graph will never show it.

### Safety gets its own budget

When a caregiver presses SOS, the backend opens a live voice conference. The caregiver's microphone goes live, and admins get alerted in the dashboard and join muted to listen. The call ends itself after seven minutes. That cap is deliberate, so a forgotten SOS can't run up a telephony bill.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/sys-crisis.webp" alt="Urgent banner on the live visit screen: caregiver flagged an issue, support team being alerted" />
  </div>
  <figcaption><b>In the app</b> — when a caregiver flags an issue mid-visit, the family's screen says so and shows that support is being alerted.</figcaption>
</figure>

## What I'd tell a team starting out

- **Pick boring tools and sharp rules.** FastAPI, Postgres and ECS are unremarkable. The rules (integer money, one migration head, one eligibility function, one image) are what keep it working.
- **Put the state machine in one place and lock before you move.** A transition table plus a row lock beats status strings scattered across handlers.
- **Never trust a single signal for money.** Idempotent webhooks plus a reconciler that polls means a lost event costs minutes, not a customer.
- **Turn every incident into a check.** The migration tests, the drift check, query timeouts and database-based scaling each exist because something went wrong once.
- **Docs drift, tests don't.** Even our own engineering guide had gone stale on migration and route counts. The rules that matter are the ones CI enforces.

---

*Stack in this post: Python, FastAPI, asyncpg, Postgres (Aurora Serverless v2), Redis, AWS ECS Fargate, Terraform, Flutter with Shorebird, React with Capacitor, Next.js, Sentry, Prometheus, Grafana. Counts are from the backend repository in November 2026.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
