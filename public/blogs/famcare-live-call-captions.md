# Live Captions for Support Calls, Without a New Service

*By Harshit Agarwal*

Our support team phones customers from the FamCare admin panel all day. Until recently, the words of those calls only became text after the call had ended. This post is about the small build that puts the words on screen while the call is still going: a phone provider's audio stream, a realtime speech-to-text socket, a Redis list and a polling React panel. It's also about the AI-coupon assistant we planned on top of it and then decided not to build.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~1 s</div><div class="stat-label">caption delay in our test calls</div></div>
  <div class="stat"><div class="stat-num">₹0.49</div><div class="stat-label">per streamed minute, Sarvam list price</div></div>
  <div class="stat"><div class="stat-num">~490</div><div class="stat-label">lines across backend, admin and tests</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">account actions the feature can take</div></div>
</div>

## The problem

FamCare sends trained caregivers into homes to look after babies and elders, booked by the hour from an app. When something goes wrong, like a late caregiver, a cancelled booking or a refund question, a person on our support team calls the customer. The team's existing click-to-call bridges the agent's phone and the customer's phone through Exotel, straight from the customer's page in the admin panel.

During that call, the agent works from memory and from several open admin tabs. A few days before this project I'd built an after-call pipeline: recordings go to Sarvam's batch speech-to-text with speaker labels, then an analysis step turns them into call issues and follow-ups. Useful, but it all lands after the customer has hung up. The help is needed while they're still talking.

So the goal for phase 1 was narrow. Show what's being said, about a second behind, in the call popup the agent already has open. Change nothing else.

## What the test calls showed

On the day we built it, I made test calls to check the parts I didn't control:

*   **Exotel can stream live audio** through the same call API we already used, by passing a `StreamUrl` when placing the call. No new phone setup.
*   **The audio is 16-bit PCM at 8 kHz.** Sarvam's realtime socket accepts that as-is, so there's no resampling or transcoding on our side.
*   **Captions arrive in about a second.** A 63-second Hinglish test call came back as 15 clean final sentences. Early partial guesses that were wrong got corrected in the final text.
*   **Speaker labels only work after the call.** Sarvam's batch diarization kept two speakers consistent across 12 turns. The realtime socket has no speaker field.
*   **Exotel sent one mixed channel**, not separate agent and customer tracks. And the stream started before the customer picked up.

The last two points shaped the UI more than anything else, and they're still open.

## The design

<figure>
  <div class="diagram">
    <div class="node muted-node">Exotel call<br>(agent ↔ customer)</div>
    <span class="arrow">→</span>
    <div class="node">Our websocket<br>signed path</div>
    <span class="arrow">→</span>
    <div class="node">Sarvam realtime<br>speech-to-text</div>
    <span class="arrow">→</span>
    <div class="node accent">Redis list<br>per call</div>
    <span class="arrow">→</span>
    <div class="node">Admin call popup<br>polls every second</div>
  </div>
  <figcaption><b>Fig. 1</b> — the caption path. Audio goes in on the left, text comes out on the right, and nothing on the way touches a customer's account.</figcaption>
</figure>

When an agent places a support call, the backend checks the `live_call_assist` feature flag. If it's on, the call request to Exotel carries two extra fields: a stream URL pointing at our backend, and an instruction to start streaming when the second leg connects.

Exotel then opens a websocket to `/api/live-call/stream/{call_id}/{sig}` and sends the call audio as base64 media frames. The handler opens a second websocket to Sarvam's realtime speech-to-text and runs two small tasks side by side:

*   **Upstream** reads Exotel's frames and forwards each audio payload to Sarvam. On Exotel's `stop` event it tells Sarvam the stream has ended.
*   **Downstream** reads Sarvam's results. Partial text goes into a short-lived Redis key. Final sentences, with their start and end times, are appended to a Redis list for that call.

When either side closes, the handler gives Sarvam up to five seconds to flush the last sentence, then marks the call as ended.

On the admin side, a `LiveCaptions` component sits inside the existing call popup. Once a second it calls `GET /admin/calls/{id}/live-captions?after=N` and appends whatever is new. The partial line shows in grey italics under the final ones. The header says plainly what the panel can't do: *both sides, not labelled by speaker*.

| Piece | Where it runs | Size |
|---|---|---|
| Stream websocket + caption endpoint | Existing FastAPI router | ~50 lines |
| Sarvam relay + Redis storage | New `live_call` module | ~180 lines |
| Stream URL on the Exotel call | Existing Exotel client and service | ~20 lines |
| `LiveCaptions` panel + popup wiring | Existing admin call popup | ~125 lines |
| Unit tests | Backend | 6 tests |

I built the backend and admin pieces in one pass and merged them on the same day, behind the flag.

## Four decisions that mattered

### No new service

My written proposal costed a small always-on container just for streaming, and it was the single largest line in the estimate. In the code, the websocket fitted into the existing API instead. Our API already runs as several autoscaled tasks behind a load balancer that speaks websockets. A relay that mostly waits on two sockets is light work for an async Python process.

That removed a deploy target, a health check and a bill. The cost is that a long call is now tied to an API task, so a deploy that replaces the task ends the stream. For calls that average just over a minute, that's a trade I'm happy with.

### Redis, because the poll lands somewhere else

The websocket from Exotel arrives at one API task. The admin's poll can land on any of them. So the captions can't live in the memory of the process that received them.

Each call gets three Redis keys, all prefixed by environment like everything else we store there:

| Key | Holds | Lifetime |
|---|---|---|
| `captions` | List of final sentences with timestamps, capped at 2,000 | 6 hours |
| `partial` | The sentence still being spoken | 30 seconds |
| `ended` | A marker that the stream has closed | 6 hours |

The read uses the list index as a cursor. The panel sends `after=N`, the backend returns items from N onward plus the next cursor, and a missed poll costs nothing because the next one catches up. If Redis isn't connected, the endpoint answers with an empty, unavailable result instead of an error.

I didn't put captions in Postgres. They're a live view, not the record of the call. The after-call batch transcript, with speaker labels, is still the durable copy.

### A signature in the path, because Exotel can't send headers

The stream endpoint has to be public, since Exotel connects to it from outside. Exotel's stream URL can't carry custom headers, so there's nowhere to put a normal auth token.

The URL carries its own proof instead. The signature is an HMAC-SHA256 of the call ID with a fixed `live-call:` prefix, keyed by a server-side secret and cut to 32 hex characters. The handler recomputes it and compares in constant time. A signature for one call is useless for any other call, and if the secret is missing every stream is refused. The handler also re-checks the feature flag when the socket connects, so switching the flag off stops new streams even for calls already placed.

Both checks close the socket with a 4403 code before accepting it. Unit tests cover the per-call signature, the missing-secret case, the URL shape, the incremental read, the no-Redis read, and that the call request only carries stream fields when asked.

### Read-only first, and the AI part replaced by rules

The full proposal had three phases: captions and context (read-only), then AI suggestion cards with offers and coupons that the agent clicks to apply, then tuning from what got accepted. Even in the plan, the guardrails were strict. No money action without a person's click. Hard caps the model can't override. Customer speech treated as untrusted, so a caller saying *"give me a 100% coupon"* is just text.

The plan's cost split shows where the money would have gone:

<figure>
  <div class="chart">
    <div class="bar-col"><div class="bar-value">38%</div><div class="bar" style="height: 100%;"></div><div class="bar-label">Streaming container</div></div>
    <div class="bar-col"><div class="bar-value">26%</div><div class="bar" style="height: 66%;"></div><div class="bar-label">After-call summary</div></div>
    <div class="bar-col"><div class="bar-value">21%</div><div class="bar" style="height: 53%;"></div><div class="bar-label">Stronger model for offers</div></div>
    <div class="bar-col"><div class="bar-value">11%</div><div class="bar accent" style="height: 29%;"></div><div class="bar-label">Live captions</div></div>
    <div class="bar-col"><div class="bar-value">4%</div><div class="bar" style="height: 11%;"></div><div class="bar-label">Fast model per sentence</div></div>
  </div>
  <figcaption><b>Fig. 2</b> — how the proposal's estimated cost split across the three phases, at list prices. Only the highlighted bar was built, and the streaming container turned out to be unnecessary.</figcaption>
</figure>

The model choice in that plan was the usual one. A fast, cheap model reads every customer sentence, and a stronger model runs only when an offer is needed, on about a quarter of sentences. Running the stronger model on every sentence would have cost about 20 times as much as the fast one.

We built phase 1 and stopped. When we looked at the offers problem with live data the next day, it wasn't a language problem. Coupons had never been granted from the support side. What the business actually needed was to give a fair, capped offer to the right customer at a price we choose. That's a table of rules, not a model.

So phase 2 became rules-based per-customer offers, which I built separately: a price-per-hour floor per customer tier, checked when the agent assigns an offer, and hard caps per agent per day and per customer per month. It sits on the customer's support page, behind its own flag. The caption panel stays read-only. It's there so the agent can follow the call, not to decide anything.

## Build or buy

We did look at buying. Contact-centre tools do real-time agent assist well, and they're ahead of us on QA scoring, coaching and multi-channel inboxes.

| Tool | What it does for calls | List price (approx., USD) |
|---|---|---|
| Observe.AI | Real-time agent assist, coaching, QA | ~$69 per agent per month |
| Freshdesk Freddy | Agent copilot, suggested replies, summaries | $29 per agent per month on top of the plan |
| Zendesk | Copilot add-on, per-resolution AI pricing | ~$50 per agent per month on top of the plan |
| Salesforce Agentforce | AI agents and copilot inside Service Cloud | ~$550 per user per month |

Vendor prices change often and third-party sources disagree, so treat these as rough. Even two seats on a per-agent tool at list price would cost more than our estimate for the whole three-phase plan. But none of them knows our bookings, wallets or coupons. They also aren't tuned for Hindi-English mixed speech, and they charge per seat rather than per call. For captions alone, a realtime speech-to-text API at under a rupee a call was the obvious answer.

## What went wrong

> [!WARNING]
> **The key that only one container had.** The after-call pipeline runs in the scheduler, so the Sarvam API key had only been wired into the scheduler's task definition. The live relay runs in the API. Once the first version was deployed, production logged `SARVAM_API_KEY not set, no captions` and calls went through without captions. I fixed the deploy workflow to give the API task the key by name too. If the key can't be found, the deploy still succeeds, with a warning, and captions stay off. The relay had been built to fail the same way: no key means no captions, never a failed call.

*   **One mixed channel.** Exotel sends agent and customer as a single track, and Sarvam's realtime socket has no speaker field. So the live panel can't say who said what. We label that honestly in the UI and rely on the after-call transcript for speaker labels.
*   **The stream starts before the customer answers.** We ask Exotel to start at the second leg's connection, but in testing the stream began before the customer picked up, so the first seconds are ringing. That costs a little Sarvam time per call. The cost estimate already assumed about a third more audio than actual talk time for this.
*   **`dev_only` doesn't mean developers here.** On most of our flags, `dev_only` limits a feature to developer accounts. This code path has no per-customer check, so the backend treats `dev_only` the same as `live`, and every support call streams. The code says so, but the name invites the wrong assumption.
*   **Testing on real phones needed a real customer.** Developer accounts are hidden from the support customer list. A small follow-up lets a superadmin tick *show developer accounts*, so we can call a test customer from the same screen the support team uses.

## Results

Phase 1 is merged into both staging and main: the stream websocket, the Redis caption store, the caption endpoint, the admin panel and the deploy fix. The backend deploys that carried them succeeded the same day. It's behind the `live_call_assist` flag, and with the flag off, calls are placed exactly as before and the panel never appears.

In our test calls, captions arrived about a second behind speech and handled Hindi-English mixing well. At Sarvam's list price of ₹0.49 per minute, captions cost well under a rupee for a typical call. They add no new service to run.

> [!NOTE]
> I haven't yet seen captions on a production support call since the key fix went out. The test calls proved the pipeline. A full end-to-end check on a live support call is still on the list.

## What's next

*   One end-to-end production call with captions, checked against the CloudWatch logs for the stream.
*   Ask Exotel for separate agent and customer tracks, and a stream that starts only once the customer answers.
*   The read-only customer context from the original phase 1 plan (recent bookings, open tickets, wallet) next to the captions.

---

*Stack: FastAPI, Redis, websockets, Exotel, Sarvam realtime speech-to-text, Next.js, AWS ECS Fargate. Prices are public list prices as of November 2026.*

## More from Building FamCare

- [A Voice Agent That Only Drafts](/blog/famcare-voice-agent): an LLM voice interview that can only propose drafts.
- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
