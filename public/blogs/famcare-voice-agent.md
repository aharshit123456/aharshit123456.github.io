# A Voice Agent That Only Drafts

*By Harshit Agarwal*

Ask a parent to type "what helps calm your baby down?" into a phone held in one hand, and the answer is usually short or missing. Saying it out loud is far easier, and voice AI now makes that conversation cheap enough to offer everyone. The catch is that a language model is now listening to information a stranger will act on, like whether a child is allergic to egg. How do you get the convenience of an LLM without letting it write anything you can't take back?

Our answer was to keep the model on the read side of the system. It can listen, ask and propose. It can never save.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~3 min</div><div class="stat-label">per interview, in English, Hindi or Hinglish</div></div>
  <div class="stat"><div class="stat-num">~₹9</div><div class="stat-label">per interview (about $0.10) at list prices</div></div>
  <div class="stat"><div class="stat-num">75%</div><div class="stat-label">of that cost is speech, not the LLM</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">new write paths into the child's record</div></div>
</div>

## The first visit problem

FamCare is an in-home care marketplace in India: families book trained caregivers for babies and elders by the hour, from an app. The first visit to a new family is the hardest one. The caregiver doesn't yet know that this baby calms down when you hum, refuses food if you insist, and must not have egg.

That knowledge lives in the **Baby Passport**, a care profile the parent fills in and the caregiver reads before the visit. The fields that matter most are the open ones, and those are exactly the ones parents skip. So we let the parent talk instead: a three-minute conversation, and the Passport fills itself in as a draft.

Four constraints shaped everything after that:

*   **Safety.** A caregiver acts on what the Passport says. A model that hears "maybe egg" and writes `allergy: egg`, or hears nothing and writes `no allergies`, has created a safety incident.
*   **Language.** Parents mix English and Hindi mid-sentence. Their exact words (*"zabardasti mat karna"*, don't force her) are often the most useful thing a caregiver can read.
*   **Cost.** It has to be cheap enough to offer to every parent, free.
*   **A small team.** We can't babysit a real-time system. Any part of it can fail, and the parent should barely notice.

<figure>
  <div class="screenshot-container">
    <img src="/assets/famcare/case-studies/voice-entry.webp" alt="Baby Passport entry sheet offering a three-minute chat with FamCare AI" />
    <img src="/assets/famcare/case-studies/voice-live.webp" alt="Live voice interview with chips for what has been captured so far" />
    <img src="/assets/famcare/case-studies/voice-review.webp" alt="Review screen titled Here is what I heard, with each answer quoting the parent" />
    <img src="/assets/famcare/case-studies/voice-care-card.webp" alt="Care instructions card the caregiver sees, with allergies confirmed by the parent" />
  </div>
  <figcaption><b>In the app</b> — starting a chat from the Baby Passport, chips filling in while the parent talks, the review screen where nothing is shared until they save, and the card the caregiver finally reads.</figcaption>
</figure>

## A cascade, not one big model

There are two ways to build a voice agent today. A **speech-to-speech** model takes audio in and gives audio out, in one model. A **cascade** chains specialised stages: detect when the person has stopped talking, transcribe, think in text, then speak. Speech-to-speech can feel more fluid. A cascade gives you seams, and seams are where you put control.

The parent taps *Start talking* in the app. Our backend opens a session, mints a room token and dispatches a voice worker into a LiveKit room (LiveKit is a hosted WebRTC service, the same real-time media stack video calls use). From then on, audio flows only between the phone, LiveKit and the worker. It never passes through our own servers.

<figure>
  <div class="diagram">
    <div class="node muted-node">Parent's phone<br>(Flutter app)</div>
    <span class="arrow">↔</span>
    <div class="node">LiveKit Cloud<br>(WebRTC room)</div>
    <span class="arrow">↔</span>
    <div class="node accent">Voice worker<br>(LiveKit Agents on ECS Fargate)</div>
  </div>
  <figcaption><b>Fig. 1</b> — the audio path. Our FastAPI + Postgres backend only ever sees text: sessions, turns and drafts.</figcaption>
</figure>

Inside the worker is the cascade. Voice activity detection (VAD) and a turn detector decide when the parent has finished speaking, which matters more than it sounds: cut in too early and the agent interrupts; wait too long and it feels sluggish. A streaming speech-to-text (STT) model transcribes, an LLM decides what to say next, and a text-to-speech (TTS) model says it.

| Stage | What we run |
|---|---|
| End of speech | Silero VAD + turn detector |
| Speech-to-text | ElevenLabs Scribe v2 |
| Interviewer LLM | Gemini |
| Text-to-speech | ElevenLabs Flash |
| Extractor LLM (silent) | transcript → draft fields |

We chose the cascade because every stage can be swapped out and every stage has a fallback. The text between stages is also something we can redact, log the shape of, and test.

The data side is four steps:

1.  The app starts a session using the user's normal login.
2.  The backend returns a room token and dispatches the worker by name.
3.  The worker calls a small internal backend API, authenticated with a shared secret, to load the session's context and post turns and drafts.
4.  The backend hands the draft to the app. The parent reviews it, edits, and saves.

The backend also owns the admin-editable questions and the validation. The worker never writes to the Passport.

## Split the model that talks from the model that writes

There are two LLM roles. The **interviewer** runs the conversation: one question at a time, warm, short. It has no tools and can't save anything. After every parent turn, a separate **extractor** reads the redacted transcript and produces a structured draft of the Passport fields. It runs out of band, so the parent never waits on it.

<figure>
  <div class="diagram">
    <div class="node muted-node">Parent turn</div>
    <span class="arrow">→</span>
    <div class="node">Extractor<br>(redacted transcript)</div>
    <span class="arrow">→</span>
    <div class="node">Backend<br>(re-checks rules)</div>
    <span class="arrow">→</span>
    <div class="node">Review screen</div>
    <span class="arrow">→</span>
    <div class="node accent">Parent taps Save</div>
  </div>
  <figcaption><b>Fig. 2</b> — the only write into the child's record is the last box, through the endpoint the manual form already used.</figcaption>
</figure>

The parent saves through the same endpoint the manual form has always used, so the voice feature added zero new ways to change a child's profile. Everything new sits upstream of a human decision.

The extractor follows rules in its prompt. The backend checks the same rules again on every draft, because a model can ignore its prompt:

*   Allergy and medical tags only come from the active list we send. Anything else goes to *needs review*, never to the nearest-looking tag.
*   Every field points at a real parent turn. No evidence, no field.
*   Phrases are kept verbatim, in the parent's language.
*   "She's about two" becomes an age. It never becomes an invented date of birth.
*   Allergies and outdoor permissions are always drafts. The parent confirms them on the next screen, every time.

The design we rejected was letting the agent fill the form with tool calls. It's the obvious LLM design, and it puts the model on the write path. A wrong tool call would be a wrong record that a caregiver might act on before anyone noticed.

## Let slow drafts lose

Extraction takes one to three seconds and runs after every turn, so drafts overlap. The draft for turn 3 can finish *after* the draft for turn 4. If the backend kept whatever arrived last, the parent would watch the form go backwards.

| Draft | Starts | Finishes | What the backend does |
|---|---|---|---|
| seq 3 | first | last (slow model response) | arrives late, 3 < 4, ignored |
| seq 4 | second | first (fast) | stored, 4 is the newest |

So the worker numbers every turn and every draft, and the backend keeps the highest draft number it has seen. Ordering is by sequence number, not arrival time. This is the same trick as a version column in optimistic concurrency: the writer says which version it is, and the store refuses to go backwards. The same numbers make retries idempotent too: posting turn 7 twice stores it once. It's a few lines of code, and it removes a whole class of race conditions without locks, queues or cancellation logic.

## Choose the model by how it fails

Before picking a model we wrote an eval set of synthetic transcripts that encode the failures we were afraid of:

*   The hedged allergy *"shayad anda"* (maybe egg) must **not** be tagged.
*   An unlisted food (kiwi) must go to *needs review* instead of being mapped onto a listed allergy.
*   A food-refusal phrase must come back word for word.
*   "About two" must stay an age.

| Model | Passed (of 12) | What failed | Cost vs. chosen |
|---|---|---|---|
| **Gemini 3.5 Flash-Lite** (chosen) | 12 | Nothing | baseline |
| Bedrock Nova Pro | 11 | Paraphrased one phrase | +28% |
| Claude Haiku 4.5 (Bedrock) | 10 | Paraphrased two phrases; passed every safety case | +41% |
| Bedrock Nova Lite (unsafe) | 10 | Tagged the hedged "maybe egg" allergy | −18% |
| Bedrock Nova Micro (unsafe) | 9 | Hedged allergy, and mapped kiwi onto a listed tag | cheaper |

That was a first screening run, one pass each. Cost is per whole interview, including speech.

Two readings mattered more than the totals. The first is **direction**. Nova Lite scored the same as Haiku, but its failure was guessing a tag that wasn't said. That's the unsafe direction, so it was out despite being the cheapest. A score that treats "missed a detail" and "invented an allergy" as one point each is hiding the only thing you care about. The second is **shared failures**. Several models paraphrased the food phrase, which points at the prompt rather than any one model. So we fixed the prompt instead of shopping for a model.

Twelve synthetic cases, one run each, is a screen, not a benchmark; a model can pass or fail it by chance. So the rule since then has been that every bug found in the wild becomes an eval case before it gets fixed. The suite has grown from 12 cases to over 100, across extraction, structured preferences and guardrails. Evals call real models, so they run before every prompt or model change rather than in CI. The unit tests need no network, and those do run in CI.

## Speech is the bill, not the LLM

A three-minute interview speaks about 1,100 characters and makes about 28 LLM calls. We costed it line by line from a real test session and list prices before writing the production service.

<figure>
  <div class="chart">
    <div class="bar-col"><div class="bar-value">56%</div><div class="bar accent" style="height: 100%;"></div><div class="bar-label">TTS</div></div>
    <div class="bar-col"><div class="bar-value">19%</div><div class="bar" style="height: 34%;"></div><div class="bar-label">STT</div></div>
    <div class="bar-col"><div class="bar-value">16%</div><div class="bar" style="height: 29%;"></div><div class="bar-label">Extractor</div></div>
    <div class="bar-col"><div class="bar-value">6%</div><div class="bar" style="height: 11%;"></div><div class="bar-label">Interviewer</div></div>
    <div class="bar-col"><div class="bar-value">3%</div><div class="bar" style="height: 5%;"></div><div class="bar-label">LiveKit</div></div>
  </div>
  <figcaption><b>Fig. 3</b> — cost split of one measured 174-second interview at list prices, about $0.10 with Gemini Flash-Lite. Speech is three quarters of the bill.</figcaption>
</figure>

This flipped my intuition. The LLM is 5–22% of the cost depending on the model, so **we choose the LLM on quality**. The cheapest model that passes the evals saves pennies, while a wrong allergy costs trust.

The biggest levers are on the speech side. Pre-rendering the fixed greeting and goodbye once saves about 17%, because you stop paying TTS for the same sentences on every call. Running the extractor on every other turn saves about 8%. At small scale, fixed infrastructure is most of the cost; by ten thousand interviews a month it's about an eighth.

## Make failure quiet

The call depends on three outside AI providers at once. We assumed each one would fail, and decided in advance what the parent would experience when it did:

*   **LLM:** a chain of models and keys, best first, then a second key, then optionally a different cloud (Bedrock). A model that answers "quota exhausted" is marked unavailable and skipped on later turns, so every turn doesn't wait on it. It gets probed again in the background, like a circuit breaker.
*   **Speech:** a second speech vendor sits behind the first, for both STT and TTS.
*   **All speech down:** the call degrades to text. The agent's replies show up as chat and the parent can type. The app is told through participant attributes so it can show the right UI.
*   **Our own backend down:** the interview carries on and the manual form still works. Nothing is lost that the parent can't type.

> [!WARNING]
> **A billing error that would have hung up on parents.** When a speech-to-text account ran out of credit, the framework did what it was designed to do. It recreated the failed stream every half second and closed the whole session after the fourth unrecoverable error. A billing problem would have ended the call mid-sentence. We wrote the failing test first, then made the worker mark STT as down and stop the recreate loop, so typed answers and the agent's voice carry on.

The general lesson: retry logic in a framework is designed for transient errors. A permanent error (no credit, revoked key) needs to be recognised and routed to a degraded mode, or the retries themselves become the outage.

Two operational surprises belong here too. Our first prototype borrowed an API key from our website chatbot, and the two competed for the same quota; each service now has its own keys, plus a fallback key. And deploys can cut calls: Fargate gives a stopping task at most two minutes, and a call can run longer, so a deploy has to drain workers before replacing them. A plain restart isn't enough for long-lived sessions.

## Privacy, built in from the start

**Deterministic redaction, no LLM.** Every turn that leaves the live call is redacted by code, not a model: phone numbers, emails, UPI handles, PAN numbers and links. It catches the forms people actually speak, like digits said in Hindi (*"nau aath saat…"*), "double nine", and "name at gmail dot com". Ages, times and prices stay intact. Using code rather than a model means redaction is testable and can't be talked out of its job.

**Safe against hostile input.** Regexes can be attacked: a carefully crafted string can make a backtracking pattern take exponential time (ReDoS). Input is capped, every pattern has bounded repetition, and the digit scan is linear. Redaction runs off the event loop with a timeout. If it ever times out, the turn becomes `[redacted]` rather than leaking.

**The agent knows less on purpose.** It isn't told the child's name or any identifier. It uses a name only if the parent says it.

**Nothing sensitive in logs.** Transcript text and tags are never logged. Logs carry stable tokens like `VOICE_DEGRADED stt` that drive alerts, with no content.

**Typed input is guarded.** Messages are cleaned, clipped and rate-limited. A client that floods the chat loses typed input for the session. Voice and the form keep working.

## Changing the interview without an app release

The questions aren't hard-coded. Admins can edit the wording, add follow-up hints, reorder, switch questions off, or add their own from the admin panel, and the worker loads them per session. Passport fields a family has hidden are skipped automatically, and mandatory ones are always asked.

New behaviour arrives the same way. When we introduced structured preferences (pick-from-a-catalogue answers instead of free text), the backend started sending a per-session mode setting. **An absent value means the old mode**, so a newer worker behind an older backend behaves exactly as before. Making the default the old behaviour is what lets two independently deployed services change in any order.

## What I'd reuse

*   **Put the LLM on the read side.** Let it propose; let a human or deterministic code decide; re-check its rules on the server. Your worst case becomes a draft nobody saves.
*   **Split talking from writing.** A conversational model with no tools, plus a silent extractor whose output is validated, is easier to reason about than one agent that does both.
*   **Order async results by sequence number, not arrival time.** It fixes out-of-order drafts and makes retries idempotent at once.
*   **Score evals by failure direction.** An invented allergy and a missed nuance are not the same kind of wrong.
*   **Cost the whole pipeline before choosing the model.** In voice, speech dominates, so buy LLM quality.
*   **Design the degraded modes up front**, and treat permanent errors differently from transient ones.

The same pattern could go further than forms. A voice that listens well could become a private place for a parent to talk through caring for their child, with a human expert one tap away when real advice is needed. The rule would stay the same: the model listens and proposes; people decide.

---

*Stack: Flutter, FastAPI, Postgres, LiveKit Agents, ElevenLabs, Gemini, Amazon Bedrock, AWS ECS Fargate. Prices are public list prices as of November 2026.*

## More from Building FamCare

- [A Care Marketplace on One Boring Backend](/blog/famcare-system-design): the system design behind the whole platform.
- [Honest Slots, Priced Idle Time](/blog/famcare-slots-and-pricing): one eligibility rule, 270 YAML scenarios, price drops and flash sales.
- [A Golden Image for Every Screen](/blog/famcare-golden-screens): every customer-app screen rendered and diffed in CI.
- [Shipping a Flutter App Without the App Store](/blog/famcare-flutter-ota): Shorebird patches, refused diffs, picking the branch, and CI costs.
- [Who Owns This Alert?](/blog/famcare-alert-ownership): business-invariant monitoring that tags the engineer who owns the area.
- [Live Captions for Support Calls, Without a New Service](/blog/famcare-live-call-captions): support-call audio to realtime speech-to-text in the admin panel.
- [The Demand We Couldn't Serve](/blog/famcare-unserved-demand): measuring families who saw no free slot and left.
- [CRM as an API](/blog/famcare-crm-as-api): coupons, free minutes and support calls from CleverTap journeys, rules kept in the backend.
- [All case studies](/case-studies)
