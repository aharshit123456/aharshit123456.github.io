# Quest Books, an In-App Editor and Road Watch

*By Harshit Agarwal*

A game lives on its content, and content is always slightly wrong: a cafe closed last month, a park pin sits in the middle of a lake, a new food stall nobody has added yet. A road safety tool lives on trust, and trust breaks the first time the app claims something that is not true. Both need to change faster than an app store review allows, and both need the phone and the server to agree exactly on the rules. This post covers three features of the Kurukuru app that sit on that line: quest books, an editor for them inside the app, and Road Watch, a way for riders to report road problems.

Kurukuru is a gamified peer-to-peer ride-sharing app I built at CosQ for college campuses. A **pilot** who is already going somewhere offers a seat; a **co-pilot** who needs one pays a few coins. The map of the campus is a pixel-art world with a fog of war that clears as you travel. The app is Flutter; the backend is one Go service on Postgres and PostGIS.

## Quest books: places as collectible stamps

A quest book is a curated list of real places in an area, organised like a passport. Each book has chapters (one per neighbourhood or campus zone) and five sections: food and drink, culture and arts, nature, adventure, and games and play. Every place is a **stamp**, and you collect it by being there. There is a book for the campus and one for Bengaluru; the Bengaluru book started from a community-curated list of about 9,000 places, credited in the app.

The interesting design choice is what you see *before* you collect something. A hidden place shows only its kind and distance: "a bakery, 140 m". You can ask for directions and the map draws a path to it, but the name stays secret until you arrive. That turns a list into a treasure hunt, and it means the book itself is a reason to go somewhere new.

<figure>
  <div class="diagram">
    <div class="node muted-node">GPS fixes<br>batched on the phone</div>
    <span class="arrow">→</span>
    <div class="node">Sync request<br>impossible jumps dropped</div>
    <span class="arrow">→</span>
    <div class="node accent">PostGIS: within a place's radius,<br>inside the book's region</div>
    <span class="arrow">→</span>
    <div class="node muted-node">New stamps<br>slam onto the map</div>
  </div>
  <figcaption><b>Fig. 1</b> — stamping. The phone never decides that you collected something; it only reports where it has been.</figcaption>
</figure>

Stamping rides on the same GPS batches that clear the fog. The phone sends timestamped fixes; the server drops fixes that would need more than about 144 km/h to reach from the previous one, then asks PostGIS which uncollected places those fixes came within range of:

```sql
cand AS (
  SELECT p.id, MIN(ST_Distance(p.geog, f.g)) AS dist
  FROM quest_places p
  JOIN quest_books b ON b.id = p.book_id AND b.active
  JOIN f ON ST_Covers(b.region, f.g) AND ST_DWithin(p.geog, f.g, p.radius_m)
  WHERE p.active
    AND NOT EXISTS (SELECT 1 FROM quest_stamps s
                    WHERE s.user_id = $1::uuid AND s.place_id = p.id)
  GROUP BY p.id
)
```

Each place has its own radius: 50 m by default, 150 m for parks, lakes, stadiums and other places whose coordinate is a centre rather than a door. Nearest places are stamped first, with a cap per sync and per day so a bus ride through a dense neighbourhood does not empty a chapter. Stamps give XP and badges at 1, 10, 50 and 100, but never coins. Coins are what co-pilots pay pilots with, so a reward that a GPS spoofer could farm is kept out of the ride economy.

On the phone, the book is a leather cover that swings open at the chapter you are standing in, with category tabs on the page edge and round ink stamps. Asking for a chapter you are not in gets a distinct "not here" answer, so the app can explain instead of showing an empty page.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-quest-book-cover.webp" alt="Closed leather quest book cover for the campus, 3 of 40 stamps, tap to open" />
</div>

*The campus quest book, closed. Tapping the cover swings it open at the chapter you are standing in.*

## Editing game content without shipping the app

Fixing a quest place used to mean a staff member editing a draft in a web editor and someone running a seeding script from a terminal. I wanted two things: people we trust (a campus ambassador, say) should be able to fix places from inside the app while walking past them, and going live should be a button, not a script. And under no circumstances should an app user be able to change what everyone sees.

The answer is the classic **draft and publish** split.

| Action | Who | Where |
|---|---|---|
| Edit the draft | Staff editors, plus app users switched on individually | Web editor or the app |
| Validate the draft | Everyone, continuously | Web, app and server, same rules |
| Publish draft to live | Admin staff only | Admin panel button |

App users reach the editor API with their normal sign-in token, but only if a per-user switch is on for them. If it is off, the API answers exactly as it would for a bad token. Every admin route refuses app tokens outright, so there is no path from the app to publishing.

**Publishing** copies the draft to the live tables in one transaction, with rules chosen to be safe for players:

- Places are upserted by a stable external id, so editing a place never orphans the stamps people already hold.
- A place missing from the draft is switched off, never deleted. Its stamps survive.
- Chapters are rebuilt from the places in them: a 400 m buffer around the convex hull of each area's points.
- A draft with validation errors is refused, and so is an empty one, which would otherwise switch every live place off.

### Optimistic concurrency, two people, one cafe

Two editors can open the same place. Each row has a version, and a save carries the version it started from:

```sql
UPDATE quest_editor_places
SET name=$3, category=$4, ..., version = version + 1, updated_at = now()
WHERE view = $1 AND id = $2 AND version = $12   -- the base version
RETURNING ...
```

Zero rows updated means someone else got there first; the server answers 409 with the row as it is now. The app shows the edit immediately, and on a conflict it rolls back, reloads and says "Someone else changed this. Reloaded." It never overwrites. The API client returns a sealed result rather than throwing, so every screen has to handle every case:

```dart
switch (await _api.putPlace(_view, place, base)) {
  case Saved(:final value):  _places = replaceById(_places, value);
  case Conflict():           _places = before; _notice = conflictNotice;
  case Failed(:final code):  _places = before; if (code == 'no_access') _noAccess = true;
}
```

The web editor gets live updates over server-sent events. The app polls every 20 seconds while the editor is open, which is simpler on mobile and plenty for a handful of editors. One subtle bug to avoid: a poll that lands while a save is in flight would replace the optimistic edit with stale server data. A counter of saves in flight makes the poll skip that round.

### One set of rules, three languages

What counts as a valid place has to be identical in the web editor (JavaScript), the app (Dart) and the publish step (Go), or an editor sees green in the app and the publish refuses it. There is no shared runtime between the three, so the rules are ported, not shared, and the tests carry the same cases:

- the book needs a slug, a name and a region with at least three points;
- a place needs a name, an area (its chapter), one of the five categories and a position;
- the radius, if set, is a whole number from 10 to 500 m;
- a place outside the book's region is an error (ray casting on the polygon);
- two places with the same name within 15 m is a warning, not an error.

The duplicate check groups places by name first, so it stays fast on a 9,000-place book. Picking a position uses the map with a fixed crosshair in the centre: you move the map, not a pin, which works one-handed and never needs a long press. If the crosshair is outside the book's region, the screen says so before you save.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-questeditor-list.webp" alt="Quest editor place list with a draft-only banner and counts of places, errors and warnings" />
  <img src="/assets/cosq/screens/kk-questeditor-problems.webp" alt="Edit place form listing problems: needs an area, pick a category" />
  <img src="/assets/cosq/screens/kk-questeditor-conflict.webp" alt="Quest editor showing the notice: someone else changed this, reloaded" />
  <img src="/assets/cosq/screens/kk-questeditor-map-pick.webp" alt="Map picker with a centre crosshair and a warning that the spot is outside the book region" />
</div>

*The in-app editor: the draft banner and error counts, a form with problems listed at the top, a conflict after someone else saved first, and the crosshair picker outside the book region.*

## Road Watch: road reports from riders

Students who share rides know exactly where the potholes are. Road Watch lets anyone plant a **warning flag** where the road has a problem: a pothole, a damaged surface, waterlogging, illegal parking, vending blocking the road, a broken light, a jam. Others **back** it (+1 per person) and later **confirm** when it has been fixed. Every issue shows how many days it has been open.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-rw-report-type.webp" alt="What did you see: eight road problem types as pixel icon tiles" />
  <img src="/assets/cosq/screens/kk-rw-report-photo.webp" alt="Add a photo step with camera and gallery buttons and a note that a moderator checks photos" />
  <img src="/assets/cosq/screens/kk-rw-report-place.webp" alt="Where is it: map pin 23 m from you, GPS accuracy chip and three severity levels with examples" />
  <img src="/assets/cosq/screens/kk-rw-duplicate.webp" alt="Already flagged nearby: a pothole reported 19 m away with a back this report button" />
</div>

*The report flow: type (one tap moves on), an optional photo, place and severity with a plain example for each level, and the duplicate check.*

The flow is four steps: type, photo, place with severity and an optional note, then review. A duplicate check sits before the review: a report of the same type within 40 m is offered as "Back this report" instead, because one issue with fourteen backers is worth more than fourteen issues. You can still file yours if it really is a different problem. There is a cap of three reports a day, and reports are accepted only inside the area the map covers.

### Honest by construction

The design prototype for Road Watch was beautiful and slightly too optimistic. It said new reports were "Reported to the city office", that the right office owned each issue, and that faces and number plates were blurred automatically. None of that was true yet, so none of it shipped:

- **A new issue is "open", not "reported".** Nothing forwards reports automatically. It becomes "reported" only when a staff member actually passes it on, and only then does the "reported to" line appear.
- **Ownership is a field, not a claim.** Every issue says "Owner: unconfirmed" until someone confirms it.
- **Photos are moderated, not blurred.** The copy says a moderator checks photos before other people see them, because that is what happens.

Widget tests assert that words like "blurred" and "reward" never appear on these screens, so the prototype's promises cannot creep back in through a later copy change.

### Never while driving

The most important rule: **a pilot never interacts with Road Watch while a trip is moving.** Typing a report is exactly the kind of distraction a road safety feature must not cause.

The app enforces it with a check that says yes only when it is *certain* the user is not piloting a trip in motion:

```dart
bool mayReport({required bool stateKnown, required bool isTripActive,
    required TripDto? trip, required String? myId, bool matchPilotInProgress = false}) {
  if (!stateKnown || matchPilotInProgress) return false; // unknown counts as blocked
  if (trip == null) return !isTripActive;
  if (trip.status != 'in_progress') return true;
  return myId != null && trip.pilotId != null && trip.pilotId != myId; // co-pilots may report
}
```

The key is `stateKnown`. The ride-state lookups return a small `Lookup` type that tells "there is no trip" apart from "I could not find out". A failed network call never opens the gate. The check also runs again right before any action, not just when the screen opened.

Instead of the report button, a pilot in motion gets one big gold button: **Mark spot for later**. One tap stores the position and time on the phone, with no network, no photo and no typing. Marked spots last 24 hours. When the trip ends, the trip summary offers to finish them, which takes a few taps each while parked.

The server enforces the same rule independently: creating a report or uploading a photo as the pilot of a trip in progress is refused with `409 trip_in_motion`. Client checks are for experience; server checks are for safety.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-rw-pilot-panel.webp" alt="Pilot view during a trip: type, photo and note locked, a large mark spot for later button" />
  <img src="/assets/cosq/screens/kk-rw-finish-pins.webp" alt="Spot anything on the road: two marked spots with finish buttons after the trip" />
  <img src="/assets/cosq/screens/kk-rw-offline.webp" alt="Saved on this phone: a queued report that will send when online" />
</div>

*Mark spot for later while piloting, finishing marked spots after the trip, and a report saved offline.*

### Photos on a phone budget

Phone cameras produce multi-megabyte images full of metadata, including the GPS position of wherever the photo was taken. The app shrinks every photo before it leaves the phone, in a background isolate:

```dart
static Uint8List shrink(Uint8List bytes) {
  var im = img.decodeImage(bytes) ?? (throw const PhotoTooLarge('not a readable image'));
  im = img.bakeOrientation(im);                       // apply EXIF rotation to the pixels
  if (max(im.width, im.height) > 1280) im = resizeLongEdge(im, 1280);
  im.exif.clear();                                    // re-encoding drops EXIF and GPS
  for (var q = 75; q >= 35; q -= 10) {
    final out = Uint8List.fromList(img.encodeJpg(im, quality: q));
    if (out.length <= 560 * 1024) return out;         // server allows 600 KB; keep headroom
  }
  throw const PhotoTooLarge();
}
```

Orientation has to be baked into the pixels *before* the metadata is cleared, or portrait photos arrive sideways. Up to three photos are uploaded after the report is created, each with its own client-generated key, so a retried upload never creates a second copy. The server checks the JPEG magic bytes rather than trusting the content type, refuses a file that still carries an EXIF GPS block (a best-effort scan that never rejects a file just because it could not parse it), and keeps each photo visible only to its author until a moderator approves it.

### Offline first, without duplicates

Roads with problems are often roads with bad signal. A report that fails to send goes into a queue on the phone and is sent again when the app resumes. The danger with retries is duplicates, so every report carries a UUID made on the phone, and the server has a unique constraint on author plus that key. Sending the same report twice is harmless.

The queue flush has a few small rules that each fixed a real failure mode:

- A network error stops the flush (try later); a permanent refusal such as "outside the area" or "daily limit" drops that report so it cannot block the rest.
- Two flushes at once share one run instead of sending twice.
- The queue is re-read at the end, so a report added while a flush was running is kept.
- A corrupt stored value reads as an empty queue instead of wedging the feature.

There are no push notifications, so status changes reach people through an **inbox derived from data**: the phone takes the newest status event of each report you made or backed and turns it into an alert. Nothing is sent; the inbox is computed from the same data as your report list. Only events done by staff are worded as "Kurukuru staff marked it"; a fix confirmed by riders says so. A public "oldest open" list ranks unresolved issues by age, which is the accountability half of the feature.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-rw-issue.webp" alt="Issue detail with photo, 4 days open, 4 backers and a status timeline with future steps waiting" />
  <img src="/assets/cosq/screens/kk-rw-oldest-open.webp" alt="Oldest open list ranking unresolved road issues by days open, with owners marked unconfirmed" />
</div>

*An issue with its timeline (future steps shown as waiting) and the public oldest-open list.*

## One model, two codebases

The app and the backend share no code: one is Dart, the other Go. What they share is a contract, and I found it holds up best when it is made of three things.

**Outcomes, not exceptions.** Every API client returns a sealed type that names the cases the server can produce: `Created`, `Duplicate(existing)`, `Rejected(code)` for reports; `Saved`, `Conflict(current)`, `Failed(code)` for the editor. The compiler then makes every screen deal with every case.

**Stable error codes as strings.** HTTP status codes are too coarse (two different 409s mean different things), so the server returns a short code and the app maps each one to a behaviour:

| Code | Meaning | What the app does |
|---|---|---|
| `duplicate` | Same type within 40 m | Shows the existing issue and "Back this report" |
| `trip_in_motion` | Caller is piloting a moving trip | Closes the flow; suggests Mark spot |
| `outside_area` | Outside the mapped area | Explains that reporting is limited here |
| `daily_limit` | Three reports today | Says so; the queue drops it |
| `conflict` | Stale editor save | Rolls back, reloads, shows the notice |

**Constants owned by the server, mirrored by the app.** The daily cap, the 40 m duplicate radius, three confirmations to verify a fix, the 600 KB photo limit: the server enforces all of them, and the app mirrors them only to give a better answer sooner. If they ever drift, the server wins and the app shows the server's answer.

Code generation from a schema would remove the duplication. For a two-language system this size, hand-written models with tests on both sides of every code were faster to change and easier to read, and the written design spec that listed every endpoint and code did the job a schema would have done.

## Takeaways

- **Separate draft from live**, and make publishing an admin action that is safe for players: upsert by stable ids, deactivate instead of delete, refuse empty or invalid drafts.
- **Version every editable row** and let the database decide conflicts with `WHERE version = $base`. Roll back and reload; never overwrite.
- **Port validation rules deliberately** when you cannot share code, and keep the same test cases in every language.
- **"Unknown" must fail closed** for anything safety-related. Model "could not find out" separately from "nothing there".
- **Give the risky user one safe action** (Mark spot for later) instead of just a disabled button.
- **Shrink, strip and key every upload on the device**: bake orientation, drop location metadata, attach an idempotency key.
- **Ship only the promises that are true.** Write tests that keep the untrue ones out.

---

*Stack in this piece: Flutter, Dart sealed classes, image and image_picker, shared_preferences; Go with Postgres and PostGIS on the backend. Quest data for Bengaluru from a community-curated list; map data © OpenStreetMap contributors.*

## More from Building at CosQ

- [Kurukuru: A Ride-Sharing Game on One Go Binary](/blog/kurukuru-architecture): the architecture of a college ride-sharing game in one Go monolith.
- [Matching Riders in Real Time over WebSockets](/blog/kurukuru-realtime-matching): live and scheduled ride matching over a Go WebSocket hub.
- [Fog of War on a Real Map with PostGIS](/blog/kurukuru-fog-of-war): turning GPS trails into an explorable, game-like map.
- [Turning a Real Map into a Pixel World](/blog/kurukuru-pixel-map-app): the Kurukuru app's map, 3D world and pixel UI in Flutter.
- [Everything Else I Built at CosQ](/blog/cosq-ecosystem): WHAM! OTT, MemoChan, PreviouslyOn, Gothicco and more.
