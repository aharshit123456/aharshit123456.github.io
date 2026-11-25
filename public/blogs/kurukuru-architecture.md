# Kurukuru: A Ride-Sharing Game on One Go Binary

*By Harshit Agarwal*

Two students leave the same hostel gate every morning for the same library. One has a scooter and an empty back seat; the other is about to pay for an auto. A ride-sharing app could pair them, but on a campus the hard part is not the matching maths. It is trust (who is this person?), money (who pays whom, and how much?), and giving people a reason to open the app on a day they don't need a ride. This post is about the backend I built for that app: one Go binary that handles identity, trips, a coin wallet, live matching and a map game.

Kurukuru is a gamified, college-first, peer-to-peer ride-sharing app I lead at CosQ. A **pilot** is a student already going somewhere with a seat to share; a **co-pilot** needs a ride. The app finds a pilot whose route passes near the co-pilot, picks where the co-pilot gets on (**Kuru in**) and off (**Kuru out**), and the co-pilot pays the pilot in **KuruCoins**. Around that sits a pixel-art map of the real campus covered in fog that clears as you move, flags you can plant, quest books of places to find, and levels and badges. The backend, called Honbu, is mine end to end: every commit from the first one in March 2026 to the latest in November.

<div class="stat-row">
  <div class="stat"><div class="stat-num">1</div><div class="stat-label">Go binary serving the app, two staff tools and the map tiles</div></div>
  <div class="stat"><div class="stat-num">~12.6k</div><div class="stat-label">lines of Go, plus ~5.6k lines of Go tests</div></div>
  <div class="stat"><div class="stat-num">~21 MB</div><div class="stat-label">of baked map tiles embedded in the binary</div></div>
</div>

<figure>
  <div class="screenshot-container">
    <img src="/assets/cosq/screens/kk-onboarding-roles.webp" alt="Onboarding screen explaining the two roles, pilot and co-pilot, and the Kuru in and Kuru out stops" />
  </div>
  <figcaption><b>In the app</b> — the onboarding card that explains the vocabulary the whole backend is built around: pilot, co-pilot, Kuru in and Kuru out.</figcaption>
</figure>

## Why one binary

The usual advice for a product with this many moving parts is to split it: an auth service, a trips service, a payments service, a realtime gateway. I went the other way, for three reasons.

**One person, one deploy.** Every service you add is another thing to deploy, monitor, version and keep compatible. With a single developer, the cost of a service boundary is paid entirely in my evenings.

**The interesting operations cross domains.** Finishing a trip debits the co-pilot, credits the pilot, writes two ledger rows, marks the trip complete and grants experience points to both riders. Planting a flag inserts the flag, grants XP and coins, and writes a ledger row. In a monolith with one Postgres database, the money movement and state change in each of these is a single SQL transaction (the trip's XP follows in its own small one). Split across services, each becomes a saga with compensation logic, and a bug in it costs real (or at least virtual) money.

**Go makes a monolith cheap to keep tidy.** The standard library's `net/http` is enough; there is no web framework. Each domain is a package under `internal/` with a `RegisterHandlers(mux)` function, and `main.go` is little more than a list of those calls. Packages can only reach each other through exported functions, so the boundaries are real even though they share a process.

<figure>
  <div class="diagram">
    <div class="node muted-node">Flutter app<br>Supabase login</div>
    <span class="arrow">→</span>
    <div class="node accent">Honbu (Go)<br>one http.ServeMux,<br>~20 domain packages</div>
    <span class="arrow">→</span>
    <div class="node">Postgres + PostGIS<br>(managed, Supabase)</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">Staff web tools<br>quest editor, admin</div>
    <span class="arrow">→</span>
    <div class="node accent">same binary<br>separate staff logins</div>
    <span class="arrow">→</span>
    <div class="node">Routing service<br>(OSRM, private network)</div>
  </div>
  <figcaption><b>Fig. 1</b> — the whole system. The app talks only to Honbu; Supabase is used for sign-in and as the database, never as a data API from the app.</figcaption>
</figure>

| Package | What it owns |
|---|---|
| `auth`, `cohort`, `staffauth` | verifying app logins, deciding a user's matching pool, staff tool logins |
| `rides`, `trip`, `copilot`, `pilot` | ride plans, matching, the trip lifecycle, the live trip socket, pilot availability |
| `wallet`, `payments`, `progress` | coin pricing and ledger, coin top-ups and cash-out, XP, levels and badges |
| `exploration`, `voxel`, `routing` | fog of war and flags, baked map tiles, road paths |
| `quests`, `editor`, `roadwatch` | quest books, their collaborative editor, road problem reports |
| `features`, `admin`, `account`, `verification` | feature switches, staff panel with audit log, account deletion, pilot verification |

Shared plumbing lives in `pkg/`: the database pool and the WebSocket hub.

## A walled garden on top of someone else's login

The product promise was that you only ride with people from your own college. That makes identity the most security-sensitive part of the system, and I didn't want to own passwords or email verification. So sign-in is delegated to Supabase Auth (email with confirmation, or Google), and Honbu's job is to **verify** the token the app sends, not to issue it.

### Verifying someone else's tokens

A JSON Web Token is a signed claim: "this is user `sub`, valid until `exp`". The signature can be symmetric (HS256: both sides share a secret) or asymmetric (ES256: the issuer signs with a private key and publishes the public half as a **JWKS**, a JSON Web Key Set, at a well-known URL). Asymmetric is the better fit for a third-party issuer because the verifier never holds anything that can mint tokens.

Supabase signs access tokens with ES256, so Honbu's verifier looks at the token header, picks a key by its `kid` (key id) from a cached JWKS, and verifies. HS256 tokens are still accepted under a server-side secret, which is what the end-to-end test suite uses to impersonate users without a real login.

```go
token, err := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
	switch t.Method.Alg() {
	case "ES256":
		kid, _ := t.Header["kid"].(string)
		return jwksKey(kid) // cached; refetched at most every 30 s on an unknown kid
	case "HS256":
		return []byte(secret), nil
	}
	return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
}, jwt.WithValidMethods([]string{"ES256", "HS256"}))
```

Two details matter. `WithValidMethods` pins the algorithms, which closes the classic "alg: none" and algorithm-confusion attacks. And the JWKS cache refetches on an unknown `kid` (so key rotation just works) but at most once every 30 seconds, so a flood of tokens with random key ids can't turn Honbu into a request amplifier against the identity provider.

### The endpoint I deleted

The first version of Honbu did run its own `register` and `login` endpoints, minting its own HS256 tokens. Registration only checked that the email *string* ended with the college domain. It never proved the person owned that mailbox, so anyone could create an account for any student's address and receive a token Honbu fully trusted. The campus-only gate was a text filter.

The fix was to stop serving those routes entirely, and a test now asserts they stay unregistered. Identity comes only from the provider, which only issues a session after the mailbox is confirmed. Removing code was the security fix.

### Cohorts: the college is derived, never stored

Later the app opened to anyone with an email address, while keeping students of one college matched only with each other. Everyone else lands in a public pool called the **Kurukuru Commune**. The rule is one SQL view:

```sql
CREATE VIEW user_cohort AS
SELECT u.id AS user_id, c.id AS college_id
FROM users u
LEFT JOIN auth.users a ON a.id = u.id AND a.email_confirmed_at IS NOT NULL
LEFT JOIN LATERAL (
    SELECT cc.id FROM colleges cc
    WHERE lower(split_part(a.email, '@', 2)) = cc.domain
       OR lower(split_part(a.email, '@', 2)) LIKE '%.' || cc.domain
    ORDER BY length(cc.domain) DESC LIMIT 1
) c ON TRUE;
```

Three choices are deliberate. The email comes from the **auth provider's own table**, not from the profile the app sends, so a client can't claim a college. Only a **confirmed** email counts. And the domain match is anchored on a dot, so `cs.college.ac.in` belongs to the college but `college.ac.in.evil.com` does not. Because the cohort is computed rather than stored, adding a college to the `colleges` table takes effect for existing users immediately.

Every matching query then joins the view and requires `college_id IS NOT DISTINCT FROM` the searcher's own. `IS NOT DISTINCT FROM` is the null-safe equality: two Commune members (both `NULL`) match each other, which plain `=` would not do.

### Staff logins with separate audiences

The two staff tools, a quest book editor and an admin panel, do get tokens minted by Honbu: a bcrypt-checked shared password per tool, then a short-lived HS256 token. Each tool has its own password hash, its own signing secret and its own `aud` (audience) claim, so an editor token is useless on the admin API and neither works on the app API. Failed logins are rate limited both per client address and across all addresses, so rotating IPs doesn't buy unlimited guesses. Every admin change and every user lookup goes to an audit table.

## The trip lifecycle as compare-and-set

A trip moves through a small state machine, and every transition is a conditional `UPDATE`:

<figure>
  <div class="diagram">
    <div class="node muted-node">matched<br>both sides agreed</div>
    <span class="arrow">→</span>
    <div class="node">in_progress<br>either rider starts</div>
    <span class="arrow">→</span>
    <div class="node accent">completed<br>coins settle, XP granted</div>
  </div>
  <figcaption><b>Fig. 2</b> — the main path. An older on-demand flow also enters as <code>requested</code> and moves to <code>in_progress</code> when a pilot accepts; any open state can end as <code>canceled</code>.</figcaption>
</figure>

```sql
UPDATE trips SET status = 'in_progress'
WHERE id = $1 AND status = 'matched' AND (pilot_id = $2 OR copilot_id = $2)
```

If zero rows change, the trip was not in the expected state or the caller is not on it, and the API answers 409. This is optimistic concurrency without a version column: the `WHERE` clause *is* the precondition, and Postgres evaluates it atomically. Two taps on "start" can't both succeed, and nobody can start a trip they aren't part of.

Completion is the one transition that needs more than a single statement. It locks the trip row with `SELECT ... FOR UPDATE`, re-checks the riders and status, prices the trip from the stored distance (never from the client), locks both balances, writes the debit, the credit and two ledger rows, and finally flips the status with the same conditional-update trick. If anything fails, the whole thing rolls back.

<figure>
  <div class="screenshot-container">
    <img src="/assets/cosq/screens/kk-trip-complete.webp" alt="Trip complete screen showing coins spent, the remaining vault balance and XP gained toward the next level" />
  </div>
  <figcaption><b>In the app</b> — the end of a trip as a co-pilot sees it, rendered from test data: coins out of the vault and XP toward the next level, both from the same server response.</figcaption>
</figure>

### When "active" needed a time window

One surprise came from scheduled rides. Confirming a repeating ride creates one `matched` trip per shared day, up front, so chat and ratings work the same as for a live ride. But the home screen asked for "the newest trip that isn't finished", and a ride three days away suddenly showed up as a live trip with a pilot en route. The fix was to define *active* in time: a trip linked to a match counts only from an hour before pickup to three hours after, or whenever it is actually in progress. "Open" and "happening now" are different questions, and the schema had only answered the first.

## Coins in one paragraph

KuruCoins are the app's currency. Fares are priced from fuel cost (distance over typical two-wheeler mileage times the local petrol price, with a five-coin minimum), so a pilot is reimbursed roughly what the trip cost them. Balances live on the user row, and every movement also appends a row to a `wallet_transactions` ledger carrying the delta and the balance after it, written in the same transaction as the balance change and under row locks, so a debit is refused rather than allowed to go below zero. Coins also come from playing: exploring and planting flags pay a few. Buying coins through a payment gateway and cashing them out exist in the code but are dark-launched: off unless switched on, and in test mode the app says plainly that no real money moves. A cash-out only debits coins and queues a request for a person to pay out by hand.

## One database doing five jobs

Postgres with the PostGIS extension is the only stateful component, and it does more than store rows:

| Job | Postgres feature |
|---|---|
| Nearest available pilot | `geography` points with `ST_DWithin` and `ST_Distance` |
| Fog of war | geohash tiles as polygons, merged with `ST_Union` and served as GeoJSON |
| Serialising live matching | a transaction-scoped advisory lock |
| Background job queue | `FOR UPDATE SKIP LOCKED` on a jobs table |
| Race-proof confirmations | partial unique indexes (one confirmed match per series) |

None of these needed a new piece of infrastructure: no Redis for locks, no queue broker, no separate geo service. The trade-off is that the database is a single point of failure and the main scaling limit. For a campus-scale app that is the right trade.

## Deploy shape

The deploy is deliberately boring. A multi-stage Dockerfile compiles a static binary (`CGO_ENABLED=0`) and copies it into a small Alpine image with CA certificates and time-zone data. A container PaaS runs it and injects `PORT`. The routing server runs as a second, private service that only Honbu can reach. Configuration is environment variables. A missing database URL produces a clear error at boot naming the variable and the kind of URL to use, never a silent fallback to a default connection string in the source.

Two details were learned the hard way:

- **The database's direct host was IPv6-only**, unreachable from Docker on many laptops and from the PaaS. Connecting through the provider's session pooler fixed both.
- **Static data rides inside the binary.** Baked map tiles for the campus and a whole city, region files and editor data are compiled in with `go:embed`. A deploy can never ship code that expects tiles it doesn't have, and serving a tile is a read from memory with an `ETag`.

There are two health endpoints: `/health` says the process is up, and `/health/db` pings the pool and runs a read-only count on the ledger table, so a broken connection string shows up as a failing check rather than as the first user's error. Feature switches are read from environment variables, overridable at runtime from the admin panel with a ten-second cache; if the flags table is unreachable, the environment value wins, so the app never loses its switches because of a database blip.

## What the monolith costs

It isn't free. Handlers reach a package-level database handle instead of receiving it, which makes some handlers harder to unit test; the newer packages take a store interface instead and test against an in-memory fake plus a real PostGIS database. The WebSocket hub keeps its subscribers in process memory, so two replicas would each see only half the clients of a trip (the background matcher, by contrast, was built to run on several instances at once). And a sibling project's small API shares the binary and the database, which is convenient until its traffic or its bugs affect Kurukuru. I'd split along those seams first, and only when one of them hurts.

## What I'd reuse

- **Start with one binary and real package boundaries.** Cross-domain operations like "finish trip, move money, grant XP" stay a single transaction for as long as you can keep them there.
- **Delegate identity, verify strictly.** Pin the accepted algorithms, cache the JWKS, throttle refetches. Never let your own endpoint mint tokens the identity provider wouldn't.
- **Derive membership from the authority, not the client.** A view over the provider's confirmed email is harder to fool than a profile field, and it updates itself.
- **Write state transitions as conditional updates.** `UPDATE ... WHERE status = 'expected'` plus a row count is a concurrency control you get for free.
- **Use the database's own tools before adding infrastructure.** Advisory locks, `SKIP LOCKED`, partial unique indexes and PostGIS covered locks, queues, race safety and geo queries.
- **Close the doors your platform opens.** If your server is the only client, turn the managed data API off with deny-by-default security.

---

*Stack in this post: Go (net/http, gorilla/websocket, golang-jwt, lib/pq), PostgreSQL with PostGIS on Supabase, Supabase Auth, OSRM, Docker, Flutter. Figures come from the backend repository's code, schema and history, March to November 2026.*

## More from Building at CosQ

- [Matching Riders in Real Time over WebSockets](/blog/kurukuru-realtime-matching): live and scheduled ride matching over a Go WebSocket hub.
- [Fog of War on a Real Map with PostGIS](/blog/kurukuru-fog-of-war): turning GPS trails into an explorable, game-like map.
- [Turning a Real Map into a Pixel World](/blog/kurukuru-pixel-map-app): the Kurukuru app's map, 3D world and pixel UI in Flutter.
- [Quest Books, an In-App Editor and Road Watch](/blog/kurukuru-quests-and-road-watch): game content you can edit in the app, and road safety reports.
- [Everything Else I Built at CosQ](/blog/cosq-ecosystem): WHAM! OTT, MemoChan, PreviouslyOn, Gothicco and more.
