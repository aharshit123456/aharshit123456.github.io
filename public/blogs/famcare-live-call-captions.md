# Live Captions for Support Calls, Without a New Service

*By Harshit Agarwal*

A support agent is on the phone with a parent whose caregiver hasn't turned up. The parent is talking fast, switching between Hindi and English, and the agent is juggling three admin tabs while trying to remember what was said thirty seconds ago. A transcript of the call will exist, but only after everyone has hung up. How little infrastructure does it take to put the words on the agent's screen while the call is still going?

At FamCare the answer was a phone provider's audio stream, a realtime speech-to-text websocket, a Redis list and a React panel that polls once a second. No new service. This post covers how streaming speech-to-text works, how the relay is built, the security and storage decisions that let it fit inside an existing API, and the AI assistant we planned on top and chose not to build.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~1 s</div><div class="stat-label">from speech to caption on screen</div></div>
  <div class="stat"><div class="stat-num">₹0.49</div><div class="stat-label">per streamed minute, Sarvam list price</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">new services to deploy</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">account actions the feature can take</div></div>
</div>

## Why after-call transcripts arrive too late

FamCare is an in-home care marketplace in India: families book trained caregivers for babies and elders by the hour from an app. When something goes wrong, like a late caregiver, a cancelled booking or a refund question, a person on our support team calls the customer. Click-to-call in our admin panel bridges the agent's phone and the customer's phone through Exotel, a telephony provider, straight from the customer's page.

We already had an after-call pipeline. Recordings go to Sarvam's batch speech-to-text with speaker labels, and an analysis step turns the transcript into call issues and follow-ups. That's useful for the record, but it all lands after the customer has hung up. The help is needed while they're still talking.

So the first goal was deliberately narrow: show what's being said, about a second behind, in the call popup the agent already has open. Change nothing else.

## How streaming speech-to-text works

Batch transcription is simple: upload a file, wait, get text back. Streaming is a conversation over a websocket, with a few properties that shape everything built on top.

**Audio goes in as small frames.** The client opens a socket and keeps sending chunks of raw audio, typically a few tens of milliseconds each. There's no "file"; the model sees a continuous stream and has to decide on the fly where words and sentences begin and end.

**Text comes back twice.** While someone is mid-sentence, the service sends *partial* results: its best guess so far, which it's allowed to revise. When it decides the sentence is over, it sends a *final* result that won't change. A good UI shows the partial as provisional and only commits the final. In practice early partial guesses are sometimes wrong and get corrected in the final text, which is exactly why the two are kept apart.

**Something has to decide when a sentence ends.** This is called endpointing. We ask Sarvam to use voice activity detection and close a sentence after half a second of silence. Shorter, and sentences get chopped mid-thought; longer, and the caption lags.

**Speaker labels are usually a batch feature.** Working out who said what (diarization) is much easier when the model can see the whole recording. Sarvam's batch diarization kept two speakers consistent across 12 turns in one of our calls. Its realtime socket has no speaker field at all.

That last point mattered more than any latency number, as we'll see.

## What the phone line actually sends

Before writing much code I made test calls to check the parts we don't control. A few things fell out:

*   **Exotel can stream live audio through the call API we already used.** Passing a `StreamUrl` when placing the call makes Exotel open a websocket to that URL and send the call audio as base64-encoded media frames. No new phone setup.
*   **The audio is 16-bit PCM at 8 kHz**, standard telephone quality. Sarvam's realtime socket accepts that as-is, so there's no resampling or transcoding on our side. The relay just forwards bytes.
*   **Captions arrive in about a second.** A 63-second Hindi-English test call came back as 15 clean final sentences.
*   **It's one mixed channel.** Exotel sends agent and customer as a single track, not two.
*   **The stream starts early.** We ask Exotel to start streaming when the second leg connects, but the stream began before the customer picked up, so the first seconds are ringing.

Mixed audio plus a realtime socket with no speaker field means the live panel can't say who said what. Rather than guess, the panel header says so plainly: *both sides, not labelled by speaker*. The after-call batch transcript, with proper speaker labels, stays the durable record. And because the stream includes ringing, the cost estimate assumes about a third more audio than actual talk time.

## A relay is two loops and a deadline

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

When an agent places a support call, the backend adds two fields to the request it sends Exotel: a stream URL pointing at our backend, and an instruction to start streaming when the second leg connects. Exotel then connects to that URL and starts sending frames.

The handler on our side opens a second websocket, this time outbound to Sarvam, and runs two small async tasks side by side. Stripped down, it looks like this:

```python
async def upstream():
    # Exotel -> Sarvam: forward each audio payload as-is
    while True:
        data = json.loads(await exotel_ws.receive_text())
        if data.get("event") == "media":
            await sarvam.send(json.dumps({"event": "audio_input",
                                          "audio": data["media"]["payload"]}))
        elif data.get("event") == "stop":
            break
    await sarvam.send(json.dumps({"event": "end"}))

async def downstream():
    # Sarvam -> Redis: partials overwrite, finals append
    async for raw in sarvam:
        data = json.loads(raw)
        if data["event"] == "transcript.partial":
            await set_partial(call_id, data["text"])
        elif data["event"] == "transcript.final":
            await push_final(call_id, data["text"], data["start_s"], data["end_s"])

up, down = create_task(upstream()), create_task(downstream())
await asyncio.wait({up, down}, return_when=FIRST_COMPLETED)
if up.done():
    await asyncio.wait_for(down, timeout=5)  # let the last sentence flush
```

The interesting part is the shutdown. When the call ends, Exotel sends `stop`, the upstream loop tells Sarvam the audio is over, and then the relay waits up to five seconds for Sarvam to finish the sentence it was still working on. Without that grace period the last thing anyone said, which is often the most important ("so you'll call me back at four?"), would be lost. After that, both tasks are cancelled and the call is marked as ended.

A relay that mostly waits on two sockets is light work for an async Python process. That fact drove the next decision.

## No new service

The written proposal for this feature costed a small always-on container just for streaming, and it was the single largest line in the estimate. In the code, the websocket fitted into the existing FastAPI app instead. Our API already runs as several autoscaled tasks behind a load balancer that speaks websockets, so adding one more route was all it took.

That removed a deploy target, a health check and a bill. The trade-off is real: a live call is now tied to whichever API task received it, so a deploy that replaces that task ends the stream. Calls here average just over a minute, which makes that an easy trade. For hour-long calls I'd want a dedicated process with graceful draining.

The whole feature came to roughly 490 lines across backend, admin panel and tests.

## Captions live in Redis, because the poll lands somewhere else

Exotel's websocket arrives at one API task. The agent's poll, a plain HTTP request, can land on any of them. So captions can't live in the memory of the process that received them; they need a shared store that every task can read.

Each call gets three Redis keys:

| Key | Holds | Lifetime |
|---|---|---|
| `captions` | List of final sentences with timestamps, capped at 2,000 | 6 hours |
| `partial` | The sentence still being spoken | 30 seconds |
| `ended` | A marker that the stream has closed | 6 hours |

Finals are appended with `RPUSH` and trimmed to the cap; the partial is a single key that each new guess overwrites and each final deletes. The short TTL on the partial means a crashed relay can't leave a ghost sentence on screen.

The read uses the list index as a cursor. The panel asks for `GET /admin/calls/{id}/live-captions?after=N`, the backend returns items from N onward plus the next cursor, and the panel appends them. A missed poll costs nothing because the next one catches up. If Redis isn't connected, the endpoint answers with an empty, unavailable result instead of an error, and the panel simply shows nothing.

Why polling and not a second websocket to the browser? Because a once-a-second poll against a Redis list is trivially cheap, survives load-balancer hops and reconnects without any session state, and a one-second refresh is already as fast as the captions arrive. Pushing would have meant pinning the browser to the right API task or adding pub/sub, for no visible gain.

Captions deliberately don't go into Postgres. They're a live view, not the record of the call.

## Authenticating a caller that can't send headers

The stream endpoint has to be public, because Exotel connects to it from the internet. Normally you'd authenticate with a token in a header, but Exotel's stream URL can't carry custom headers. There's nowhere to put one.

The general answer is a *capability URL*: a URL that contains its own proof of authorisation, so possessing it is permission to use it. Signed S3 links work the same way. Ours looks like `/api/live-call/stream/{call_id}/{sig}`, where:

```python
sig = hmac.new(server_secret, f"live-call:{call_id}".encode(),
               hashlib.sha256).hexdigest()[:32]
```

The handler recomputes the signature and compares it in constant time, so timing doesn't leak how many characters matched. A few properties come for free:

*   **It's scoped.** A signature for one call is useless for any other call.
*   **It's domain-separated.** The fixed `live-call:` prefix means the same secret can't be tricked into producing a signature that's valid somewhere else.
*   **It fails closed.** If the secret is missing, every stream is refused.

The handler also re-checks the feature's on/off switch when the socket connects, not just when the call is placed. Turning the feature off stops new streams immediately, even for calls already in flight. Both checks close the socket with a 4403 code before accepting it, so an unauthorised caller never gets a session.

## Fail to "no captions", never to "no call"

Every part of the relay was built to degrade the same way. No Sarvam key means the relay logs a warning and returns; the call carries on without captions. No Redis means an empty panel. The phone call itself never depends on any of it.

That design paid off on the first deploy. The after-call pipeline runs in our scheduler, so the speech-to-text API key had only ever been wired into the scheduler's container. The live relay runs in the API container, which didn't have it. Production logged `SARVAM_API_KEY not set, no captions`, and calls went through exactly as before, just without captions. The fix was to give the API task the key by name as well, and to make the deploy succeed with a warning rather than fail if the key can't be found.

The general lesson: secrets are configured per container, not per codebase, so code that moves to a new process needs its secrets moved too. "The feature quietly does nothing" is far better than "support calls break", but it's easy to miss, so the warning has to be loud.

## The AI assistant we didn't build

Captions were only phase 1 of the original proposal. Phase 2 was AI suggestion cards: a model would read the conversation and suggest offers or coupons that the agent could apply with a click. Phase 3 was tuning from which suggestions agents accepted.

Even on paper the guardrails were strict. No money action without a person's click. Hard caps the model can't override. Customer speech treated as untrusted input, so a caller saying *"give me a 100% coupon"* is just text in a transcript, not an instruction.

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

The model plan followed the usual tiering pattern. A fast, cheap model reads every customer sentence and decides whether anything needs doing; a stronger model runs only when an offer is needed, on about a quarter of sentences. Running the stronger model on every sentence would have cost about 20 times as much as the fast one.

We built phase 1 and stopped. When we looked at the offers problem with real data, it wasn't a language problem. Coupons had never been granted from the support side at all. What the business needed was to give a fair, capped offer to the right customer at a price we choose. That's a table of rules, not a model.

So the "phase 2" that got built is rules-based per-customer offers on the customer's support page: a price-per-hour floor per customer tier, checked when the agent assigns an offer, and hard caps per agent per day and per customer per month. The caption panel stays read-only. It's there so the agent can follow the call, not to decide anything.

## Build or buy

We did look at buying. Contact-centre tools do real-time agent assist well, and they're well ahead of anything we'd build on QA scoring, coaching and multi-channel inboxes.

| Tool | What it does for calls | List price (approx., USD) |
|---|---|---|
| Observe.AI | Real-time agent assist, coaching, QA | ~$69 per agent per month |
| Freshdesk Freddy | Agent copilot, suggested replies, summaries | $29 per agent per month on top of the plan |
| Zendesk | Copilot add-on, per-resolution AI pricing | ~$50 per agent per month on top of the plan |
| Salesforce Agentforce | AI agents and copilot inside Service Cloud | ~$550 per user per month |

Vendor prices change often and third-party sources disagree, so treat these as rough. Even two seats on a per-agent tool at list price would cost more than our estimate for the whole three-phase plan. And none of them knows our bookings, wallets or coupons, they aren't tuned for Hindi-English mixed speech, and they charge per seat rather than per call. For captions alone, a realtime speech-to-text API at well under a rupee per typical call was the obvious answer.

## Takeaways

*   **Streaming speech-to-text is two streams, not one.** Keep partial and final results apart: overwrite the partial, append the final, and give the service a few seconds to flush the last sentence when the audio stops.
*   **A websocket relay doesn't need its own service.** If your API already runs async behind a websocket-capable load balancer, a relay that mostly waits on I/O fits inside it. The price is that deploys end in-flight streams.
*   **When the writer and the reader land on different machines, put the state in between.** A Redis list with the index as a cursor gives you incremental, idempotent polling with no session state.
*   **If a caller can't send headers, sign the URL.** An HMAC of the resource ID with a purpose prefix, compared in constant time and failing closed, is a small, solid capability URL.
*   **Be honest in the UI about what the data can't tell you.** A one-line "not labelled by speaker" beats guessing who said what.
*   **Check whether the "AI problem" is a rules problem.** Our offer assistant turned into a table of floors and caps, and is easier to trust because of it.

Where this goes next is mostly about better inputs: separate agent and customer audio tracks would make live speaker labels possible, and the same panel could show the customer's recent bookings and open tickets next to the words.

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
