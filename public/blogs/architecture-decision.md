# Architecture Decision (Day 0)

Most people treat architecture as a day 300 problem. It's not. It's a day 0 decision — and it matters more than you think.

Some overly smart system design folks will tell you to go Golang microservices from day 1 and optimize for scale before you've even validated anything. Ignore them.

The more sane take: stick to a monolith, but make it modular. Smart service layers, clean repositories, intentional abstractions. Observability and determinism baked in from the start — Sentry error logging, Alembic migrations — these aren't nice-to-haves, they're load-bearing.

One of my current projects has 38 service modules, all wired with that intent since day 1. New devs join, they know exactly where to look. Service, repository, model. That's it.

<figure>
  <img src="/gallery/illustrations/1780700866000.jpeg" alt="Comparison diagram: flat monolith (the mess), modular monolith (the sweet spot, 38 modules zero confusion), and microservices day 1 (the trap, kubernetes on day 3)" style="width:100%; border-radius: 6px;" />
  <figcaption><b>Fig. 1</b> — the modular monolith is the middle column. Same one codebase as the flat monolith, but with a service → repository → model layer split, so every one of the 38 modules follows the same shape.</figcaption>
</figure>

And that matters when you're at a startup shipping 10 features a week with 100s of active bugs across the QA pipeline. Good architecture isn't a luxury — it's how you avoid 10 devs on 10 laptops fighting over the same file.

Messy codebases don't happen because people are bad engineers. They happen because architecture was an afterthought. And once you're in a place where only one person understands one service — and everyone else just creates a new service rather than touching it — that debt doesn't disappear. It compounds.

<figure>
  <img src="/gallery/illustrations/1780700865883.jpeg" alt="Graph showing cost to fix technical debt rising over time: cheap to fix in the fixable window before day 90, then compounding into rewrite territory by day 300" style="width:100%; border-radius: 6px;" />
  <figcaption><b>Fig. 2</b> — technical debt always gets repaid. The question is when, and at what interest rate.</figcaption>
</figure>

The flip side kills you too. I've debugged codebases with so many abstraction layers that hitting next on the debugger 10 times still doesn't get you to actual business logic. Over-engineering is its own trap.

<figure>
  <img src="/gallery/illustrations/1780700866053.jpeg" alt="Satirical call stack showing 10 layers of abstraction (AbstractBaseRequestHandlerFactory, GenericRequestInterceptorDelegate, etc.) before reaching the actual createOrder() business logic" style="width:60%; border-radius: 6px; margin: 0 auto; display: block;" />
  <figcaption><b>Fig. 3</b> — ten clicks of "next" in the debugger before you hit any real business logic. This is what over-engineering looks like from the inside.</figcaption>
</figure>

Somewhere in between is where the good software lives.
