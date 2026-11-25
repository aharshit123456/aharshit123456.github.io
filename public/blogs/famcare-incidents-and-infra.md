# Three Outages and the Infrastructure They Left Behind

*By Harshit Agarwal*

Our API stopped answering, and every health check said it was fine. The load balancer saw a healthy target, the database looked healthy, and yet nobody could log in. That was the second of three incidents in our first few months of running production from code instead of the AWS console. This post tells all three: the symptom, the wrong theories, the real cause, and the guardrail each one left behind, plus the postmortem format that grew out of them.

FamCare is an in-home care marketplace in India: families book trained caregivers for babies and elders by the hour from an app. Behind the customer app, the caregiver app and an admin panel sits one Python API on AWS ECS Fargate, a scheduler service, an Aurora Serverless v2 Postgres database and a single load balancer.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~8 min</div><div class="stat-label">of outage caused by the recovery, not the original mistake</div></div>
  <div class="stat"><div class="stat-num">3</div><div class="stat-label">times the same symptom appeared in four days</div></div>
  <div class="stat"><div class="stat-num">5 → 25</div><div class="stat-label">connections in the API's database pool, before and after</div></div>
</div>

## From console clicks to a plan you can trust

Production was first built by hand in the console, with no record of how it was configured. In July 2026 I mirrored it into Terraform without changing anything, then built a separate staging environment beside it; [A Care Marketplace on One Boring Backend](/blog/famcare-system-design) covers that import. Here, what matters is the idea underneath it.

Terraform keeps a **state file**: its record of which real resources it manages and what it last knew about them. Each `plan` compares three things: your code, that state, and what AWS reports right now. When they disagree, that's **drift**. Drift is only harmless if every disagreement can be explained. So the rules we adopted are all about keeping `plan` honest:

- State lives remotely, in a versioned S3 bucket with a DynamoDB lock, so two people can never apply at once.
- On production, `0 to destroy` is the norm, and any `must be replaced` on a live service or database is a stop sign.
- `apply` exiting 0 is not success. ECS can crash-loop after a clean apply, so you check the running tasks and the health endpoint.
- No one-off console edits, because the next `plan` won't be able to explain them.

That last rule is the one we broke most. Most of the stories below are about what happened when we did.

<figure>
  <div class="diagram">
    <div class="node muted-node">Apps + admin</div>
    <span class="arrow">→</span>
    <div class="node">Load balancer<br>path rules split<br>prod and staging</div>
    <span class="arrow">→</span>
    <div class="node accent">ECS cluster<br>API (min 2 tasks), scheduler,<br>monitor, Prometheus + Grafana</div>
    <span class="arrow">→</span>
    <div class="node">Aurora Serverless v2<br>timeouts in the<br>parameter group</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">CI<br>builds images, registers<br>task definitions</div>
    <span class="arrow">→</span>
    <div class="node">Terraform<br>network, services,<br>scaling, alarms</div>
    <span class="arrow">→</span>
    <div class="node">CloudWatch alarms<br>+ EventBridge rules</div>
    <span class="arrow">→</span>
    <div class="node muted-node">One alerts topic</div>
  </div>
  <figcaption><b>Fig. 1</b> — the setup today. CI owns what runs inside each container; Terraform owns everything around it. Staging has its own cluster and private database and shares only the network and load balancer.</figcaption>
</figure>

<figure>
  <div class="diagram">
    <div class="node muted-node">July<br>console → Terraform</div>
    <span class="arrow">→</span>
    <div class="node accent">1–2 Aug<br>a service ECS<br>wouldn't update</div>
    <span class="arrow">→</span>
    <div class="node accent">6–9 Aug<br>connection pool<br>stuck three times</div>
    <span class="arrow">→</span>
    <div class="node">late Aug<br>self-healing scrape<br>targets, cost fixes</div>
    <span class="arrow">→</span>
    <div class="node accent">2 Oct<br>OOM kills from a<br>size that never shipped</div>
  </div>
  <figcaption><b>Fig. 2</b> — the incidents (filled) and the work between them, 2026.</figcaption>
</figure>

## Don't delete what another service owns

**Service discovery** is how one service finds another when their addresses keep changing. On ECS, every deploy replaces tasks, and every new task gets a new private IP. I was adding a private Prometheus and Grafana, and I wanted Prometheus to find the API by name so that deploys wouldn't break scraping.

I chose **ECS Service Connect**, which registers services in AWS Cloud Map and gives them internal names. My first attempt used Cloud Map's HTTP namespace type, which publishes no DNS records. Prometheus's DNS lookups found nothing. The fix seemed simple: swap it for a private DNS namespace. Terraform's destroy of the old namespace failed with `ResourceInUse`, because two Cloud Map services were still registered in it.

So I deleted those two services by hand with the AWS CLI, to unblock Terraform. The CLI output even said they were managed by ECS.

From then on, every update to the API service failed and rolled itself back:

```
Service deployment rolled back because of invalid networking configuration.
Cloud Map service does not exist.
```

A new task definition, a forced redeploy, turning Service Connect off: all rejected. Even destroying the service failed, because ECS scales a service to zero before deleting it, and that step is itself an update. As far as we could tell, ECS checks the old Cloud Map reference on every update, including the update that tries to remove it.

For about three hours this cost customers nothing. ECS validates a change before applying it, so every failed fix was a safe no-op and the running task kept serving. But nothing could be deployed.

The way out was `delete-service --force`, which skips that check. What I didn't plan for was the deleted service sitting in `DRAINING` for several minutes, while ECS refused to create a new service with the same name. **For about eight minutes the API had no running task.** I ended it by creating the replacement under a temporary name, which was healthy in about 30 seconds, then swapped the real name back in once the old service was fully gone. Terraform picked it up without any state surgery, because an ECS service's ARN is determined by its cluster and name.

The **trigger** was deleting two resources by hand. The **root cause** was deleting a resource without checking what still referenced it, and doing it outside the service that owned it. Those are different things to fix: the first is one command, the second is a habit.

### Service Connect isn't DNS

The private DNS namespace didn't fix Prometheus either. From inside the monitoring task the API's name returned `NXDOMAIN`, and the hosted zone held no address records at all. Service Connect doesn't publish ordinary DNS. It works through a proxy sidecar on participating containers, so a general tool like Prometheus can't use it. The migration I broke production for could never have worked.

What works now is a Lambda that finds the API's task IPs every minute and writes them into Prometheus's config in SSM, plus a small sidecar that polls SSM every 30 seconds, rewrites the file and reloads Prometheus. The first version had the Lambda call Prometheus's reload endpoint directly. Reload returned 200, and Prometheus kept scraping the old IP, because reload only re-reads the file on disk.

The acceptance test was to force two API task replacements and watch Prometheus follow on its own. A 200 from an endpoint is not proof that anything changed.

## The pool that kept filling up

This is the incident from the opening. It's worth explaining one concept first.

A **connection pool** keeps a few open database connections and lends them to requests. A request acquires one, runs its queries and gives it back. If connections aren't given back, or are borrowed for too long, new requests wait in a queue for a free one. Postgres has a related state called **idle in transaction**: a session has opened a transaction and is holding it, but isn't running a query. Postgres can't tell that apart from a slow client, so by default it waits.

Our API's pool had **a maximum of 5 connections**, shared by all three apps. The symptom, every time: the shallow health check passed, the load balancer target was healthy, the database looked healthy, the firewall was clean. But anything needing the database (OTP, login, admin queries) hung until the client gave up. A deep health check that runs a bounded `SELECT 1` through the pool returned 503, and the database's connection count sat flat at 6.

### Timeouts at every layer

The first time, a forced redeploy gave the API a fresh pool and ended the impact. Then we looked for what could hold a connection forever, and found nothing bounding it at either layer. The app's transaction wrapper had no timeout. The database had no `statement_timeout`, and its idle-in-transaction timeout was Aurora's default of 24 hours. We added both:

```hcl
# Database-level backstop, set above the app's own 15-second timeout
# so the app's timeout fires first and this is the last resort.
statement_timeout_ms                   = 20000  # 20s
idle_in_transaction_session_timeout_ms = 300000 # 5min
```

We also put an alarm on repeated deep-health 503s. Four hours later, our alarms fired again. Both fixes were live, and the pool was stuck again.

The wrapper wasn't the only path to the pool. **231 call sites** called the pool's `fetch`, `fetchval`, `fetchrow` or `execute` directly, and none passed a timeout. And `statement_timeout` doesn't help when the problem is a connection held while Python waits on something else, because there's no running statement to kill. A database timeout is a backstop, not a substitute for one in the app.

I patched those four methods once, at pool creation, so every call defaulted to 15 seconds. It passed every unit test and crash-looped in staging: the real `asyncpg.Pool` uses `__slots__`, so you can't assign methods onto an instance, and the tests had mocked the pool with plain objects that allowed it. A thin proxy class fixed it, and the tests now use a fake pool that enforces `__slots__`, so this kind of bug fails in CI.

Then I opened a data source that had been there all along: the load balancer's access logs. They showed one availability endpoint taking up to 14.5 seconds just before both incidents. Inside a loop over services and time slots, it borrowed a fresh pool connection on every iteration. That's dozens of acquire-and-release cycles per request through a five-connection pool. It now uses one connection per service, and that connection is deliberately not held across an external HTTP call. Holding a pool connection during network I/O was exactly the bug behind an earlier deadlock.

Later, a teammate found that our timeout guarded the wrong half. asyncpg's convenience methods pass the timeout to the query, but call `acquire()` without one, so under saturation requests still queued forever. They bounded `acquire()` too, which turns pool exhaustion into fast, visible errors instead of silent hangs.

### Scale on the signal that's actually saturated

The third time, every fix was live and the symptom came back anyway. So we asked a different question: why didn't autoscaling help? Because it tracked CPU, and an API that's waiting on its database has idle CPU. The bottleneck was connections, and nothing was scaling on connections.

We added a second scale-out trigger on the database's own connection count, and raised the API's minimum from one task to two. A teammate had separately found the case for the second change: with one task, every deploy left a moment with no healthy target, and during one rollout 84 requests failed in a single second. We also raised the database's capacity ceiling. Aurora Serverless v2 bills for capacity actually used, so a higher ceiling costs nothing until it's needed. It also had to come before a bigger pool, because more connections against a capped database makes things worse, not better. Then the pool went from 5 to 25.

### Three fixes for one symptom means the constraint is wrong

Each fix was real and verified. But the first postmortem had already listed the two things that mattered: raise or measure the pool size, and turn on Performance Insights for query-level evidence. Both stayed open while we hunted for more bad call sites, so we investigated three times with worse evidence than was available almost for free.

> [!NOTE]
> The root cause in the rewritten postmortem isn't a line of code. Each recurrence was treated as a new bug to find, instead of as evidence that the constraint itself (a 5-connection pool with almost no margin) was wrong.

## The memory upgrade that never shipped

During the pool work, a `plan` nearly bit us. It wanted to roll the API back to a task definition eight revisions old. Our CI registers a new **task definition** (ECS's versioned spec of image, environment and resources) on every deploy, so Terraform's memory of it was stale. We told Terraform to ignore the task definition on the service. The rollback was avoided.

Two months later the admin panel and apps started getting 502s and 504s. The API containers were being killed for running out of memory, and ECS kept replacing them. The trigger was a reporting feature: each day's stored report embedded the previous day's report, which embedded the day before that. The list endpoint had grown to return 27 MB, and regenerating reports loaded a year of them into Python at once. Slimming the payloads in SQL took that response to about 0.5 MB.

The real question was why the container had only 600 MB. A month earlier, I had doubled the API's CPU and memory in Terraform. That change never reached production. The service ignored task definition changes (our fix from August), and CI built each deploy by cloning the *running* task definition. The bigger size sat in code for a month while production ran the old one. Our fix for one kind of drift had quietly created another.

The lasting fix was to make ownership explicit instead of implicit:

| Terraform owns | CI owns |
|---|---|
| Network, load balancer, services, scaling, alarms, permissions | Image, environment, secrets, CPU and memory |
| The first revision of each task definition | Every revision after that |

A module option now makes Terraform create a task definition once and never touch its containers, CPU or memory again, and the deploy pipeline sets the size it deploys. Moving to two server processes per task also meant in-memory event fan-out stopped reaching browsers connected to the other process, so those events now go through Redis pub/sub.

The incident left three alarms on one topic, each for a different question. An EventBridge rule on any container stopped for running out of memory tells us the cause. Memory at 85% is the early warning. And the load balancer's *own* 5xx count, as opposed to the app's, shows when customers are affected.

## Guardrails can misfire too

The connection-based scaling trigger first fired at 5 connections, a number taken from a snapshot during the incident. In normal running, the API, the scheduler and an internal agent service together held more than that. So the alarm fired constantly, fought the CPU policy, and pinned the API at its maximum of 10 tasks while CPU sat around 4 or 5 percent. We raised it, and raised it again with a wider window as traffic grew. The second raise was made in the console, against our own rule. When it was brought back into Terraform, the only record of why was the alarm's own description, so that reasoning now sits in a comment next to the value.

Size a guardrail against the steady-state baseline, not the worst minute of the incident. Write the reason down where the next person changing it will see it.

Reconciling with reality pays in money too. AWS Config was recording every resource change with nothing reading the data, so we switched the recorder off. VPC flow logs showed S3 was the heaviest traffic through our NAT gateway, and a free S3 gateway endpoint took it off the per-gigabyte NAT charge.

## Writing it down: trigger, root cause and luck

After the first incident, I wrote down how our postmortems should be structured. It starts from Google SRE's skeleton, with a stricter root-cause section:

- **Impact, with phases kept apart.** Three stuck hours with no customer impact are not eight minutes of outage.
- **Root cause by five whys**, ending in something you can fix. "A mistake was made" doesn't count.
- **Contributing factors** under technology, process and people, written as process gaps, never as blame.
- **Trigger, separate from root cause.** The trigger started it; the root cause is why it could do damage.
- **Resolution, including what didn't work**, because that's what the next responder searches for.
- **Detection.** If a person noticed before an alarm did, that is a finding.
- **Where we got lucky.** The section people skip, and usually where the next incident shows up first.
- **A timeline captured during the incident**, with exact commands and error text.

The pool incident added two rules. When a recurrence proves the conclusion wrong, rewrite the document rather than appending another addendum. And before investigating a recurrence, read the last postmortem's open items. In our case they already held the answer.

Two teammates built the same thinking into a read-only booking investigator for our operations team. It answers "why did no caregiver come?" in three layers (symptom, direct cause in the records, root cause), and every fact it states must come from a tool result.

One debugging habit came out of all this too. While rolling out the monitoring stack, the real errors were only in each failing container's own log stream: an image that didn't exist, a missing log group, and images whose built-in entrypoint swallowed the command we passed. The stop reason and exit code never showed them. Now we read the failing container's logs on the first failure, before proposing the next fix.

## What I'd keep from all this

- **Separate the trigger from the root cause.** "I deleted two resources" is the trigger; "we delete things without checking what references them" is the root cause, and only fixing that prevents the next one.
- **Put timeouts at every layer, and make the app's fire first.** Bound the query, bound the wait for a connection, and keep a database-side backstop for whatever slips past both.
- **Autoscale on the resource that actually saturates.** An I/O-bound service looks idle on CPU while it falls over. Know your bottleneck and scale on it.
- **Decide who owns each attribute.** When CI and infrastructure-as-code both touch the same resource, write down which one owns what, or one of them will silently undo the other.
- **When one symptom survives several real fixes, question the constraint.** The next call-site patch is rarely the answer.
- **Every incident should leave a guardrail, sized against normal traffic.** An alarm tuned to the worst minute of an outage becomes the next outage.

---

*Stack in this post: Terraform, AWS ECS Fargate, Application Load Balancer, Aurora Serverless v2 (Postgres), CloudWatch, EventBridge, SNS, Lambda, SSM Parameter Store, Cloud Map, Prometheus, Grafana, Python, FastAPI, asyncpg. Figures come from the infrastructure repository, its written postmortems and the backend's history, July to November 2026.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
