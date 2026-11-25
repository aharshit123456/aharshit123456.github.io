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

Production was first built by hand in the console, with no record of how it was configured. In July 2026 I mirrored it into Terraform without changing anything, then built a separate staging environment beside it ([A Care Marketplace on One Boring Backend](/blog/famcare-system-design) covers that import).

Terraform keeps a **state file**: its record of which real resources it manages and what it last knew about them. Each `plan` compares your code, that state and what AWS reports right now. When they disagree, that's **drift**, and drift is only harmless if every disagreement can be explained. Our rules all exist to keep `plan` honest:

- State lives remotely, in a versioned S3 bucket with a DynamoDB lock, so two people can never apply at once.
- On production, `0 to destroy` is the norm, and any `must be replaced` on a live service or database is a stop sign.
- `apply` exiting 0 is not success. ECS can crash-loop after a clean apply, so you check the running tasks and the health endpoint.
- No one-off console edits, because the next `plan` won't be able to explain them.

That last rule is the one we broke most. Each story below is what happened when we did.

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

Each story is told the way it looked at the time: the first sign of trouble, the terminal, the theory that failed, and the output that finally explained it. Commands are trimmed, identifiers are replaced with placeholders, where the written record kept only a summary of an output, the summary is what you see, and a few command lines are reconstructed around results the postmortems recorded.

## Don't delete what another service owns

**Service discovery** is how one service finds another when their addresses keep changing. On ECS, every deploy replaces tasks, and every new task gets a new private IP. I was adding a private Prometheus and Grafana, and I wanted Prometheus to find the API by name so that deploys wouldn't break scraping.

I chose **ECS Service Connect**, which registers services in AWS Cloud Map and gives them internal names. My first attempt used Cloud Map's HTTP namespace type, which publishes no DNS records, so Prometheus's lookups found nothing. The fix seemed simple: swap it for a private DNS namespace. Terraform disagreed.

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>terraform + aws cli · prod · 01:36</span></div><pre><code><span class="prompt">$</span> terraform apply
<span class="dim">… replacing the HTTP namespace with a private DNS namespace …</span>
<span class="err">Error: … ResourceInUse</span>
<span class="dim">… two Cloud Map services are still registered in the old namespace</span>
<span class="prompt">$</span> aws servicediscovery get-service --id srv-xxxx
<span class="dim">…</span>
    "Description": "Managed by arn:aws:ecs:…",
<span class="dim">…</span>
<span class="prompt">$</span> aws servicediscovery deregister-instance --service-id srv-xxxx --instance-id &lt;instance&gt;
<span class="prompt">$</span> aws servicediscovery delete-service --id srv-xxxx
<span class="dim">… same again for the second service, srv-yyyy …</span></code></pre></div>

The answer was on the screen. The CLI output said ECS managed those services. I deleted both by hand anyway, to unblock Terraform, and the namespace swap went through.

### Every fix is an update, and updates are blocked

Half an hour later, the next update to the API service failed. So did everything I tried to fix it.

<div class="chat"><div class="chat-head"># incident · 2 Aug, 02:07</div><div class="chat-msg"><span class="who me">Me</span><span class="text">Updates to the API service fail and roll back. The running task is fine.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">New task definition with the right namespace: rolled back.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Forced redeploy: rolled back. Turning Service Connect off on the service.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Rolled back. Same error every time. Customers are still being served.</span></div></div>

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli · prod · 02:07–02:39</span></div><pre><code><span class="prompt">$</span> aws ecs update-service --cluster &lt;cluster&gt; --service &lt;service&gt; --force-new-deployment
<span class="dim">…</span>
<span class="prompt">$</span> aws ecs describe-services --cluster &lt;cluster&gt; --services &lt;service&gt; \
    --query 'services[0].events[0].message'
<span class="err">"ECS deployment failed Service deployment rolled back because of invalid
 networking configuration. Cloud Map service does not exist."</span>
<span class="prompt">$</span> aws ecs update-service --cluster &lt;cluster&gt; --service &lt;service&gt; \
    --service-connect-configuration enabled=false
<span class="err">… rolled back, same message</span>
<span class="prompt">$</span> terraform destroy -target=&lt;api ecs service&gt;
<span class="err">… same message: the scale-to-zero step before a delete is itself an update</span>
<span class="dim">… side effect: the service's autoscaling target and policy were destroyed</span></code></pre></div>

As far as we could tell, ECS validates the service against its old Cloud Map reference on every update, including the update that tries to remove that reference. There was no supported way to update the service out of this state.

The targeted destroy added a small mess of its own: it failed on the service but succeeded on the service's autoscaling, leaving the API pinned at one task. A targeted `apply` on just the autoscaling resources put it back.

For about three hours this cost customers nothing. ECS checks a change before applying it, so every failed fix was a safe no-op and the old task kept serving. But nothing could be deployed, and the deploy pipeline failed at the same step.

<figure>
  <div class="diagram">
    <div class="node accent">Deploy pipeline<br>fails at<br>"update service"</div>
    <span class="arrow">→</span>
    <div class="node accent">API service<br>every update<br>rolls back</div>
    <span class="arrow">→</span>
    <div class="node accent">Cloud Map service<br>deleted by hand,<br>still referenced</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">Apps + admin</div>
    <span class="arrow">→</span>
    <div class="node">Load balancer</div>
    <span class="arrow">→</span>
    <div class="node accent">Target group<br>0 healthy targets<br>for ~8 min</div>
    <span class="arrow">→</span>
    <div class="node accent">Old service DRAINING<br>name still taken</div>
  </div>
  <figcaption><b>Fig. 3</b> — the blast radius in two stages. Filled nodes failed. For three hours only the deploy path was broken; after the forced delete, the target group had nothing behind it. The scheduler and the monitoring stack were never affected.</figcaption>
</figure>

### The way out, and the eight minutes it cost

The one call that skipped the stale check was `delete-service --force`. The plan was to delete the stuck service and immediately create an identical one. What I didn't check first was how long a deleted service takes to really go away.

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli · prod · 02:45</span></div><pre><code><span class="prompt">$</span> aws ecs delete-service --cluster &lt;cluster&gt; --service &lt;service&gt; --force
<span class="ok">    "status": "DRAINING",</span>
<span class="prompt">$</span> aws ecs create-service --cluster &lt;cluster&gt; --service-name &lt;service&gt; …
<span class="err">… Create service is not idempotent.</span>
<span class="dim">… retried for several minutes; the old service stays DRAINING …</span>
<span class="prompt">$</span> aws elbv2 describe-target-health --target-group-arn &lt;api-tg&gt;
<span class="err">… no healthy targets</span>
<span class="prompt">$</span> aws ecs create-service --cluster &lt;cluster&gt; --service-name &lt;service&gt;-restore …
<span class="dim">… task healthy in ~30 s …</span>
<span class="prompt">$</span> curl -s -o /dev/null -w '%{http_code}\n' https://&lt;api-host&gt;/health
<span class="ok">200</span></code></pre></div>

<div class="chat"><div class="chat-head"># incident · 2 Aug, 02:45</div><div class="chat-msg"><span class="who me">Me</span><span class="text">Forced delete worked. Service is DRAINING.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Recreating under the same name is refused. The API has zero running tasks.</span></div><div class="chat-msg"><span class="who bot">Monitor</span><span class="text">(nothing: no alarm watched for an empty target group)</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Replacement up under a temporary name. Health check returns 200.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text"><span class="tag ok">RESOLVED</span>Old name freed. Real service recreated, temporary one deleted.</span></div></div>

<div class="big-stat"><div class="big-stat-label">deploys blocked, customers unaffected</div><div class="big-stat-num">~3 h</div><div class="big-stat-sub">every failed fix was rejected before it touched the running task</div></div>

<div class="big-stat"><div class="big-stat-label">API with no running task</div><div class="big-stat-num bad">~8 min</div><div class="big-stat-sub">caused by the recovery, not by the original mistake</div></div>

Once the original service reached `INACTIVE`, I created the real one under its proper name, let it run beside the temporary service behind the same target group, then deleted the temporary one. Terraform picked it up without any state surgery, because an ECS service's ARN is determined by its cluster and name, and the next `apply` cleanly re-attached autoscaling and Service Connect.

Nobody was paged during those eight minutes. The outage was found only because I was watching `describe-services` and curling the health endpoint after every step. The same day, an alarm on the API's target group went in. Note the last line, which makes silence count as failure:

```hcl
metric_name         = "HealthyHostCount"
statistic           = "Minimum"
period              = 60
evaluation_periods  = 2
threshold           = 1
comparison_operator = "LessThanThreshold"
treat_missing_data  = "breaching"
```

The **trigger** was deleting two resources by hand. The **root cause** was deleting a resource without checking what still referenced it, and doing it outside the service that owned it. Those are different things to fix: the first is one command, the second is a habit.

> **Runbook change:** before deleting anything another AWS service created, check who owns it and release it through that owner. Before a forced delete, assume the name stays taken for minutes, and recreate under a temporary name.

### Service Connect isn't DNS

The private DNS namespace didn't fix Prometheus either. From inside the monitoring task:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>monitoring task + aws cli · prod</span></div><pre><code><span class="prompt">$</span> nslookup &lt;api-name&gt;.&lt;namespace&gt;
<span class="err">… NXDOMAIN</span>
<span class="prompt">$</span> aws route53 list-resource-record-sets --hosted-zone-id &lt;zone&gt; \
    --query 'ResourceRecordSets[].Type'
[ "NS", "SOA" ]
<span class="dim">… no address records at all</span></code></pre></div>

Service Connect doesn't publish ordinary DNS. It works through a proxy sidecar on participating containers, so a general tool like Prometheus can't use it. The migration I broke production for could never have worked.

What works now is a Lambda that finds the API's task IPs every minute and writes them into Prometheus's config in SSM. The first version then called Prometheus's reload endpoint directly, and it looked like success:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>monitoring task · prod</span></div><pre><code><span class="prompt">$</span> curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:9090/-/reload
<span class="ok">200</span>
<span class="dim">… active targets: still the old task IP</span></code></pre></div>

Reload only re-reads the file on disk, and nothing had changed the file. A small sidecar now polls SSM every 30 seconds, rewrites the file and reloads Prometheus locally. The acceptance test was to force two API task replacements and watch Prometheus follow on its own. A 200 from an endpoint is not proof that anything changed.

## The pool that kept filling up

This is the incident from the opening. It's worth explaining one concept first.

A **connection pool** keeps a few open database connections and lends them to requests. A request acquires one, runs its queries and gives it back. If connections aren't given back, or are borrowed for too long, new requests wait in a queue for a free one. Postgres has a related state called **idle in transaction**: a session has opened a transaction and is holding it, but isn't running a query. Postgres can't tell that apart from a slow client, so by default it waits.

Our API's pool had **a maximum of 5 connections**, shared by all three apps.

### Everything is green except logins

<div class="chat"><div class="chat-head"># incident · 6 Aug, ~11:10</div><div class="chat-msg"><span class="who me">Me</span><span class="text">Reports that the APIs may be down. Login and OTP requests just spin.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Every dashboard says healthy. Checking each layer.</span></div></div>

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli + curl · prod</span></div><pre><code><span class="prompt">$</span> curl -s -o /dev/null -w '%{http_code}\n' https://&lt;api-host&gt;/health
<span class="ok">200</span>
<span class="prompt">$</span> aws elbv2 describe-target-health --target-group-arn &lt;api-tg&gt; \
    --query 'TargetHealthDescriptions[].TargetHealth.State'
<span class="ok">[ "healthy" ]</span>
<span class="prompt">$</span> aws rds describe-db-clusters --db-cluster-identifier &lt;db&gt; --query 'DBClusters[0].Status'
<span class="ok">"available"</span>
<span class="dim">… low CPU, no events, firewall showing no blocks on real traffic …</span>
<span class="prompt">$</span> curl -s https://&lt;api-host&gt;/health/deep
<span class="err">{"status":"unhealthy","db":"unreachable"}</span>     <span class="dim"># HTTP 503</span>
<span class="prompt">$</span> curl -s -X POST https://&lt;api-host&gt;/&lt;otp-send&gt; …
<span class="dim">… hangs until the client gives up</span></code></pre></div>

The shallow health check never touches the database, and neither does the load balancer's. The deep one does a bounded `SELECT 1` through the pool, with a three-second limit on getting a connection, and it couldn't get one. Meanwhile the database's own connection count sat flat.

<div class="big-stat"><div class="big-stat-label">database connections, in every occurrence</div><div class="big-stat-num bad">6</div><div class="big-stat-sub">flat, not climbing: one task, a pool of 5, nothing free to lend</div></div>

The first theory was that something kept restarting the service. The audit log showed a run of forced redeployments:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli · prod</span></div><pre><code><span class="prompt">$</span> aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=UpdateService
<span class="dim">… several force-new-deployment calls in the window …</span>
<span class="dim">… each from a separate CI run, different source IPs: ordinary deploys</span>
<span class="warn">ruled out</span>
<span class="prompt">$</span> aws ecs update-service --cluster &lt;cluster&gt; --service &lt;service&gt; --force-new-deployment
<span class="dim">… new task running …</span>
<span class="prompt">$</span> curl -s -o /dev/null -w '%{http_code}\n' https://&lt;api-host&gt;/health/deep
<span class="ok">200</span></code></pre></div>

A fresh task meant a fresh pool, and that ended the impact. It explained nothing, though.

<figure>
  <div class="diagram">
    <div class="node muted-node">Customer app<br>caregiver app<br>admin panel</div>
    <span class="arrow">→</span>
    <div class="node">Load balancer<br>target healthy</div>
    <span class="arrow">→</span>
    <div class="node">API task<br>shallow /health 200</div>
    <span class="arrow">→</span>
    <div class="node accent">Pool of 5<br>no free connection</div>
    <span class="arrow">→</span>
    <div class="node">Aurora<br>available, low CPU</div>
  </div>
  <div class="diagram">
    <div class="node accent">Autoscaling<br>watches CPU,<br>which stayed idle</div>
    <span class="arrow">→</span>
    <div class="node muted-node">stays at 1 task</div>
  </div>
  <figcaption><b>Fig. 4</b> — where the pool incident lived. Filled nodes failed. Everything the standard health checks looked at stayed green; the only broken part sat between the API and the database, and the scaler was watching the wrong signal.</figcaption>
</figure>

### Timeouts at every layer

After the redeploy, we looked for what could hold a connection forever, and found nothing bounding it at either layer. The app's transaction wrapper had no timeout. The database had no `statement_timeout`, and its idle-in-transaction timeout was Aurora's default of 24 hours. We added both:

```hcl
# Database-level backstop, set above the app's own 15-second timeout
# so the app's timeout fires first and this is the last resort.
statement_timeout_ms                   = 20000  # 20s
idle_in_transaction_session_timeout_ms = 300000 # 5min
```

We also put an alarm on repeated deep-health 503s. About four hours later, an alarm fired:

<div class="chat"><div class="chat-head"># incident · 6 Aug, ~16:53</div><div class="chat-msg"><span class="who bot">Monitor</span><span class="text"><span class="tag">ALARM</span>Load balancer 5xx count 60 in one period, threshold 5</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Deep health is 503 again. Connections flat at 6. Same signature.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Checking whether this morning's fixes are actually on the stuck task.</span></div></div>

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli · prod</span></div><pre><code><span class="prompt">$</span> aws rds describe-db-cluster-parameters --db-cluster-parameter-group-name &lt;params&gt; \
    --query "Parameters[?ParameterName=='statement_timeout' || ParameterName=='idle_in_transaction_session_timeout'].[ParameterName,ParameterValue]"
statement_timeout                     20000
idle_in_transaction_session_timeout   300000
<span class="prompt">$</span> aws ecs describe-task-definition --task-definition &lt;service&gt; --query '…image'
<span class="dim">… the running image already has the transaction timeout</span>
<span class="warn">both fixes live; pool stuck anyway</span></code></pre></div>

Both fixes were real, and neither covered the path that was actually holding connections. The wrapper wasn't the only way into the pool:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>backend repo</span></div><pre><code><span class="prompt">$</span> grep -rnE 'db\.pool\.(fetch|fetchval|fetchrow|execute)\(' --include='*.py' . | wc -l
     231
<span class="dim">… none of them passes timeout=, and asyncpg's default is no limit</span></code></pre></div>

<div class="big-stat"><div class="big-stat-label">direct pool calls that bypassed the wrapper</div><div class="big-stat-num bad">231</div><div class="big-stat-sub">each one free to hold a connection for as long as it liked</div></div>

And `statement_timeout` doesn't help when a connection is held while Python waits on something else, because there's no running statement to kill. A database timeout is a backstop, not a substitute for one in the app.

I patched those four methods once, at pool creation, so every call defaulted to 15 seconds. It passed every unit test, then staging refused to start:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>container logs · staging</span></div><pre><code><span class="prompt">$</span> aws logs tail /ecs/&lt;service&gt; --since 15m
<span class="err">AttributeError: 'Pool' object attribute 'fetch' is read-only</span>
<span class="err">RuntimeError: Failed to connect to PostgreSQL ...</span>
<span class="err">Application startup failed. Exiting.</span>
<span class="prompt">$</span> aws ecs describe-tasks --cluster &lt;staging-cluster&gt; --tasks &lt;task-a&gt; &lt;task-b&gt; \
    --query 'tasks[].containers[0].exitCode'
[ 3, 3 ]</code></pre></div>

The real `asyncpg.Pool` uses `__slots__`, so you can't assign methods onto an instance, and the tests had mocked the pool with plain objects that allowed it. Production never ran the broken image: its new task failed to become healthy, so ECS kept the old one serving. A thin proxy class fixed it, and the tests now use a fake pool that enforces `__slots__`, so this kind of bug fails in CI.

### The evidence that had been there all along

Timeouts bound the damage of a stuck call. They don't say what was slow. The load balancer had been writing access logs to S3 the whole time, and nobody had opened them.

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>alb access logs · recurrence window</span></div><pre><code><span class="prompt">$</span> aws s3 cp s3://&lt;alb-log-bucket&gt;/&lt;prefix&gt;/ ./alb-logs --recursive
<span class="prompt">$</span> zcat alb-logs/*.gz | awk '{print $7, $13, $14}' | sort -rn | head
14.469 GET &lt;availability endpoint&gt;
10.205 GET &lt;availability endpoint&gt;
<span class="dim">… several more at 3–5 s, same endpoint, all in the ten minutes before the 503s</span>
<span class="dim">… an unpaginated admin list at 3.8–5.3 s (secondary)</span></code></pre></div>

<div class="big-stat"><div class="big-stat-label">one availability request, just before the pool stuck</div><div class="big-stat-num bad">14.5 s</div><div class="big-stat-sub">from a data source that needed no new infrastructure, only someone to read it</div></div>

Inside a loop over services and time slots, that endpoint borrowed a fresh pool connection on every iteration. That's dozens of acquire-and-release cycles per request through a five-connection pool. It now uses one connection per service, and that connection is deliberately not held across an external HTTP call. Holding a pool connection during network I/O was exactly the bug behind an earlier deadlock.

Later, a teammate found that our timeout guarded the wrong half. asyncpg's convenience methods pass the timeout to the query, but call `acquire()` without one, so under saturation requests still queued forever. They bounded `acquire()` too, which turns pool exhaustion into fast, visible errors instead of silent hangs.

### Scale on the signal that's actually saturated

Three days later, with every fix live, the symptom came back.

<div class="chat"><div class="chat-head"># incident · 9 Aug, ~10:23</div><div class="chat-msg"><span class="who me">Me</span><span class="text">Same signature since about 08:00: connections pinned at 6, CPU spiking. Every fix is live.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Deep health is back to 200 on its own. Nothing to restart this time.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">Different question: why didn't autoscaling add a task?</span></div></div>

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli · prod</span></div><pre><code><span class="prompt">$</span> aws ecs describe-services --cluster &lt;cluster&gt; --services &lt;service&gt; \
    --query 'services[0].[desiredCount,runningCount]'
[ 1, 1 ]
<span class="prompt">$</span> aws application-autoscaling describe-scaling-policies --service-namespace ecs …
<span class="dim">… one policy: target tracking on task CPU at 60%, min 1, max 10</span>
<span class="prompt">$</span> aws application-autoscaling describe-scaling-activities --service-namespace ecs …
<span class="warn">… last scale-out: the evening of the first outage, three days earlier</span></code></pre></div>

It tracked CPU, and an API that's waiting on its database has idle CPU. The bottleneck was connections, and nothing was scaling on connections.

We added a second scale-out trigger on the database's own connection count, and raised the API's minimum from one task to two. A teammate had separately found the case for the second change: with one task, every deploy left a moment with no healthy target.

<div class="big-stat"><div class="big-stat-label">requests failed in a single second during one rollout</div><div class="big-stat-num bad">84</div><div class="big-stat-sub">all 502s with no target: one task, being replaced</div></div>

We also raised the database's capacity ceiling. Aurora Serverless v2 bills for capacity actually used, so a higher ceiling costs nothing until it's needed. It also had to come before a bigger pool, because more connections against a capped database makes things worse, not better. Then the pool went from 5 to 25.

The other change was evidence. Query-level telemetry had been on the list since the first outage and was still off:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli · prod</span></div><pre><code><span class="prompt">$</span> aws rds modify-db-instance --db-instance-identifier &lt;instance&gt; \
    --enable-performance-insights --performance-insights-retention-period 7 --apply-immediately
<span class="prompt">$</span> aws rds describe-db-instances --db-instance-identifier &lt;instance&gt; \
    --query 'DBInstances[0].[PerformanceInsightsEnabled,DBInstanceStatus]'
<span class="ok">[ true, "available" ]</span>
<span class="dim">… later that day, top SQL: ordinary reads; top waits: CPU, Client:ClientRead</span>
<span class="warn">… nothing from the incident window: it can't record the past</span></code></pre></div>

### Three fixes for one symptom means the constraint is wrong

Each fix was real and verified. But the first postmortem had already listed the two things that mattered: raise or measure the pool size, and turn on query-level evidence. Both stayed open while we hunted for more bad call sites, so we investigated three times with worse evidence than was available almost for free.

> [!NOTE]
> The root cause in the rewritten postmortem isn't a line of code. Each recurrence was treated as a new bug to find, instead of as evidence that the constraint itself (a 5-connection pool with almost no margin) was wrong.

> **Runbook change:** before investigating a recurrence, read the last postmortem's open items. If the same signature survives three fixes, stop patching call sites and question the limit.

## The memory upgrade that never shipped

During the pool work, a `plan` nearly bit us:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>terraform · prod · 9 Aug</span></div><pre><code><span class="prompt">$</span> terraform plan
<span class="dim">…</span>
<span class="warn">  ~ task_definition = "&lt;api&gt;:480" -&gt; "&lt;api&gt;:472"</span>
<span class="warn">  ~ task_definition = "&lt;scheduler&gt;:449" -&gt; "&lt;scheduler&gt;:441"</span>
<span class="dim">… plan discarded, nothing applied …</span>
<span class="prompt">$</span> terraform plan     <span class="dim"># after ignore_changes = [desired_count, task_definition]</span>
<span class="ok">Plan: 2 to add, 1 to change, 0 to destroy.</span></code></pre></div>

It wanted to roll the API back to a **task definition** (ECS's versioned spec of image, environment and resources) eight revisions old, as a side effect of an unrelated scaling change. Our CI registers a new revision on every deploy, so Terraform's memory of it was stale. We told Terraform to ignore the task definition on the service, and the rollback was avoided.

Two months later, that fix came back to bite.

<div class="chat"><div class="chat-head"># incident · 2 Oct</div><div class="chat-msg"><span class="who me">Me</span><span class="text">Admin panel and apps getting 502s and 504s.</span></div><div class="chat-msg"><span class="who me">Me</span><span class="text">API tasks keep getting replaced. Containers exit with 137.</span></div></div>

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>aws cli + curl · prod</span></div><pre><code><span class="prompt">$</span> aws ecs describe-tasks --cluster &lt;cluster&gt; --tasks &lt;stopped-task&gt; \
    --query 'tasks[0].containers[0].exitCode'
<span class="err">137</span>     <span class="dim"># killed for exceeding its memory limit</span>
<span class="prompt">$</span> curl -s -o /dev/null -w '%{size_download} bytes in %{time_total}s\n' \
    https://&lt;api-host&gt;/&lt;daily-reports-list&gt;
<span class="dim">… ≈27 MB, 9–15 s per call</span></code></pre></div>

The trigger was a reporting feature: each day's stored report embedded the previous day's report, which embedded the day before that. The list endpoint had grown to return 27 MB, and regenerating reports loaded a year of them into Python at once. Slimming the payloads in SQL fixed the response.

<div class="big-stat"><div class="big-stat-label">daily-reports list response</div><div class="big-stat-num">27 MB → ~0.5 MB</div><div class="big-stat-sub">nested history stripped in SQL, month and year totals aggregated in the database</div></div>

That explained the spike, not the ceiling. The container should have had far more room, because a month earlier I had doubled the API's CPU and memory in Terraform:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>terraform repo vs aws · prod</span></div><pre><code><span class="prompt">$</span> grep -nE '^\s*(cpu|memory)\s*=' environments/prod/main.tf
<span class="dim">… API service:</span>
  cpu    = 1024
  memory = 2048
<span class="prompt">$</span> aws ecs describe-task-definition --task-definition &lt;api&gt; \
    --query 'taskDefinition.[cpu, containerDefinitions[0].memory]'
<span class="err">[ "512", 600 ]</span></code></pre></div>

<div class="big-stat"><div class="big-stat-label">API memory: what ran vs what the code said</div><div class="big-stat-num bad">600 MB vs 2,048 MB</div><div class="big-stat-sub">the upgrade sat in Terraform for a month and never reached production</div></div>

The service ignored task definition changes (our fix from August), and CI built each deploy by cloning the *running* task definition. Our fix for one kind of drift had quietly created another.

<figure>
  <div class="diagram">
    <div class="node muted-node">Terraform<br>1 vCPU / 2 GB<br>ignored by the service</div>
    <span class="arrow">→</span>
    <div class="node accent">CI deploy<br>clones the running<br>task definition</div>
    <span class="arrow">→</span>
    <div class="node accent">API task<br>0.5 vCPU / 600 MB<br>killed, exit 137</div>
    <span class="arrow">→</span>
    <div class="node accent">Load balancer<br>502 / 504</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Admin + apps</div>
  </div>
  <figcaption><b>Fig. 5</b> — how a size change got lost. Filled nodes failed: CI copied the small live size forward on every deploy, the container ran out of memory, and the load balancer turned each kill into 502s and 504s. Terraform's larger size never entered the chain.</figcaption>
</figure>

The lasting fix was to make ownership explicit instead of implicit:

| Terraform owns | CI owns |
|---|---|
| Network, load balancer, services, scaling, alarms, permissions | Image, environment, secrets, CPU and memory |
| The first revision of each task definition | Every revision after that |

A module option now makes Terraform create a task definition once and never touch its containers, CPU or memory again, and the deploy pipeline sets the size it deploys. Moving to two server processes per task also meant in-memory event fan-out stopped reaching browsers connected to the other process, so those events now go through Redis pub/sub.

The incident left three alarms on one topic, each for a different question. An EventBridge rule on any container stopped for running out of memory tells us the cause. Memory at 85% is the early warning. And the load balancer's *own* 5xx count, as opposed to the app's, shows when customers are affected.

> **Runbook change:** before trusting a size in Terraform, compare it with the task definition that is actually running.

## Guardrails can misfire too

The connection-based scaling trigger first fired at 5 connections, a number taken from a snapshot during the incident. In normal running, the API, the scheduler and an internal agent service together held more than that. So the alarm fired constantly, fought the CPU policy, and pinned the API at its maximum of 10 tasks while CPU sat around 4 or 5 percent. We raised it, and raised it again with a wider window as traffic grew. The second raise was made in the console, against our own rule. When it was brought back into Terraform, the only record of why was the alarm's own description, so that reasoning now sits in a comment next to the value.

Size a guardrail against the steady-state baseline, not the worst minute of the incident, and write the reason down where the next person changing it will see it.

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
