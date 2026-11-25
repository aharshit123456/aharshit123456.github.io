# Fog of War on a Real Map with PostGIS

*By Harshit Agarwal*

In strategy games the map starts dark. You only see what your units have walked through, and the black slowly peels back into terrain. It is one of the oldest tricks for making a map feel like something you earn. So what happens when the map is your actual campus, the unit is you, and the fog only lifts where your phone's GPS has really been? This post is how Kurukuru's backend turns a stream of noisy GPS fixes into a personal explored area, serves it back as a single shape, pays out progress for it, and draws a blocky world from OpenStreetMap underneath.

Kurukuru is a gamified, college-first, peer-to-peer ride-sharing app I built at CosQ: a **pilot** with a free seat gives a **co-pilot** a lift and earns in-app coins. The game layer exists to give people a reason to open the app on days they don't need a ride, and to make every ride also count for something. Exploration is the core of that layer. Its backend is a few hundred lines of Go and some well-chosen PostGIS calls ([the architecture post](/blog/kurukuru-architecture) covers the rest of the service).

<div class="stat-row">
  <div class="stat"><div class="stat-num">~36 × 19 m</div><div class="stat-label">size of one fog tile at the campus's latitude</div></div>
  <div class="stat"><div class="stat-num">~75</div><div class="stat-label">tiles lifted around a single GPS fix (120 m radius)</div></div>
  <div class="stat"><div class="stat-num">23,750</div><div class="stat-label">tiles in the campus area, the denominator of "% explored"</div></div>
</div>

## Pick a grid before you pick a shape

The naive fog stores the user's GPS trail and buffers it into a polygon. That breaks quickly: trails are huge, buffering a long line on every request is slow, and "how much have I explored?" has no stable answer because two overlapping walks count twice unless you union them.

The standard alternative is to **discretise the world into tiles** and store, per user, the set of tiles they have seen. Membership is a primary-key lookup, overlap is free (a tile seen twice is still one row), and "explored percentage" is a count. The question is which grid.

I used **geohash**. A geohash encodes a latitude and longitude by repeatedly halving the world: the first bit says east or west of the prime meridian, the second north or south of the equator, then the same again inside the chosen half, alternating. Every five bits become one character from a 32-letter alphabet. Each extra character makes the cell 32 times smaller, and every cell has a short, stable string name.

Eight characters (40 bits, 20 for longitude and 20 for latitude) give a cell 360/2²⁰ degrees wide and 180/2²⁰ degrees tall. Near the campus that is about 36 m east to west and 19 m north to south: big enough that a walk produces a manageable number of rows, small enough that the fog's edge still follows paths and buildings.

> [!NOTE]
> **Why not hexagons?** Hex grids such as Uber's H3 have nicer neighbour properties and equal-area cells. But PostGIS can turn a geohash straight into its polygon with `ST_GeomFromGeoHash` and back with `ST_GeoHash`, the encoder is fifty lines of Go with no dependency, and the merged outline only needs edges that line up. Rectangles were enough.

## From GPS fixes to tiles

The app collects fixes in the background and uploads them in batches: every 5 seconds while it is on screen and every 20 seconds when it isn't, keeping at most the newest 200 fixes. A failed upload puts the batch back at the front of the queue, so walking through a dead zone costs nothing. Each fix carries the time it was taken, not the time it was sent.

The server first makes the fog lift in a **radius** rather than in the single tile under the fix. GPS on a phone is often off by tens of metres, and a 36 m wide tile under a wobbling dot looks like a broken trail. Revealing everything within 120 m of each fix gives a smooth band along the path you walked.

```go
// tiles whose area intersects the circle of radiusM around (lat, lng)
for la := lat - dLat; la <= lat+dLat+cellLat/2; la += cellLat / 2 {
	for lo := lng - dLng; lo <= lng+dLng+cellLng/2; lo += cellLng / 2 {
		dy := (la - lat) * mPerDegLat
		dx := (lo - lng) * mPerDegLng
		if dx*dx+dy*dy > radiusM*radiusM {
			continue
		}
		seen[geohashEncode(la, lo, 8)] = struct{}{}
	}
}
```

Sampling at half a cell in each direction guarantees every tile inside the circle is hit at least once; the set removes duplicates. One fix produces about 75 tiles, and a batch of fixes from a walk shares most of them, so the server collects the distinct tiles for the whole batch before touching the database. A straight one-kilometre walk with a fix every ten metres reveals about 440 distinct tiles.

### Learning which tiles are new, in one round trip

Then come two bulk statements, each passing the whole tile list as one Postgres array:

```sql
INSERT INTO grid_tiles (id, geom)
SELECT t, ST_GeomFromGeoHash(t) FROM unnest($1::text[]) AS t
ON CONFLICT DO NOTHING;

INSERT INTO user_explorations (user_id, grid_tile_id)
SELECT $1, t FROM unnest($2::text[]) AS t
ON CONFLICT DO NOTHING
RETURNING grid_tile_id;
```

The first lazily creates global tile rows with their polygons, so the grid only ever contains places someone has actually been. The second is the useful trick: `ON CONFLICT DO NOTHING ... RETURNING` returns **only the rows that were actually inserted**. Tiles the user had already seen are silently skipped, so the result is exactly "tiles newly revealed by this batch", with no read-before-write and no race between two uploads from the same phone.

The newly revealed tiles go through one more conditional update to find **pioneer** tiles, the ones nobody in the whole app has seen before:

```sql
UPDATE grid_tiles SET first_discoverer_id = $1
WHERE id = ANY($2) AND first_discoverer_id IS NULL
RETURNING id
```

Because the `IS NULL` check and the write happen in one statement, two people walking into the same unexplored corner at the same moment can't both be first. If the upload belongs to a trip in progress, the server pushes a "pioneer" event into that trip's WebSocket channel, and both riders see a toast that they just mapped a new corner of campus.

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>fog sync · illustrative request and response</span></div><pre><code><span class="prompt">$</span> curl -X POST $HONBU/api/explore/sync -H "Authorization: Bearer &lt;token&gt;" \
    -d '{"trip_id":"","gps_trace":[{"lat":20.35,"lng":85.81,"t":1763100000000}, …]}'
{
  "status": "synchronized",
  "new_tiles_unlocked": 132,
  "total_unlocked": 1250,
  "pioneer_tiles": ["tgt5…"],
  "discoveries": 2,
  "xp_gained": 100,
  "coins_gained": 20,
  "stamps": []
}</code></pre></div>

The response also carries the user's new XP, level and coin totals, so the app can animate a reward without a second request. The user id in the body is ignored and replaced with the token's subject: a client can report where it has been, but never on someone else's behalf.

## Serving the fog as one shape

The map screen needs the inverse: everything this user has explored. Sending thousands of rectangles and letting the phone draw each one would be slow and would leave hairline seams between tiles. Instead the server merges them:

```sql
SELECT ST_AsGeoJSON(ST_Union(t.geom)), COUNT(*)
FROM user_explorations e
JOIN grid_tiles t ON e.grid_tile_id = t.id
WHERE e.user_id = $1
```

`ST_Union` dissolves the shared edges and returns one (multi)polygon: an outline with stepped edges, plus **holes** for unexplored pockets enclosed by explored ground, like a courtyard you walked around but never into. The app receives a single GeoJSON shape and the tile count.

<figure>
  <div class="diagram">
    <div class="node muted-node">user's tiles<br>rows of rectangles</div>
    <span class="arrow">→</span>
    <div class="node accent">ST_Union<br>one outline + holes</div>
    <span class="arrow">→</span>
    <div class="node">GeoJSON<br>rings and pockets</div>
    <span class="arrow">→</span>
    <div class="node muted-node">app: screen-sized fog,<br>outline cut out (even-odd),<br>pockets painted back</div>
  </div>
  <figcaption><b>Fig. 1</b> — from rows to fog. The server does the geometry; the client draws one path.</figcaption>
</figure>

Drawing it is then cheap. The app builds one path containing a rectangle the size of the screen plus every explored ring, fills it with the **even-odd** rule (so the rings become cut-outs in the fog), and paints the pockets back in. Before the first outline arrives it clears a small circle around the player, so a new user never starts in total darkness.

> [!NOTE]
> **The trade-off: the union is recomputed on every map load.** For one user on one campus that is a few thousand small polygons and stays fast. A heavy explorer of a whole city would make it expensive; the obvious next step is to cache the outline per user and invalidate it when a sync reveals new tiles, or to union only the new tiles into the cached shape.

<figure>
  <div class="screenshot-container">
    <img src="/assets/cosq/screens/kk-explore-sheet.webp" alt="Exploring sheet showing a percentage of the campus explored, the tile count, and a switch to keep exploring in the background" />
  </div>
  <figcaption><b>In the app</b> — the exploring sheet, rendered from test data: percentage of campus, tile count, and the opt-in switch for background exploration.</figcaption>
</figure>

## Turning tiles into progress

The percentage needs a denominator. The campus is a fixed bounding box, so the number of geohash-8 tiles inside it is a constant computed once: 23,750. Tiles revealed off campus still count toward your total and your rewards; the percentage is simply capped at 100.

Rewards are paid in **discoveries**. Each user has a small counter of newly revealed tiles that haven't been paid for yet. Every sync adds the new tiles to it; every full 60 tiles converts into one discovery worth 50 XP and 10 coins, and the remainder stays banked for next time. The increment, the conversion and the grant happen in one transaction, so two overlapping syncs can't both cash in the same 60 tiles. That one-kilometre walk is worth about seven discoveries.

Levels are deliberately dull: one level per 500 XP, computed from total XP whenever needed. Badges are not stored at all. Each badge is a definition (a metric and a target, like "explore 500 tiles" or "finish 10 trips"), and a user's badges are evaluated from live counts of their tiles, flags, trips and stamps. "Newly unlocked" is computed by evaluating the counts before and after an action and diffing. With no badge table there is nothing to migrate when a badge is added or a target changes, and nothing that can drift out of sync with the underlying data.

### What the fog doesn't defend against

An open question in any location game is cheating. The fog trusts the positions it is sent, apart from dropping impossible coordinates. Quest stamps, the part of the game where you collect specific places, are stricter: they drop any fix that would need more than 40 m/s (about 144 km/h) to reach from the previous kept fix, cap stamps per sync and per day, and pay only XP, never coins. For the fog itself I accepted the risk, because what you gain by spoofing it is a prettier personal map and a slow trickle of coins. If exploration ever paid real value, the same speed filter would be the first thing to move over.

### Flags

The other way to mark the map is to plant a **flag** with a short note. The tile under it is computed in SQL with `ST_GeoHash(point, 8)`; if you are that tile's first discoverer, the flag is marked as a pioneer flag. Flags are anonymous by design: the API never returns an author, only whether a flag is yours. Nearby flags are fetched with a bounding-box prefilter on plain latitude and longitude columns, and a flag disappears for everyone after three reports, and immediately for the person who reported it or blocked its author.

## The world under the fog

Fog needs something to hide. The first map was a standard tile map; the current one is a pixel-art **block world** baked from OpenStreetMap, so roads, water, parks and buildings each have their own block type and buildings rise according to their height.

The baker is a Python tool that runs offline:

1. **Download** OpenStreetMap features for the area: land use, water, roads, railways, buildings and trees.
2. **Rasterise** everything onto a grid three times finer than the target, in painter's order (land use first, then water, then roads at their real width), with proper even-odd filling so courtyards and ponds become holes.
3. **Downsample** each cell from its 3×3 subsamples by weighted majority, with boosts for roads and water so a 5 m lane or a narrow canal survives on a 10 m grid instead of being voted away by the grass around it.
4. **Classify buildings** by kind (house, flats, shop, institution, religious, industrial) and height class, from OSM's height or floor count where present and a per-kind default otherwise.
5. **Encode** each row with run-length encoding (`g12r3g40` is twelve grass, three road, forty grass) and gzip the result.

One region file was fine for one campus. A whole city was not: a public OSM query server can't serve that much data, and a single file would be tens of megabytes. So the city baker clips a regional extract locally, cuts the city into square tiles that all sit on **one shared grid** (so neighbouring tiles meet on exact cell edges), and writes a manifest listing each tile with its size and SHA-1 hash.

| Map | Levels of detail | Tiles |
|---|---|---|
| Campus | 4 m and 2 m cells | 30 and 99 |
| Bengaluru | 10 m and 5 m cells | 650 per level |

The Go server embeds all of it with `go:embed`, about 21 MB in total, and serves a tile with its hash as the `ETag`. A request that includes the hash from the manifest gets `Cache-Control: immutable` for a year, because a tile's content can never change under the same hash; anything else gets an hour. The app switches from the coarse level to the fine one past a zoom threshold given in the manifest. Tiles that would be nothing but grass are never written; a 404 for a tile means "open grass", which keeps the city's outskirts free.

### Toward an open world

The block map is top-down. The next design walks around in it: a real-time 3D world built from the same kind of map data, where you move a voxel character through the streets near campus. The design splits it cleanly. An offline builder precomputes the area as JSON tiles, 500 m square, in **local metres** east and north of one origin, so the renderer never handles latitude and longitude. Roads are polylines with their real width and class, buildings are footprints with heights, and land cover, shops, trees and lamps ride along. A three.js renderer streams tiles around the player, turns roads into ribbon meshes along the real polylines, extrudes buildings and checks collisions against footprints.

The tile JSON, with a version field in every file, is the only contract between the two halves: the renderer knows nothing about where the data came from. Terrain height, traffic, pedestrians and interiors were explicitly left out, because the area is flat enough and each would have doubled the scope. A trial of it sits behind a feature switch in the app.

## What I'd reuse

- **Discretise before you geometrise.** A grid turns "where have I been?" into set membership, makes overlaps free and gives you a stable denominator.
- **Let `RETURNING` tell you what changed.** `INSERT ... ON CONFLICT DO NOTHING RETURNING` answers "which of these are new?" in one race-free round trip.
- **Put the geometry on the server and send one shape.** `ST_Union` plus an even-odd fill beats thousands of client-side rectangles.
- **Bank progress in a counter and pay out in whole units.** Thresholds like "every 60 tiles" stay atomic inside one transaction and never double-pay.
- **Derive badges from facts.** Definitions in code evaluated against live counts can't drift out of sync with the data.
- **Content-address static tiles.** A hash in the manifest lets clients cache forever and lets you redeploy without invalidation headaches.

---

*Stack in this post: Go, PostgreSQL with PostGIS, geohash, OpenStreetMap with Overpass and osmium, Python, three.js, Flutter. Figures come from the backend's code and baked map manifests, the open-world design spec and the app's exploration code, March to November 2026.*

## More from Building at CosQ

- [Kurukuru: A Ride-Sharing Game on One Go Binary](/blog/kurukuru-architecture): the architecture of a college ride-sharing game in one Go monolith.
- [Matching Riders in Real Time over WebSockets](/blog/kurukuru-realtime-matching): live and scheduled ride matching over a Go WebSocket hub.
- [Turning a Real Map into a Pixel World](/blog/kurukuru-pixel-map-app): the Kurukuru app's map, 3D world and pixel UI in Flutter.
- [Quest Books, an In-App Editor and Road Watch](/blog/kurukuru-quests-and-road-watch): game content you can edit in the app, and road safety reports.
- [Everything Else I Built at CosQ](/blog/cosq-ecosystem): WHAM! OTT, MemoChan, PreviouslyOn, Gothicco and more.
