# Matching Riders in Real Time over WebSockets

*By Harshit Agarwal*

A student with a scooter is about to leave the hostel gate. Another student wants to get to the library, which is on the way. The app has a few seconds to notice, propose the pair, let both sides agree, and then show the co-pilot a moving dot as the pilot approaches. Two things must never happen along the way: one pilot promised to two people, and one slow phone freezing the live view for everyone else. This post is about how the Go backend of Kurukuru does live matching, scheduled matching for repeat commutes, and the WebSocket hub that streams a trip, and about the concurrency bugs each of them taught me.

Kurukuru is a gamified, college-first, peer-to-peer ride-sharing app I built at CosQ. A **pilot** is already going somewhere with a free seat; a **co-pilot** needs a ride and pays the pilot in in-app coins. The co-pilot gets on at a **Kuru in** point and off at a **Kuru out** point along the pilot's route. The backend is a single Go service on Postgres with PostGIS ([the architecture post](/blog/kurukuru-architecture) covers the rest of it).

## Three speeds of "real time"

"Real time" turned out to mean three different things, and each got a different transport:

| What | Latency it needs | Transport |
|---|---|---|
| The pilot's position during a trip | a few seconds, both directions | WebSocket per trip |
| "Has anyone matched my ride yet?" | a couple of seconds, one question | HTTP polling every 2 s |
| Suggestions for next week's commute | minutes | background matcher plus a queue the app reads |

The temptation is to push everything over the socket. I didn't, because a match is a decision that must survive a closed app, a network change or a server restart. A poll against the database always returns the truth; a missed push silently doesn't. So the socket only carries data that is fine to lose: positions superseded three seconds later.

## The geometry of a good match

Before any concurrency, the matching rule itself. Both riders submit a plan: start, destination and departure time. The question is whether the co-pilot's trip fits *along* the pilot's.

<figure>
  <div class="diagram">
    <div class="node muted-node">Pilot start</div>
    <span class="arrow">→</span>
    <div class="node accent">Kuru in<br>co-pilot's start,<br>projected on the route</div>
    <span class="arrow">→</span>
    <div class="node accent">Kuru out<br>co-pilot's destination,<br>projected on the route</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Pilot destination</div>
  </div>
  <figcaption><b>Fig. 1</b> — a match. Both of the co-pilot's points are projected onto the pilot's route; the projections become the pickup and drop-off.</figcaption>
</figure>

The evaluation is a pure function with no database access:

1. **Time.** The two departure times must be within 20 minutes of each other.
2. **Distance off route.** Project the co-pilot's start and destination onto the pilot's route segment. Each must lie within 600 m of it, or the pilot would make a real detour.
3. **Direction.** The drop-off projection must come *after* the pickup along the route. A co-pilot going the opposite way can sit perfectly close to the line and still be a terrible match.
4. **Worth it.** The shared stretch between pickup and drop-off must be at least 250 m.

Projection uses a local flat approximation around the pilot's start (metres per degree of longitude scaled by the cosine of the latitude), which is plenty accurate at campus distances and far cheaper than spherical geometry. Each candidate also gets pickup and drop-off times from an average campus speed of about 21 km/h, a detour estimate and a fare from the shared distance. The score adds the two off-route distances to ten points per minute of departure gap; lower is better.

```go
t1, d1, in := projectOnSegment(pilot.From, pilot.To, copilot.From)
t2, d2, out := projectOnSegment(pilot.From, pilot.To, copilot.To)
if d1 > maxOffRouteM || d2 > maxOffRouteM {
	return Candidate{}, false
}
if t2 <= t1 { // co-pilot is travelling against the pilot's direction
	return Candidate{}, false
}
```

Keeping this pure paid off twice: it is unit-tested without a database, and the scheduled matcher later reused it unchanged.

> [!NOTE]
> **The route is a straight line for matching, roads for display.** Matching treats the pilot's route as the segment from start to destination. The screens show real road paths from a self-hosted OSRM routing server. Running a road route for every candidate pair would put a network call inside the matching loop; on a compact campus the straight line is a good enough filter, and the 600 m tolerance absorbs the difference.

## Live matching: one lock, one decision

When a co-pilot opens the matching screen, the app polls `GET /api/rides/{id}/match` every two seconds. If no live match exists, the handler tries to make one:

1. Begin a transaction and take a **transaction-scoped advisory lock**: `SELECT pg_advisory_xact_lock(hashtext('kurukuru-matching'))`.
2. Load up to 200 open plans of the opposite role that are in the same college pool, not blocked by either side, not already in a live match, and never paired with this ride before.
3. Evaluate each in Go and keep the best.
4. Insert a `proposed` match and commit, which releases the lock.

An advisory lock is a named mutex inside Postgres. It isn't tied to any row, and the `xact` variant releases itself when the transaction ends, so a crashed request can never leave it held. Serialising all live matching behind one lock is blunt, and that is the point: without it, two co-pilots searching at the same moment both see the same free pilot, both evaluate it as their best option, and both insert a match. Row locks can't prevent this because the conflict is over the *absence* of a match row. A global lock turns "check, then insert" into one atomic step.

> [!NOTE]
> **The cost: matching is single-file.** Every search waits for the one before it. Each search is one indexed query plus some arithmetic over at most 200 rows, so the critical section is milliseconds. On a campus that's fine; on a city I'd shard the lock by area or cohort instead of dropping it.

A proposal is not a ride. The pilot must accept and the co-pilot must confirm, in either order. The respond endpoint locks the match row with `SELECT ... FOR UPDATE`, records one side's answer, and when both flags are true, creates the trip and marks both plans matched in the same transaction. Each action is allowed only for the right role (a co-pilot can't "accept" on the pilot's behalf), and responding to a match that is already settled just returns its current state, so a double tap is harmless.

<figure>
  <div class="screenshot-container">
    <img src="/assets/cosq/screens/kk-match-offer.webp" alt="Matching screen showing a pilot found, the pilot's level and rating, the fare in coins, and Kuru in and Kuru out times with cancel and confirm buttons" />
  </div>
  <figcaption><b>In the app</b> — a proposed match from the co-pilot's side, rendered from test data: who the pilot is, the fare, and where and when Kuru in and Kuru out happen.</figcaption>
</figure>

### The other path: nearest available pilot

An older flow skips plans: a pilot toggles "available", storing their position as a PostGIS `geography` point, and a co-pilot asks for the closest one within a radius.

```sql
SELECT u.id FROM users u JOIN user_cohort uc ON uc.user_id = u.id
WHERE u.is_available AND u.id <> $1
  AND uc.college_id IS NOT DISTINCT FROM $5
  AND ST_DWithin(u.last_location, ST_MakePoint($2, $3)::geography, $4)
ORDER BY ST_Distance(u.last_location, ST_MakePoint($2, $3)::geography)
LIMIT 1
```

With `geography`, distances are in metres on the real Earth, and `ST_DWithin` uses a GiST index, so only pilots inside the radius are sorted.

## The WebSocket hub, and the bug that could crash the server

Once a trip starts, the pilot's phone sends its position, heading and id over a WebSocket every three seconds, and the server fans each message out to everyone subscribed to that trip. The server also pushes system events into the same channel: "trip started", "trip finished", and "pioneer" events when someone uncovers a never-seen part of the map.

The first hub was the version you write in an afternoon: a map from trip id to a slice of connections behind a read-write mutex, and a `Broadcast` that looped over the slice calling `conn.WriteMessage`. It worked in testing. It had two serious problems.

**Concurrent writers.** gorilla/websocket supports exactly one concurrent writer per connection. `Broadcast` ran on whichever goroutine called it: the reader goroutine of each subscribed client, plus HTTP handlers pushing system events. Two clients sending at the same instant meant two goroutines writing to the same connection, and the library detects that and panics. An unrecovered panic in a goroutine takes down the whole process, so every trip, every request and every user would go with it.

**One slow phone stalls everyone.** `Broadcast` held the hub's read lock while writing. A phone that stopped reading (in a tunnel, backgrounded, on a dying network) made its write block, the read lock stayed held, and every join, leave and broadcast for *every* trip queued up behind it.

The fix is the standard pattern for socket servers, and it is worth knowing by heart:

<figure>
  <div class="diagram">
    <div class="node muted-node">Any goroutine<br>calls Broadcast</div>
    <span class="arrow">→</span>
    <div class="node">non-blocking send into<br>each client's queue (32)</div>
    <span class="arrow">→</span>
    <div class="node accent">one writer goroutine<br>per connection</div>
    <span class="arrow">→</span>
    <div class="node muted-node">socket<br>10 s write deadline</div>
  </div>
  <figcaption><b>Fig. 2</b> — the hub after the fix. Broadcast never touches a socket; it only queues. A full queue means the client is too slow, and it is disconnected.</figcaption>
</figure>

```go
func (h *Hub) Broadcast(tripID string, payload []byte) {
	h.RLock()
	clients := h.tripSubscriptions[tripID]
	msg := append([]byte(nil), payload...) // one copy, shared by every queue
	var slow []*client
	for c := range clients {
		select {
		case c.send <- msg:
		default:
			slow = append(slow, c)
		}
	}
	h.RUnlock()
	for _, c := range slow {
		c.close() // its reader then fails and removes it from the hub
	}
}
```

- **One writer per connection.** Each client gets a `writePump` goroutine that is the only code allowed to write to its socket. It also sends the keepalive pings, so pings can't race with data either.
- **Bounded queues, never blocking.** `Broadcast` does a non-blocking send into each client's 32-message channel. If the channel is full, that client is closed rather than waited on. The hub lock is held only for in-memory work.
- **Close exactly once, from anywhere.** Closing is wrapped in `sync.Once`, closes a `done` channel and the socket, which unblocks both the reader and any write stuck in the writer. The `send` channel is deliberately never closed, because a broadcast may still be sending to it; closing it would turn a race into a panic.
- **Liveness and limits.** Pings every 50 seconds, a 60-second read deadline extended by each pong or message, a 10-second write deadline, and a 64 KB read limit (a GPS message is a few hundred bytes).
- **No leaks.** When a trip's last client leaves, its entry is deleted from the map.

Tests reproduce both failures under Go's race detector (four clients each sending 200 messages at once, and a subscriber that never reads), and a benchmark showed delivery latency unchanged.

## Scheduled matching: a queue inside Postgres

Live matching only works while both people are staring at their phones. Commuters want something else: "I go from the hostel to the library at nine, Monday, Wednesday and Friday, for the next four weeks; find me someone." That became scheduled matching, designed in a short spec before any code.

The data model reuses as much as possible. A **series** holds the route and repeat pattern; each dated occurrence is an ordinary ride row linked to it. Proposals between series live in their own table, so the live flow is untouched. When both people accept, the backend creates one normal confirmed match and one trip **per shared day**, so chat, ratings and trip screens work without knowing scheduling exists.

Two series are compatible when they share at least one calendar day and **every** shared day passes the same `evaluate` function from live matching. "Same day" is computed in India Standard Time with a fixed zone, so the answer doesn't depend on the server's clock settings or on time-zone data being installed in the container.

<figure>
  <div class="diagram">
    <div class="node muted-node">Create or edit series<br>+ insert job, same transaction</div>
    <span class="arrow">→</span>
    <div class="node">match_jobs table</div>
    <span class="arrow">→</span>
    <div class="node accent">matcher goroutine<br>claims with<br>FOR UPDATE SKIP LOCKED</div>
    <span class="arrow">→</span>
    <div class="node">up to 5 suggestions<br>per series</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">Sweep every 3 min</div>
    <span class="arrow">→</span>
    <div class="node">retire dead series,<br>expire stale suggestions</div>
    <span class="arrow">→</span>
    <div class="node">re-enqueue open series<br>with room in their queue</div>
  </div>
  <figcaption><b>Fig. 3</b> — the scheduled matcher. Events produce jobs; a periodic sweep is the safety net for anything an event missed.</figcaption>
</figure>

### SKIP LOCKED as a job queue

The producer side is trivial: creating a series inserts its rides and a job row in one transaction, so a series can never exist without a job. The consumer is a goroutine started from `main` that polls every two seconds and claims the oldest ready job:

```sql
UPDATE match_jobs SET claimed_at = now()
WHERE series_id = (
    SELECT series_id FROM match_jobs
    WHERE run_after <= now()
      AND (claimed_at IS NULL OR claimed_at < now() - interval '5 minutes')
    ORDER BY run_after LIMIT 1
    FOR UPDATE SKIP LOCKED)
RETURNING series_id
```

`FOR UPDATE SKIP LOCKED` makes a worker skip rows another transaction has locked instead of waiting for them, which is exactly the semantics of a work queue. Several Honbu instances can run the matcher at once and never process the same job twice. A claim older than five minutes is treated as a crashed worker's and becomes claimable again. Re-enqueueing a series clears its claim, and a finished job is deleted only if it is still claimed, so an edit that arrives mid-processing isn't lost.

Each run fills the series' queue up to five suggestions and also offers itself to the other series' queues. The cap is enforced **inside the insert statement**, not in Go:

```sql
INSERT INTO series_matches (pilot_series_id, copilot_series_id, score)
SELECT $1, $2, $3
WHERE (SELECT count(*) FROM series_matches WHERE state = 'proposed'
        AND (pilot_series_id = $1 OR copilot_series_id = $1)) < 5
  AND (SELECT count(*) FROM series_matches WHERE state = 'proposed'
        AND (pilot_series_id = $2 OR copilot_series_id = $2)) < 5
ON CONFLICT (pilot_series_id, copilot_series_id) DO NOTHING
```

A check in Go followed by an insert is a race between two workers; a guard inside the statement narrows that window to almost nothing. The unique pair constraint also makes rejection permanent: a rejected suggestion keeps its row, so the pair is never suggested again.

<figure>
  <div class="screenshot-container">
    <img src="/assets/cosq/screens/kk-suggestions-queue.webp" alt="Suggestions screen listing two riders who want to share a repeating ride, with the shared dates, coins earned over four rides, and accept and reject buttons" />
  </div>
  <figcaption><b>In the app</b> — a pilot's suggestion queue for a repeating ride, rendered from test data. "They said yes" means the other side has already accepted; one more tap confirms all four days.</figcaption>
</figure>

### Accepting: where the races live

Accepting is the most concurrent operation in the system. Two people might accept different suggestions for the same series at once; the other side might skip a date or cancel while you tap. The accept transaction:

1. Locks **both series rows, ordered by id**. Every accept takes these locks in the same global order, so two accepts touching the same pair of series queue up instead of deadlocking.
2. Locks and re-reads the suggestion. If it is no longer `proposed`, or either series is no longer open, or the riders have blocked each other since, it is marked expired and the caller gets 409.
3. Records this side's accept. If the other side hasn't accepted yet, commit and stop.
4. If both have accepted, reload the dated rides (some may have been skipped since the suggestion was made) and re-run the pairing. For each shared day, create the confirmed match and trip and flip both rides from open to matched.
5. Mark the suggestion confirmed, supersede every other proposal touching either series, and mark both series matched.

Two guards catch the races the locks don't:

- **A partial unique index** allows at most one confirmed suggestion per series (`... WHERE state = 'confirmed'`). If a concurrent accept confirmed one of these series first, the update fails with a unique violation, which the handler maps to 409 rather than a 500. The database settles the race; the code just reports the verdict.
- **A row count on the ride update.** Each day's rides are flipped with `WHERE status = 'open'`, and the code requires exactly two rows to change. A concurrent "skip this date" that canceled one of them leaves only one row, and the whole accept rolls back. An earlier version happily overwrote a just-skipped date back to matched.

## Failing softly

A background goroutine inside a web server is a liability if it can crash the process. Every unit of matcher work runs inside a small `safely` wrapper that recovers panics and logs them, so one malformed series costs one log line, not the server.

The sweep also turned out to need a garbage collector. A series whose every remaining date had passed (or was within the 30-minute matching cutoff) stayed open forever, showing "nothing ahead" in the app and being re-examined every three minutes. The sweep now retires such series, cancels their leftover dates and drops their queued job, reusing the existing `canceled` status so nothing new needed a schema change.

Routing degrades the same way: a three-second timeout, a 24-hour in-memory cache of up to 2,000 routes, and a straight line when the routing server is down. A routing outage changes how a line is drawn, never whether a ride happens.

## What I'd reuse

- **Match the transport to the consequence.** Decisions go through the database and can be polled; disposable streams like GPS go over the socket.
- **Keep the matching rule a pure function.** It's easy to test, and the second matcher reused it unchanged.
- **When the conflict is over a row that doesn't exist yet, take an advisory lock.** It's the simplest correct answer to "check, then insert".
- **One writer per WebSocket, bounded queues, drop the slow.** Never write to a socket from a broadcast loop, and never hold a shared lock across network I/O.
- **Postgres is a fine job queue.** `FOR UPDATE SKIP LOCKED`, a stale-claim timeout and a periodic sweep go a long way before you need a broker.
- **Let constraints settle races.** Partial unique indexes and "exactly N rows changed" checks catch what careful locking misses.

---

*Stack in this post: Go (net/http, gorilla/websocket, lib/pq), PostgreSQL with PostGIS, OSRM, Flutter. Figures come from the backend's code, its scheduled-matching spec and plan, and its history, March to November 2026.*

## More from Building at CosQ

- [Kurukuru: A Ride-Sharing Game on One Go Binary](/blog/kurukuru-architecture): the architecture of a college ride-sharing game in one Go monolith.
- [Fog of War on a Real Map with PostGIS](/blog/kurukuru-fog-of-war): turning GPS trails into an explorable, game-like map.
- [Turning a Real Map into a Pixel World](/blog/kurukuru-pixel-map-app): the Kurukuru app's map, 3D world and pixel UI in Flutter.
- [Quest Books, an In-App Editor and Road Watch](/blog/kurukuru-quests-and-road-watch): game content you can edit in the app, and road safety reports.
- [Everything Else I Built at CosQ](/blog/cosq-ecosystem): WHAM! OTT, MemoChan, PreviouslyOn, Gothicco and more.
