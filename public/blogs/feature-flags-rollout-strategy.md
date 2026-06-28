# Feature Flags & Rollout Strategy

Sat down with Dr. Stone S4 running, deep in thought about a startup's analytics data I just revamped. Pasted it into Claude Code and started asking the obvious question: what tech gaps does this expose?

Two things became very clear very fast.

## Feature Flags Beyond AB Testing

Internally we've been using them for dev checks. But with a growing team, no one really thinks about dark rollouts. So I dug in. Quickly realised this pattern isn't limited to AB testing. You can use feature flags and roll out toggles for so much more: circuit breakers, gradual migration, safety nets on database changes, everything.

And then I found out Meta's been doing this forever. Some smart consultant would probably tell you to go LaunchDarkly or Firebase immediately, which might not be the best call for a startup. Sometimes a basic single table and better developer practice is enough. All hail DLCs.

## Feature Rollout Strategies

What fast moving consumer startups forget is that features aren't slowed down by planning, they're slowed down by instability. I shipped a feature plan today, refined with real production data. Made a little CLI tool for the team to engage with before rolling anything out. Canary deployments to 10 users, then 20%, then full.

Good software isn't about writing code fast and shipping fast. It's about writing good code that gets tested by a thousand real users before the first bug makes it to production.

Speed without discipline just gets you to broken faster.
