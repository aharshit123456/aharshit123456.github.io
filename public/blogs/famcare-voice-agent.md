# A Voice Agent That Only Drafts

*By Harshit Agarwal*

At FamCare we now let parents talk for three minutes instead of filling in a form. The hard part was doing that without letting a language model write anything we can't take back. This post covers how we built it, what we chose not to build, and what broke along the way.

<div class="stat-row">
  <div class="stat"><div class="stat-num">~3 min</div><div class="stat-label">per interview, in English, Hindi or Hinglish</div></div>
  <div class="stat"><div class="stat-num">~₹9</div><div class="stat-label">per interview (about $0.10) at list prices</div></div>
  <div class="stat"><div class="stat-num">75%</div><div class="stat-label">of that cost is speech, not the LLM</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">new write paths into the child's record</div></div>
</div>

## The problem

FamCare sends trained caregivers into homes to look after babies and elders, booked by the hour from an app. The first visit to a new family is the hardest one. The caregiver doesn't yet know that this baby calms down when you hum, refuses food if you insist, and must not have egg.

That knowledge lives in the **Baby Passport**, a care profile the parent fills in and the caregiver reads before the visit. The fields that matter most are the ones parents skip. Open questions like *"what helps calm them down?"* don't get good answers when you're typing on a phone with one hand.

So we asked what would happen if the parent could just talk. A three-minute conversation, and the Passport fills itself in.

Four constraints shaped everything after that:

*   **Safety.** A caregiver acts on what the Passport says. A model that hears "maybe egg" and writes `allergy: egg`, or hears nothing and writes `no allergies`, has created a safety incident.
*   **Language.** Our parents mix English and Hindi mid-sentence. Their exact words (*"zabardasti mat karna"*, don't force her) are often the most useful thing a caregiver can read.
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

## The design

The parent taps *Start talking* in the app. Our backend opens a session, mints a room token and dispatches a voice worker into a LiveKit room. From then on, audio flows only between the phone, LiveKit and the worker. It never passes through our own servers.

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

Inside the worker is a classic speech *cascade*. Voice activity detection and a turn detector decide when the parent has finished speaking. A streaming speech-to-text model transcribes. An LLM decides what to say next, and a text-to-speech model says it.

| Stage | What we run |
|---|---|
| End of speech | Silero VAD + turn detector |
| Speech-to-text | ElevenLabs Scribe v2 |
| Interviewer LLM | Gemini |
| Text-to-speech | ElevenLabs Flash |
| Extractor LLM (silent) | transcript → draft fields |

We picked the cascade over a single speech-to-speech model because every stage can be swapped out and every stage has a fallback. The text between stages is also something we can redact, log the shape of, and test.

The data side is four steps:

1.  The app starts a session using the user's normal login.
2.  The backend returns a room token and does a named dispatch of the worker.
3.  The worker calls a small internal backend API, authenticated with a shared secret, to load the session's context and post turns and drafts.
4.  The backend hands the draft to the app. The parent reviews it, edits, and saves.

The backend also owns the feature flag, the admin-editable questions and the validation. The worker never writes to the Passport. It posts drafts, the parent reviews them, and the app saves through the same endpoint the manual form has always used.

## Five decisions that mattered

### Split the model that talks from the model that writes

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

The voice feature added zero new ways to change a child's profile.

The extractor follows rules in its prompt. The backend checks the same rules again on every draft, because a model can ignore its prompt:

*   Allergy and medical tags only come from the active list we send. Anything else goes to *needs review*, never to the nearest-looking tag.
*   Every field points at a real parent turn. No evidence, no field.
*   Phrases are kept verbatim, in the parent's language.
*   "She's about two" becomes an age. It never becomes an invented date of birth.
*   Allergies and outdoor permissions are always drafts. The parent confirms them on the next screen, every time.

The design we rejected was letting the agent fill the form with tool calls. It's the obvious LLM design, and it puts the model on the write path. A wrong tool call would be a wrong record that a caregiver might act on before anyone noticed.

### Let slow drafts lose

Extraction takes one to three seconds and runs after every turn, so drafts overlap. The draft for turn 3 can finish *after* the draft for turn 4. If the backend kept whatever arrived last, the parent would watch the form go backwards.

| Draft | Starts | Finishes | What the backend does |
|---|---|---|---|
| seq 3 | first | last (slow model response) | arrives late, 3 < 4, ignored |
| seq 4 | second | first (fast) | stored, 4 is the newest |

So the worker numbers every turn and every draft, and the backend keeps the highest draft number it has seen. Ordering is by sequence number, not arrival time. The same numbers make retries idempotent too: posting turn 7 twice stores it once. It's a few lines of code, and it removes a whole class of race conditions without locks, queues or cancellation logic.

### Pick the model with evals, and weigh safety failures above the score

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

That was the first screening run, one pass each. Cost is per whole interview, including speech.

Two readings mattered more than the totals. The first is **direction**. Nova Lite scored the same as Haiku, but its failure was guessing a tag that wasn't said. That's the unsafe direction, so it was out despite being the cheapest. The second is **shared failures**. Several models paraphrased the food phrase, which points at the prompt rather than any one model. So we fixed the prompt instead of shopping for a model.

The rule since then: every bug found in the wild becomes an eval case before it gets fixed. The suite has grown from 12 cases to over 100, across extraction, structured preferences and guardrails. Evals call real models, so they run before every prompt or model change rather than in CI. The unit tests need no network, and those do run in CI.

### Model the cost before building

A three-minute interview speaks about 1,100 characters and makes about 28 LLM calls. We costed it line by line from a real spike session and list prices before writing the production service.

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

The biggest lever is on the speech side. Pre-rendering the fixed greeting and goodbye once saves about 17%. Running the extractor on every other turn saves about 8%. At pilot scale, fixed infrastructure is most of the monthly bill. By ten thousand interviews a month it's about an eighth.

### Make failure quiet

The call depends on three outside AI providers at once. We assumed each one would fail, and decided what the parent would experience when it did:

*   **LLM:** a chain of models and keys, best first, then our second key, then optionally a different cloud (Bedrock). A model that answers "quota exhausted" is marked unavailable and skipped on later turns, so every turn doesn't wait on it. It gets probed again in the background.
*   **Speech:** a second speech vendor sits behind the first, for both STT and TTS.
*   **All speech down:** the call degrades to text. The agent's replies show up as chat and the parent can type. The app is told through participant attributes so it can show the right UI.
*   **Our own backend down:** the interview carries on and the manual form still works. Nothing is lost that the parent can't type.

> [!WARNING]
> **The bug that taught us this.** When a speech-to-text account ran out of credit, the framework did what it was designed to do. It recreated the failed stream every half second and closed the whole session after the fourth unrecoverable error. A billing problem would have hung up on the parent mid-sentence. We wrote the failing test first, then made the worker mark STT as down and stop the recreate loop, so typed answers and the agent's voice carry on.

## Privacy, built in from the start

**Deterministic redaction, no LLM.** Every turn that leaves the live call is redacted by code, not a model: phone numbers, emails, UPI handles, PAN numbers and links. It catches the forms people actually speak, like digits said in Hindi (*"nau aath saat…"*), "double nine", and "name at gmail dot com". Ages, times and prices stay intact.

**Safe against hostile input.** Input is capped, every pattern has bounded repetition, and the digit scan is linear, so a crafted message can't make the regexes hang. Redaction runs off the event loop with a timeout. If it ever times out, the turn becomes `[redacted]` rather than leaking.

**The agent knows less on purpose.** It isn't told the child's name or any identifier. It uses a name only if the parent says it.

**Nothing sensitive in logs.** Transcript text and tags are never logged. Logs carry stable tokens like `VOICE_DEGRADED stt` that drive alerts, with no content.

**Typed input is guarded.** Messages are cleaned, clipped and rate-limited. A client that floods the chat loses typed input for the session. Voice and the form keep working.

## Changing it without an app release

The questions aren't hard-coded. Admins can edit the wording, add follow-up hints, reorder, switch questions off, or add their own from the admin panel, and the worker loads them per session. Passport fields a family has hidden are skipped automatically, and mandatory ones are always asked.

New behaviour arrives the same way. When we introduced structured preferences (pick-from-a-catalogue answers instead of free text), the backend started sending a `preferences_mode` per session. **An absent value means the old mode**, so a newer worker behind an older backend behaves exactly as before. The whole feature ships behind a feature flag.

## What went wrong

*   **Shared quota.** The first spike borrowed an API key from our website chatbot, and the two competed for the same quota. Each service now has its own keys, plus a fallback key.
*   **Deploys can cut calls.** Fargate gives a stopping task at most two minutes, and a call can run longer. A deploy has to drain workers before replacing them. A plain restart isn't enough.
*   **"Verbatim" is hard.** Several models paraphrased the parent's phrase. It was a prompt problem, and we only saw it because the eval checked the phrase word for word.
*   **A small eval set is only a screen.** Twelve synthetic cases, one run each, can pass or fail a model by chance. We grew the set, and the next step is consented real transcripts.

## Results

We went from a spike to a feature-flagged build in under a week, and shipped it with the cost model, the evals and the fallbacks in place before the first parent used it. An interview takes about three minutes and costs about ₹9. The chosen model passed every screening case. The design guarantees that the agent can't change a child's record. The worst it can do is propose a draft the parent rejects.

> [!NOTE]
> The pattern I'd reuse anywhere: put the LLM on the read side of the system. Let it propose, have a human or deterministic code decide, and check its rules again on the server. You keep most of the magic, and your worst case becomes a draft nobody saves.

## What's next

*   Pre-render the fixed lines of speech. It's the single biggest cost cut.
*   Load-test how many concurrent calls one vCPU holds. It's the only large fixed cost and still an estimate.
*   Grow the evals from real transcripts, with consent, and run each case several times.
*   The same listening voice could become a private place for a parent to talk through caring for their child, with a human expert one tap away when real advice is needed.

---

*Stack: Flutter, FastAPI, Postgres, LiveKit Agents, ElevenLabs, Gemini, Amazon Bedrock, AWS ECS Fargate. Prices are public list prices as of November 2026.*
