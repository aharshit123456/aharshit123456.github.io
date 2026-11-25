# Everything Else I Built at CosQ

*By Harshit Agarwal*

Some companies have one product and a roadmap. Others have a pop culture festival, a streaming site, a meeting scribe, a gothic pet app, a satirical runner game and a ride-sharing app, all sharing one small tech team. When every idea gets a few weeks and a domain, the interesting engineering question changes from "how do we scale this?" to "which patterns keep a dozen small bets alive at once?" This post walks through them, one idea per project.

CosQ (cosq.in) is a pop culture studio from Bhubaneswar, Odisha. Its anchor is an open ground pop culture event (cosplay, LAN gaming, art and manga contests, thirteen "stages" on one ground). Around it sits the CosQ Ecosystem, "a collection of ventures, projects and personal passions", most of them software. I lead full-stack and AI product work, which in practice means I build or start most of the code.

| Project | What it is | Stack |
|---|---|---|
| cosq.in | Event site and ecosystem hub | React, SVG, plain JS |
| WHAM! | Comic-styled streaming site | React + Capacitor, FastAPI |
| PreviouslyOn | TV tracker with an AI recommender | Next.js, Supabase, Gemini |
| MemoChan | Meeting recorder and transcriber | Chrome extension, faster-whisper, pyannote |
| Gothicco | Gothic pet-and-feed social app | FastAPI, Postgres, Groq, Next.js admin |
| Tea & Tab | Freelancers flag clients who don't pay | React, Go |
| Bhaag Cockroach Bhaag | Satirical endless runner | Canvas, then Three.js |
| huzz, Court of Sinners | A terminal dashboard and a Unity prototype | Python, C# |

## The flagship gets its own series

The largest thing I built at CosQ is **Kurukuru**, a gamified ride-sharing app for college students: one Go backend, one Flutter app, live ride matching, a fog-of-war map you uncover by travelling, quests and a pixel-art world. It has its own posts, starting with [the architecture](/blog/kurukuru-architecture), then [real-time matching over WebSockets](/blog/kurukuru-realtime-matching), [fog of war with PostGIS](/blog/kurukuru-fog-of-war), [the pixel-art map app](/blog/kurukuru-pixel-map-app) and [quests, the quest editor and Road Watch](/blog/kurukuru-quests-and-road-watch). Everything below is the rest.

## A website that draws its own thread

I first built the event site in 2024 as a simple React page, then rebuilt it this year around a small design system and one centrepiece: a sub-events page where a stitched thread runs down the screen, zig-zagging between the thirteen stages, with a needle riding the tip of the thread as you scroll.

The thread is a single SVG path made of cubic Béziers. Stage nodes alternate between 25% and 75% of the width (a narrow gutter on phones). The hard part is the scroll mapping. I want the thread drawn down to 60% of the viewport height. But SVG paths are parameterised by length, not by `y`. There is no built-in "what length along this curve reaches height 700?"

The answer is a binary search. `getPointAtLength` is cheap, and because the thread always moves downward, `y` grows monotonically with length:

```js
const L = p.getTotalLength();
let lo = 0, hi = L;
for (let k = 0; k < 24; k++) {
  const mid = (lo + hi) / 2;
  if (p.getPointAtLength(mid).y < ty) lo = mid; else hi = mid;
}
const pt = p.getPointAtLength(lo);
p.style.strokeDasharray = `${lo} 100000`;   // draw the path up to lo
needle.style.transform = `translate(${pt.x}px,${pt.y}px)`;
```

Twenty-four halvings pin the length to within one sixteen-millionth of the path, far below a pixel. The dash-array trick then "draws" exactly that much of the path, and the stage counter is just the number of nodes above the needle.

The other idea worth stealing is tiny. Long headlines that look fine on a laptop wrap into five ugly lines on a phone. Instead of shrinking the font, a `Fit` component renders both a full and a paraphrased version, and CSS shows one per breakpoint: "Odisha's First Open Ground Pop Culture Event" on desktop, "Odisha's First Pop Culture Fest" on a phone. The cost is two strings to maintain per headline, which is a fair trade for copy that reads well everywhere.

The same repo also holds CosQ Builds, the studio's services page, as a static site with no build step. Its hero is a tiny runner game drawn at a quarter of CSS resolution and scaled up, so the pixels are chunky on purpose and cost almost nothing to draw.

## WHAM!: two players and a database that can fall over

WHAM! is CosQ's streaming venture, styled as a "Living Comic Book" (comic borders, a "pull list" instead of a watchlist). It's React with Vite, wrapped with Capacitor for Android, over a FastAPI and Supabase backend. Its video client has [its own write-up](/case-studies), so here are just two ideas.

**Two players behind one page.** Titles CosQ hosts itself play through FastPix's HLS player, a web component given a playback ID. Catalogue titles identified only by a TMDB ID play in an embedded third-party player inside an iframe. The page picks one per title, and a user setting can switch the embed off. The embed reports playback progress with `window.postMessage`, and the receiving side shows the one rule that matters for cross-origin messaging: check `event.origin` first, and drop anything that isn't from the player's exact origin. Any page can post a message to your window; the origin check is the only thing that turns "a message" into "a message from the player".

**A database that is allowed to be down.** At startup the backend tries Postgres with a three-second connect timeout and a `SELECT 1`. If that fails, it switches to a local SQLite file, creates the tables from the same SQLAlchemy models, and every CRUD and auth function branches on one `IS_FALLBACK` flag. A laptop on bad venue Wi-Fi still boots a working API. The trade-off is that the decision happens once, at import time. If Postgres comes back, the process keeps writing to SQLite until restart, and nothing syncs the fallback data back. That is acceptable for demos and wrong for production, so the fallback logs loudly at boot.

## PreviouslyOn: let the model choose, let the catalogue answer

PreviouslyOn is a TV tracker: lists, episode progress, reviews, follows and an activity feed, built on Next.js and Supabase, with TMDB as the source of show data. Its AI assistant takes a free-text request (say, "something like Severance but warmer") and returns recommendations.

The design choice I'd reuse: the language model never produces anything the user sees as data. The prompt gives Gemini (a Flash-Lite model in JSON mode) the user's bio, up to three of their lists with show names, and the query, and asks for exactly two keys: a short conversational `response`, and `codes`, an array of TMDB show IDs. The app then fetches those IDs from TMDB and renders real posters, titles and air dates.

<figure>
  <div class="diagram">
    <div class="node muted-node">Bio + 3 lists<br>+ query</div>
    <span class="arrow">→</span>
    <div class="node">Gemini, JSON mode<br>{response, codes}</div>
    <span class="arrow">→</span>
    <div class="node accent">TMDB lookup<br>by ID</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Cards from<br>real metadata</div>
  </div>
  <figcaption><b>Fig. 1</b> — the model only picks IDs; every title, poster and date on screen comes from the catalogue.</figcaption>
</figure>

The model is good at taste and bad at facts; the catalogue is the opposite. The surprise is where it still breaks: a model can return a perfectly valid ID for the wrong show. The lookup then succeeds and renders a confident card for something the model didn't mean. A valid ID is not the same as the right show; a cheap check is to compare the looked-up title with names in the model's reply. And even in JSON mode the code still strips stray Markdown fences before parsing, because "JSON mode" is a strong hint, not a guarantee.

One smaller pattern: marking an episode watched is an insert guarded by a unique `(user_id, episode_id)` constraint, and a duplicate-key error comes back as "already watched", so double taps are harmless.

## MemoChan: record in the browser, transcribe on a GPU

MemoChan is a meeting scribe: a Chrome extension records a meeting tab, and a Python backend transcribes it with speaker labels.

The browser half is a lesson in Manifest V3. A service worker can't hold a media stream, so the recording lives in an **offscreen document**, a hidden page the extension creates just for this. It captures the tab's audio with a tab-capture stream ID and the microphone with `getUserMedia`, then mixes both through the Web Audio API into one `MediaStreamDestination` and records that as WebM. One line looks odd until you need it: the tab source is also connected back to the speakers, because capturing a tab silences it, and without that loopback you can no longer hear your own meeting.

<figure>
  <div class="diagram">
    <div class="node muted-node">Tab audio<br>+ mic</div>
    <span class="arrow">→</span>
    <div class="node">Offscreen doc<br>Web Audio mix → WebM</div>
    <span class="arrow">→</span>
    <div class="node">ffmpeg<br>16 kHz mono WAV</div>
    <span class="arrow">→</span>
    <div class="node accent">faster-whisper<br>+ pyannote 3.1</div>
    <span class="arrow">→</span>
    <div class="node muted-node">[start → end] [SPEAKER]: text</div>
  </div>
  <figcaption><b>Fig. 2</b> — MemoChan's pipeline, the same in the local watcher and the serverless worker.</figcaption>
</figure>

The backend comes in two shapes over the same pipeline. The local one watches the Downloads folder for new recordings and runs on the machine's own GPU; on a 6 GB consumer card it uses Whisper `medium` in `int8_float16`, falling back to CPU `int8`. The serverless one is a RunPod worker in a CUDA PyTorch image that takes an audio URL and returns JSON segments, using `large-v3` in `float16`. Both load models at module scope, so a warm worker keeps them in VRAM between jobs.

Both convert WebM to 16 kHz mono WAV with ffmpeg first, which avoids a class of decoder problems with Opus in WebM, then run Whisper with word timestamps and pyannote's diarization pipeline. Joining the two is the interesting bit, because they disagree about time: Whisper produces text segments, pyannote produces speaker turns, and their boundaries never line up. MemoChan takes the midpoint of each text segment and assigns whichever speaker turn contains it.

```python
mid_point = (segment.start + segment.end) / 2
for entry in speaker_map:
    if entry["start"] <= mid_point <= entry["end"]:
        current_speaker = entry["speaker"]
        break
```

It's simple and right most of the time. It fails where meetings are hardest: when two people overlap, or a segment straddles a turn change, the whole sentence goes to one speaker. Assigning speakers per word, from the word timestamps already computed, would fix it. The other irony is upstream: mixing tab and mic into one channel throws away the cleanest speaker signal there is. Kept as two channels, "the mic is me" would come for free.

## Gothicco: one monolith, a schema per venture

Gothicco is a gothic, meme-heavy social app built around a virtual pet: a horned panda called Bambino with moods ("rotmaxxed", "vampire", "possessed"), an attachment level that grows as you interact, a feed called the Cursed Stream, quests, XP and achievements.

<figure>
  <img src="/assets/cosq/ecosystem/gothicco-den.webp" alt="Gothicco's pet screen: a horned panda with a speech bubble reading 'my horns are load-bearing.' and expression buttons" style="width:100%; max-width:360px; display:block; margin:0 auto; border-radius: 6px;" />
  <figcaption><b>Fig. 3</b> — Bambino's Den, the pet screen, from the app's landing page.</figcaption>
</figure>

Its backend is the first tenant of something meant to outlive it: a single FastAPI app, `cosq_core`, that mounts each venture as a sub-application under its own prefix (`/api/gothicco`, with room for more). Each venture keeps its tables in its own Postgres schema and its own Alembic migration history. It sits between a service per app (a dozen deploys and auth stacks) and one shared schema (unrelated products' tables tangled together): one deploy, shared auth, and a venture can be split out by moving one schema.

The interesting engineering is the cold start. A social feed with no posts is dead on arrival, so the app has **persona accounts**: bot profiles with a handle, a personality type and a few lines of lore, stored in their own table and attached to posts and comments through separate `fake_author_id` and `is_bot_comment` fields, so a synthetic row can never be confused with a real one. An admin app (Next.js) lets staff generate posts in a persona's voice with Llama 3.1 8B on Groq, at a deliberately high temperature, or simulate a comment thread: the model gets a block of posts and a roster of bots and returns `{post_id, bot_id, content}` triples.

Two lessons. Never trust IDs a model hands back: every simulated comment is checked against the roster that was sent, and an unknown bot, malformed post UUID or empty text is skipped. And JSON mode returns an *object*, so asking for an array gets `{"posts": [...]}` or `{"comments": [...]}` depending on the model's mood; the parser unwraps whichever key arrives. The broader trade-off is honesty: synthetic activity is a bootstrapping tool, and keeping every bot row distinguishable in the schema is what makes it possible to label it, filter it or delete it once real users arrive.

## Tea & Tab: designing for the legal risk first

Tea & Tab lets freelancers flag clients who don't pay, check a client before signing, and discuss it under pseudonyms. It's India-first. The product is simple; the risk isn't, because it publishes claims about businesses. Most of the design is about that.

The React frontend has its own accounts, and its backend reuses the Kurukuru Go service. The app also runs entirely on built-in seed data: an API failure, a four-second timeout or a missing sign-in is ignored and the UI carries on, so the whole flow could be designed before a single route existed.

The idea I like most is how it handles **client phone numbers**, often the only stable identifier a freelancer has, and exactly what you don't want to leak. So numbers are normalised to ten digits and stored only as an HMAC-SHA256 under a server-side secret (a "pepper"). No route ever returns a number, but searching a full number finds the client it belongs to, rate-limited to 20 lookups an hour.

Why HMAC and not a plain hash? Ten-digit mobile numbers are a space of at most ten billion values. A plain SHA-256 of each can be reversed by brute force on one GPU in short order. With a secret key in the hash, a stolen table is useless without the key. The trade-off is operational: the pepper can never change casually, because rotating it orphans every stored hash.

The rest is guardrails expressed as rules. Clients are matched by GST number when there is one, else by normalised name, and a later flag can fill blank fields but never overwrite them. A separate "from around the web" list holds links to public threads, each added by a person, labelled UNVERIFIED, summarised neutrally in attributed language ("a freelancer says..."), and hidden instantly when anyone files a removal request. Court judgments can appear too, only against organisations, after a keyword classifier pre-sorts candidates; a person still reads every judgment.

## Bhaag Cockroach Bhaag: a game you can unit-test

Bhaag Cockroach Bhaag is a satirical, mobile-first endless runner: a cockroach in a red cape runs down a Delhi street from a lathi-wielding constable, riding ramps onto bus roofs and grabbing chai. It started on a 2D canvas and was rebuilt in Three.js.

The architecture choice that paid for itself: **all game rules are pure modules**. Height lookups on roofs and ramps, collision outcomes (stumble, side bump, landing, pickup), the player's jump and lane-switch rules, the spawner and the game tick are plain functions with no Three.js in them. The rendering layer only reads state. So `node --test` with a seeded RNG can check rules like "no switching onto a bus roof unless there's a roof or ramp at that depth".

The spawner is where that mattered most. An endless runner that occasionally generates an impossible row feels broken, not hard. So fairness is an invariant: every row has a reachable path, rows with roofs always offer a ramp or a ground lane, and the open lane moves at most one lane between rows, so it is always one swipe away. An early version spaced rows a fixed distance apart, so as the run sped up they arrived closer together in time than a thumb can react; the gap now scales with speed, which makes it a fixed amount of time instead.

Two web-platform lessons came along. With no build step, the game is served by a tiny Node server that answers only an allowlist of files, so `.git`, docs and tests are never exposed. And no build step means nobody versions your files for you. The server computes a build ID, from the deploy's commit or a hash of the game files, rewrites the import map so every module URL carries `?v=<build>`, and serves those versioned URLs with immutable caching. A small `version.json` lets a stale tab notice a new deploy and offer a hard refresh.

## Small tools

- **huzz** is a joke with a working core: a full-screen terminal dashboard (Rich) that tracks services in Gen-Z vocabulary ("aura" for health, "motion" for throughput, "cooked" for failure). The CloudWatch adapter maps CPU to aura as `100 - CPU%`. It's packaged for PyPI with a GitHub Actions workflow that uses trusted publishing (OIDC), so no API token sits in the repo.
- **Court of Sinners** is a Unity 2D prototype of a roguelike where you gather evidence, accuse townsfolk in a day court and fight in a night arena. A singleton time manager raises phase-change events, and systems subscribe instead of polling.
- **CosQ Labs** (labs.cosq.in), the creative wing's site, which I moved to Next.js and rebuilt on the CosQ design system; a teammate keeps its content current.

## What I'd tell another one-person tech team

- **Make every service degrade to something useful.** WHAM! boots on SQLite, Tea & Tab runs on seeds, the runner keeps procedural stand-ins when a model fails to load. Demos happen on bad Wi-Fi.
- **Let the model choose, let your data answer.** Ask an LLM for IDs, look them up, and validate every ID against what you sent. JSON mode reduces parsing failures; it doesn't remove them.
- **Hash small identifier spaces with a key.** Phone numbers, PINs and roll numbers are brute-forceable; HMAC with a stable secret is the minimum.
- **Keep rules pure and renderers dumb.** If game or business rules can run in `node --test` with a seeded RNG, you can test fairness instead of hoping for it.
- **One process, one schema per venture.** A mounted sub-app per product, each with its own Postgres schema, keeps deploys simple without tangling data.
- **When you skip the build step, own cache-busting and file exposure.** Version your module URLs and serve from an allowlist.

## More from Building at CosQ

- [Kurukuru: A Ride-Sharing Game on One Go Binary](/blog/kurukuru-architecture): the architecture of a college ride-sharing game in one Go monolith.
- [Matching Riders in Real Time over WebSockets](/blog/kurukuru-realtime-matching): live and scheduled ride matching over a Go WebSocket hub.
- [Fog of War on a Real Map with PostGIS](/blog/kurukuru-fog-of-war): turning GPS trails into an explorable, game-like map.
- [Turning a Real Map into a Pixel World](/blog/kurukuru-pixel-map-app): the Kurukuru app's map, 3D world and pixel UI in Flutter.
- [Quest Books, an In-App Editor and Road Watch](/blog/kurukuru-quests-and-road-watch): game content you can edit in the app, and road safety reports.
