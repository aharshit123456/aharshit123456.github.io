# The Day I Moved a Cluster to Another Continent

*By Harshit Agarwal*

A visual search engine is not one program. It is a crowd of them: models that sit on GPUs waiting for a photo, a web of scrapers that wake up on a schedule, queues that hand work between them, and a database that has to agree with itself while all of this runs. Someone has to keep that crowd alive, reproducible, and cheap enough that a startup can afford it. For a stretch of my time as a founding engineer intern at shoppin', that someone was me.

This post is about the unglamorous half of a machine-learning product: the infrastructure. How the cloud setup was described as code, what happened the day we moved the whole thing from one continent to another, and how a tangle of scheduled jobs and a crash-prone control panel slowly turned into something I trusted. shoppin' was a fashion visual search app. You snapped a photo of an outfit and it found the same or similar items across many online stores, with prices. None of that works without a backend that stays up.

<div class="stat-row">
  <div class="stat"><div class="stat-num">2</div><div class="stat-label">continents, one cluster</div></div>
  <div class="stat"><div class="stat-num">1 day</div><div class="stat-label">to lift it across, not a quarter</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">resources rebuilt by hand</div></div>
  <div class="stat"><div class="stat-num">∞→0</div><div class="stat-label">idle cost between scheduled runs</div></div>
</div>

## Why describe infrastructure as code at all

When you build a cloud environment by clicking around a console, two bad things happen. First, nobody can tell you exactly what exists. The truth lives in a hundred web pages and one person's memory. Second, you cannot rebuild it. If the environment is lost, or you need a second copy, you are reconstructing it from guesses.

Infrastructure as code fixes both. You write the servers, networks, load balancers and permissions as text files, and a tool reads those files and makes the cloud match them. The files are the single source of truth, they live in version control next to the application, and "make me another one of these" becomes a command instead of a week. Terraform is the tool we used. You declare the desired state, Terraform works out the difference between that and reality, and applies it.

<figure><div class="diagram"><div class="node muted-node">Terraform files<br>(desired state)</div><span class="arrow">→</span><div class="node">plan<br>(diff vs reality)</div><span class="arrow">→</span><div class="node accent">apply</div><span class="arrow">→</span><div class="node">cloud matches<br>the files</div></div><figcaption><b>Fig. 1</b> — the environment is text. The tool reads the diff between what you wrote and what exists, and closes the gap.</figcaption></figure>

The first job was to get there from a cloud that had been built by hand. That meant importing hand-built production into Terraform: pointing the tool at resources that already existed and teaching it to manage them without tearing anything down. It is careful, fiddly work, because a wrong move deletes a thing that is serving real traffic. But at the end of it, the environment was finally written down.

## Moving a cluster across the world

Then the interesting day arrived. The product was moving its primary region from India to the United States, and I was tasked with lifting the whole cluster across.

The old environment had been shaped by hand over months. The new one had to be its twin, in a different part of the world, built from scratch. This is exactly the problem infrastructure as code is for. Instead of re-clicking everything in the new region, the plan was to take what we now had described in code, point it at the new region, and let it stand up an equivalent cluster.

<figure><div class="diagram"><div class="node muted-node">India region<br>(hand-built)</div><span class="arrow">→</span><div class="node">described as code</div><span class="arrow">→</span><div class="node accent">apply to US region</div><span class="arrow">→</span><div class="node">twin cluster<br>+ certs, DNS, ALB</div></div><figcaption><b>Fig. 2</b> — the cluster copies itself from its own description. The front door, certificates and DNS are the parts that do not come free.</figcaption></figure>

"Equivalent" hides a lot of pain. Two things in particular ate the day.

**Certificates.** Traffic to the app is encrypted, and encryption needs certificates that prove the server is who it says it is. A certificate issued for one setup does not simply follow you to a new region and a new network. Getting valid certificates provisioned, attached to the load balancer in the new region, and trusted end to end was its own small project inside the big one.

**DNS and routing.** A user types a name; something has to translate that name into the address of a machine that can answer. In the new region there was a fresh virtual network and a fresh load balancer sitting in front of the cluster, and the domain name had to be routed to a new subdomain pointing at that load balancer. Until every layer agreed, requests either went nowhere or went to the old place. DNS also does not change instantly, so you make a change and then wait, not sure yet whether you were right.

> [!NOTE]
> A load balancer is the single front door to a group of identical servers. Clients talk to it, and it spreads requests across whatever healthy machines are behind it. When you move regions, you get a new front door with a new address, and everything that used to point at the old one has to be told.

It was, in the plain sense of the word, an eventful day. But the reason it was a day and not a quarter is that the environment was code. The migration was not a feat of memory. It was reading a description, changing a region, solving the handful of things that genuinely differ between two places, and applying.

## The control panel that kept falling over

Running a Kubernetes cluster, you want a way to see it: which workloads are healthy, what is crashing, what the logs say. We used Rancher for this, a management layer that gives you a dashboard over the cluster.

Rancher kept crashing on us. Again and again. The cause was mundane and instructive: it was running on a machine that was simply too small for it, and under load the box overclocked and gave out. The dashboard dying does not stop the cluster from serving traffic, but it blinds you, and being blind to production is its own kind of outage.

I was tasked with moving it onto a bigger virtual machine without losing its state in the process. Transplanting a stateful service is more delicate than starting a fresh one: you have to carry its data across so that the new instance picks up where the old one left off, rather than coming up empty. Once it sat on hardware that matched its appetite, the crashes stopped.

The longer-term lesson was lighter than the fix. For everyday work we moved to Headlamp, a much simpler Kubernetes interface. Most days you do not need a heavyweight management platform; you need to look at a few workloads and a few logs. Matching the weight of the tool to the weight of the task is a real saving, in both money and crashes.

## The clockwork underneath: scheduled jobs and pods

A visual search catalogue is only as good as how fresh it is. Products appear, sell out, change price. So a large part of the infrastructure was not serving live requests at all; it was clockwork that ran on a schedule to keep the catalogue current.

The shape is worth describing because it is a common one. Container images, each a frozen, runnable snapshot of a piece of the system, were built and stored. The cluster ran on a managed Kubernetes service, which pulls those images and launches them as pods, the smallest unit Kubernetes runs. Scheduled jobs woke up on a timer, each one launching pods that did a chunk of work and then exited: fetch new product data, run it through the cleaning pipeline, refresh what had gone stale. Cron on the calendar, pods doing the labour, images as the common currency between build and run.

The appeal of this pattern is that scheduled work costs you nothing while it sleeps. A pod spins up, does its job, and goes away. You are not paying for an idle machine to sit there waiting for midnight.

<figure><div class="diagram"><div class="node muted-node">Cron timer</div><span class="arrow">→</span><div class="node">launch pods<br>from images</div><span class="arrow">→</span><div class="node accent">fetch · clean · refresh</div><span class="arrow">→</span><div class="node muted-node">pods exit<br>(cost returns to zero)</div></div><figcaption><b>Fig. 3</b> — the catalogue-refresh clockwork. Work wakes on a schedule, runs as short-lived pods, and costs nothing between runs.</figcaption></figure>

## From one big program to many small ones

Early on, the scraping and processing lived as one large program, a monolith. That is the right way to start: it is simple, and you do not know yet where the real seams are. But as the pipeline grew, one slow or failing stage could drag the whole thing down, and you could not scale the busy part without scaling all of it.

So we began pulling the monolith apart into smaller services that talk through queues instead of direct calls. The migration pattern here has a name: the strangler. Rather than rewrite everything at once and flip a switch, you grow the new structure around the old one, moving one piece of work at a time onto the new path, until the old monolith has been strangled down to nothing. It lets you refactor a running system without a scary big-bang cutover.

Two tools carried the load between the new pieces:

- **A message queue** between stages, so that producing work and consuming it are decoupled. The scraper can drop a batch of products on the queue and move on; the processors pick them up at their own pace. If consumers are slow, the queue absorbs the backlog instead of the whole pipeline seizing up.
- **A dead-letter queue** for the messages that fail. In any real pipeline some items will not process, a malformed record, a stage that throws. You do not want one poisoned message blocking the line or vanishing silently. A dead-letter queue is the holding pen: failures get set aside for inspection and retry, and the healthy work keeps flowing.

<figure><div class="diagram"><div class="node muted-node">Monolith</div><span class="arrow">→</span><div class="node">queue</div><span class="arrow">→</span><div class="node accent">scrape</div><div class="node accent">transform</div><div class="node accent">embed</div><span class="arrow">→</span><div class="node">dead-letter queue<br>(the failures)</div></div><figcaption><b>Fig. 4</b> — strangling the monolith into stages that talk through a queue. Failed messages fall into a dead-letter queue instead of blocking the line.</figcaption></figure>

The direction of all of this was the same: from one tightly coupled program toward an event-driven system, where each stage reacts to work arriving rather than being called directly by the stage before it. That decoupling is what lets you scale, retry and reason about one piece without holding the whole pipeline in your head.

## What I took away

- **Write the environment down before you have to move it.** The point of infrastructure as code is not elegance; it is that "build me this again, somewhere else" becomes possible at all. The continent move was survivable because the environment was text, not memory.
- **The cross-region specifics are where the day goes.** The cluster copies itself. Certificates, DNS and the new front door do not. Budget your time for the handful of things that are genuinely regional, not for the bulk that the tool handles.
- **Right-size the box, and right-size the tool.** A control panel crashing because it was on too small a machine is embarrassing and completely avoidable. Equally, you rarely need the heavyweight tool for daily work. A lighter interface removed a whole class of friction.
- **Let schedules and queues carry the work.** Scheduled pods cost nothing while idle. Queues let stages run at their own speed, and a dead-letter queue means one bad record does not take down the line.
- **Strangle, don't rewrite.** Pulling a monolith apart one stage at a time, around a running system, is slower to feel finished but far safer than a big-bang rewrite. You keep shipping the whole way through.

Infrastructure is the part of a product users never see and only notice when it breaks. Getting it to the point where moving a cluster across the world is a long day rather than a lost quarter is, I think, the quiet version of a good result.

## More from Building shoppin'

- [shoppin' Experience](/blog/shoppin-experience): how I found shoppin', the strange application email, and the interview.
- [A Google Lens Alternative for a Job Interview, Re-Audited](/blog/shoppin-lens-research): five ways to do image similarity search, and an honest audit of my own metrics.
- [The Scraper That Learned Every Store's Language](/blog/shoppin-scrapers): how product data from many kinds of shopping sites becomes one searchable catalogue.
