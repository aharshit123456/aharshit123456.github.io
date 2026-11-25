# Turning a Real Map into a Pixel World

*By Harshit Agarwal*

Every map app looks like every other map app: grey roads, beige blocks, a blue dot. That is fine when the map is a tool, and a problem when the map is the game board and the brief says "make the campus look like a block world you want to explore". You still need real roads, real buildings and a real GPS position, on a mid-range phone, for a whole commute. This post is how the Kurukuru app turned OpenStreetMap into a pixel world, plus the plumbing around it: GPS streaming, sockets, a pixel design system and a golden image for every screen.

Kurukuru is a gamified peer-to-peer ride-sharing app I built at CosQ for college campuses. A **pilot** who is already going somewhere offers the spare seat; a **co-pilot** who needs a ride pays a few coins for it. Along the way you earn XP, plant flags, collect stamps and clear a fog of war that hides the parts of the map you have never travelled. The app is Flutter; the backend is a single Go service with Postgres and PostGIS. I wrote the app end to end.

<div class="stat-row">
  <div class="stat"><div class="stat-num">3</div><div class="stat-label">map renderers, from raster tiles to a custom painter</div></div>
  <div class="stat"><div class="stat-num">10 m / 5 m</div><div class="stat-label">block size at the two levels of detail</div></div>
  <div class="stat"><div class="stat-num">218</div><div class="stat-label">golden images: every screen state on Android and iOS</div></div>
</div>

## Three maps in eight months

The map went through three renderers, each right for the design of its time.

| Renderer | How it draws | What you can restyle | Why it stopped being enough |
|---|---|---|---|
| `flutter_map` + raster tiles | Downloads pre-rendered PNG tiles | Almost nothing: tint, opacity | A picture of a road cannot be told to become a block |
| MapLibre + vector tiles | The phone renders geometry with a style JSON | Every layer: colour, width by zoom, labels | Still a flat map; no buildings with height, no trees, no blocks |
| Custom voxel painter | Server bakes a grid of block classes; the app paints cells | Everything, including what exists at all | (current) |

**Raster tiles** came first, with a dark basemap that matched the original dark design. Raster tiles are images; when the design moved to a bright parchment block world, there was nothing to restyle.

**Vector tiles** fixed that. With MapLibre the phone receives geometry (roads, water, buildings, labels in the OpenMapTiles schema, from a free tile host) and renders it with a style document you write yourself. The whole Kurukuru street style is about 140 lines of Dart that emits that JSON:

```dart
static Map<String, dynamic> _roadLayer(String id, bool casing) => {
  'id': id, 'type': 'line', 'source': 'omt', 'source-layer': 'transportation',
  'paint': {
    'line-color': casing ? _roadCasing
        : ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], _roadMajor, '#FFFFFF'],
    // exponential width by zoom: hairlines far out, fat cartoon roads close in
    'line-width': casing ? _widthByZoom(3.2, 12, 34) : _widthByZoom(2, 9, 28),
  },
};
```

Stock pins ruin a pixel style instantly, so the app draws its own markers at startup: flags, the player square and the labelled "kuru in / kuru out" pins are painted onto a `Canvas` in the app palette and pixel font, encoded to PNG and registered with MapLibre as sprites.

**The voxel map** came when the design asked for buildings with height, trees and roads made of blocks. A style sheet can recolour a polygon, but it cannot turn a building footprint into a stack of blocks with a shaded south wall. That needs data shaped like the picture you want.

## Bake on the server, paint on the phone

The trick is to move the hard GIS work offline. A Python tool on the backend reads an OpenStreetMap extract and **bakes** it into a grid: every cell gets a ground class, an optional object and a building height class.

| Layer | Codes (one byte per cell) |
|---|---|
| ground | grass, park, forest, farmland, water, path, lane, road, main road, bridge, railway, ... |
| object | nothing, tree, or a building kind: house, flats, shop, institution, religious, industrial |
| height | building height class 0 to 9, about 4 m each |

Rows are run-length encoded (`g12r3` is twelve grass cells then three road cells), which compresses a campus to almost nothing because most of the world is long runs of the same ground.

A whole city cannot be one file, so the grid is cut into square tiles on one shared grid: at 10 m cells, a tile of 200 by 200 cells covers 2 km. A finer level with 5 m cells exists for zooming in. The tool writes a manifest listing every tile as `[row, col, bytes, sha1]`, and that hash does a lot of work:

- The app requests a tile with its hash in the URL, so the server can answer with `Cache-Control: immutable`. A re-bake changes the hash, which changes the URL. Cache invalidation for free.
- A tile missing from the manifest is open grass. The app does not even ask for it.

<figure>
  <div class="diagram">
    <div class="node muted-node">OSM extract<br>(offline bake)</div>
    <span class="arrow">→</span>
    <div class="node">Manifest<br>[r, c, bytes, sha1]</div>
    <span class="arrow">→</span>
    <div class="node">3×3 tiles around camera<br>LRU cache, decoded off the UI thread</div>
    <span class="arrow">→</span>
    <div class="node accent">Stitched window<br>painted cell by cell</div>
  </div>
  <figcaption><b>Fig. 1</b> — the voxel map pipeline. The heavy geometry work runs once on the server; the phone only fetches small tiles by hash and paints a grid.</figcaption>
</figure>

On the phone, a tile source keeps the 48 most recently used tiles, shares in-flight downloads so two requests for the same tile make one network call, and decodes JSON in a background isolate. It fetches the 3×3 tiles around the camera and **stitches** them into one world object, so the painter never knows tiles exist. A tile that fails to download is drawn as grass and retried a few seconds later.

Two details made level-of-detail switching invisible:

- **Zoom is stored in pixels per metre, not pixels per cell.** When the 5 m level takes over from the 10 m one, a building stays exactly the same size on screen. Positions travel through latitude and longitude, so the camera does not jump either.
- **A dead band around the switch zoom.** The finer level takes over at 104% of the switch point and hands back at 96%. Without it, a pinch that hovers on the boundary flips levels every frame.

The painter itself is a `CustomPainter` that walks visible rows top to bottom, so nearer buildings cover farther ones. Buildings get a soft shadow towards the south-east, a front wall on their south face and an outline only where the building ends, so neighbouring cells of the same building read as one block. Fog of war is a single path with the even-odd fill rule: the outer rectangle plus the explored outline, so the explored area cancels out and stays clear.

### Labels that never fight

Real campuses have hundreds of named things, and pixel labels are wide. Every landmark is baked with a rank (0 for campus, hospital or stadium; 1 for departments, hostels and gates; 2 for the rest), and the zoom decides the least important rank worth drawing. Then a greedy pass keeps labels in importance order and drops any that would overlap one already placed:

```dart
List<T> declutter<T>(Iterable<T> items, {required Rect Function(T) boxOf,
    required int Function(T) rankOf, double gap = 2}) {
  final ordered = [for (final (i, item) in items.indexed) (i, item)]
    ..sort((a, b) {
      final byRank = rankOf(a.$2).compareTo(rankOf(b.$2));
      return byRank != 0 ? byRank : a.$1.compareTo(b.$1); // ties keep input order
    });
  final kept = <T>[], boxes = <Rect>[];
  for (final (_, item) in ordered) {
    final box = boxOf(item).inflate(gap);
    if (boxes.any(box.overlaps)) continue;
    boxes.add(box);
    kept.add(item);
  }
  return kept;
}
```

Adding more names never makes the map busier; it only fills free space. Labels are drawn *after* the fog, so you can read the name of a place you have not been to yet, which is most of the reason to go there.

## A 3D campus inside a WebView

As an experiment, the app can open a walkable 3D campus: a three.js world built from the same OpenStreetMap data, with roads as ribbon meshes, extruded buildings and a voxel character on a joystick. It is a small web app bundled into the APK (about 2.4 MB, in 500 m tiles) and shown in a WebView.

The snag: a WebView can load one HTML file from the app bundle, but the page cannot `fetch` its sibling JSON tiles from there. The fix is a tiny HTTP server inside the app, bound to the loopback address on a random port, that serves only the bundled world folder:

```dart
static String? cleanPath(String uriPath) {
  if (uriPath.contains('\\') || uriPath.contains('\u0000')) return null;
  final parts = uriPath.split('/').where((p) => p.isNotEmpty).toList();
  if (parts.any((p) => p == '..' || p == '.')) return null; // no escaping the folder
  return parts.isEmpty ? 'index.html' : parts.join('/');
}
```

The WebView's navigation delegate allows only `http://127.0.0.1:<that port>`, so the page cannot wander onto the internet, and the server answers only `GET` and `HEAD`.

## GPS for a whole commute

Location is the most expensive thing the app does, and it has three consumers with very different needs:

| Consumer | What it needs | Setting |
|---|---|---|
| The map | Smooth, current position | Stream with a 10 m distance filter (5 m on the live route screen) |
| Fog and stamps | Every place you passed, eventually | Batched upload every 5 s in front, every 20 s in the background |
| The co-pilot watching the pilot | A moving dot, a few times a minute | Pilot broadcasts at most once every 3 s |

One service owns the GPS stream, so it survives screens opening and closing, and fans fixes out. The upload side is a pure-Dart class with no plugins, easy to test:

- Fixes queue with their own timestamp, so the server can drop impossible jumps (anything faster than about 144 km/h from the previous kept fix).
- The queue is capped at 200 fixes; a failed upload puts the batch back at the front.
- While the app is in the background, gains are tallied separately and shown as "while you were away" on return.

Background location on Android means a **foreground service with a visible notification**, a battery and trust cost. So it is opt-in, off by default, and the notification says plainly what it does ("clearing the fog as you walk"). With it off, the fog only clears while the app is open.

## Sockets on a phone: fast path, not source of truth

During a trip, both phones join a WebSocket for that trip. It carries the pilot's position, a "trip finished" event and discovery events. Phones are hostile to long-lived sockets: tunnels, network handovers between Wi-Fi and mobile data, the OS freezing a backgrounded app.

Rather than build reconnect-and-replay, I split the jobs. The socket is the **fast path** for things that are fine to miss, like the next position of a moving dot. The **truth** about the trip (requested, matched, in progress, completed) comes from polling the trip every two to three seconds while a trip screen is open. If the socket drops, the dot pauses; the trip still ends correctly for both people. Each position message carries the sender's id, so a phone ignores its own echo.

A few small requests per minute is a fair price for never leaving a rider stuck on a trip screen.

## A design system with three rules

The look is a parchment and block world: grass, dirt, river and gold on a warm paper background, outlined in a dark green-black "ink".

| Token | Hex | Used for |
|---|---|---|
| ink | `#1F2A1D` | Every outline and all text |
| parchment | `#F5EEDC` | Panels, sheets, screen backgrounds |
| grass | `#7DBB4A` | Primary buttons, progress |
| gold | `#E8B23A` | Coins, pilot, rewards |
| red | `#D0452F` | Flags, warnings |
| river / sky | `#4FA3C7` / `#9FD3EA` | Water, login sky |

Three rules carry most of the style:

1. **Two faces, strictly split.** Pixelify Sans for headings, numbers and button labels; DM Sans for anything you actually read. The split paid off in an unexpected way: Pixelify draws `(` and `)` as `{` and `}`, so a building called "CSE Block (New Block)" rendered as `{New Block}`. Place names now always use the body face.
2. **Everything is lowercase.** Instead of trusting every string, the app has its own `Text` widget that lowercases its input, and files import it in place of Flutter's (`hide Text`). Letter spacing from the theme is cut to a third, because wide tracking suits capitals and looks broken in lowercase.
3. **Blocks, not cards.** Panels have a 3 px ink outline, a hard bottom edge and inset shading; buttons sink when pressed. A dozen widgets (box, button, field, tile, toggle, XP bar, level badge, ground strip) cover almost every screen.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-login.webp" alt="Kurukuru login screen with a block logo, pixel clouds and a grass and dirt floor" />
  <img src="/assets/cosq/screens/kk-onboarding-roles.webp" alt="Onboarding page explaining the pilot and co-pilot roles in parchment cards" />
  <img src="/assets/cosq/screens/kk-plan-ride.webp" alt="Plan a ride screen with pilot and co-pilot toggle, start and destination, match now or schedule" />
  <img src="/assets/cosq/screens/kk-match-offer.webp" alt="Match offer sheet showing a pilot found, fare in coins and kuru in and out times" />
</div>

*The design system in use: login, the roles page of onboarding, the ride planner and a match offer. People in test fixtures are pseudonyms like "rider one".*

## From an HTML prototype to Flutter

The screens were designed as a clickable HTML prototype: one page with a rail of numbered screens, plain JavaScript flows and sample data everywhere. It becomes the thing everyone compares the app to. Two lessons from turning it into Flutter:

- **The prototype specifies the look, not the truth.** It happily shows "Reported to the city office" or "faces are blurred automatically" because sample data costs nothing. The app has to decide what is real, and say only that. I kept a written list of every place the app deliberately differs and why.
- **Compare pictures, not memories.** For the biggest feature I rendered every prototype screen in headless Chrome, put the frames next to the app's screenshots and wrote a ranked gap list. The app was faithful to the written spec, but the spec had cut so much of the prototype that nothing seemed to match. A screen-by-screen parity pass, driven by that list, fixed it.

## A golden image for every screen

Those app screenshots come from a **golden test** suite. A golden test renders a widget, saves the image next to the code, and fails if a later render differs. I wanted one for every screen in every state that matters: empty, loading, error, populated, and the ride lifecycle in order.

The harness is small:

```dart
const androidPhone = GoldenDevice('android', Size(360, 800), TargetPlatform.android);
const iosPhone = GoldenDevice('ios', Size(390, 844), TargetPlatform.iOS);

void goldenTest(String description, Widget Function() build,
    {required String screen, required String state}) {
  for (final device in [androidPhone, iosPhone]) {
    testWidgets('$description [${device.name}]', (tester) async {
      await pumpGolden(tester, build(), device: device);
      await expectLater(find.byType(MaterialApp),
          matchesGoldenFile('goldens/$screen/$state.${device.name}.png'));
    });
  }
}
```

Around it: a fixed "now" so "today" and "in 2 days" never change, fonts bundled as assets with runtime font fetching switched off, the Material icon font loaded by hand (otherwise tests draw icons as boxes), and only the two phone sizes the app ships on. The real map is a platform view that cannot render in a test, so it is swapped for a flat grass tile with the player square. That is why the map looks empty in the screenshots in these posts. Fixtures are shaped from real ride data (routes, dates, fares, match states) with every person pseudonymised. A short script tiles the images into one contact sheet per flow for design review.

The first full audit found real bugs, not just pixels:

- A weekly scheduled ride showed "locked in" for the whole week when only some days had a match, and the list was capped so a matched day simply vanished.
- Two screens showed 12:00 and 12:01 for the same ride. Not an offset bug: one showed departure, the other pickup time, and neither said which.
- The trip drawer took its label, headline and button from three different sources, so it could say "pilot en route", "searching" and "waiting for pilot" at once. All three now derive from one trip status.
- A "scheduled rides" button rendered at half width because a `Stack` loosened its parent's width constraint.

<div class="screenshot-container">
  <img src="/assets/cosq/screens/kk-scheduled-rides.webp" alt="Scheduled rides list with per-day state, 4 of 6 days locked in and no match yet tags" />
  <img src="/assets/cosq/screens/kk-trip-complete.webp" alt="Trip complete screen with coins earned, XP gained and a first ride badge" />
  <img src="/assets/cosq/screens/kk-vault.webp" alt="Vault screen showing a coin balance and recent ride earnings and fares" />
</div>

*Goldens after the audit fixes: per-day state on scheduled rides (and place names in the body face, so parentheses stay parentheses), trip complete, and the coin vault.*

## Getting builds to testers

Early builds went to testers as APKs through Firebase App Distribution: build, upload, send a link. Once the app was on the Play Store's testing tracks, I moved everything to fastlane so a release is one command and the store listing lives in the repo:

<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>android/fastlane</span></div><pre><code>fastlane build                          signed release .aab (does not upload)
fastlane internal notes:"Fixed login"   bump, build, upload to Internal testing
fastlane closed   notes:"Fixed login"   bump, build, upload to Closed testing
fastlane promote from:alpha to:internal copy a build to another track
fastlane metadata                       push store listing text and screenshots only</code></pre></div>

Each upload lane bumps the build number, writes the changelog and uploads, so tester release notes are versioned with the code. The Play service account key stays out of git.

## Takeaways

- **Pick the renderer by what you need to change, not by what is popular.** Raster tiles can be tinted, vector tiles can be restyled, and only your own data can change what exists on the map.
- **Bake offline, paint simply.** A server-side grid with content-hashed tiles gave a custom-looking map with almost no work on the phone and caching that invalidates itself.
- **Store zoom in real-world units** and add hysteresis to any threshold a finger can hover on.
- **Give each GPS consumer its own rate.** Display, sync and broadcast need different frequencies; one owner for the stream keeps the battery cost honest.
- **Treat sockets on mobile as a fast path.** Poll for state that must be right; push what is fine to miss.
- **Golden-test every state**, and read the pictures. The worst bugs we found were wrong words, not wrong pixels.

---

*Stack in this piece: Flutter, flutter_map and then maplibre_gl on OpenMapTiles-schema vector tiles, a CustomPainter voxel renderer, three.js in webview_flutter, geolocator, web_socket_channel, flutter_test goldens, fastlane. Map data © OpenStreetMap contributors.*

## More from Building at CosQ

- [Kurukuru: A Ride-Sharing Game on One Go Binary](/blog/kurukuru-architecture): the architecture of a college ride-sharing game in one Go monolith.
- [Matching Riders in Real Time over WebSockets](/blog/kurukuru-realtime-matching): live and scheduled ride matching over a Go WebSocket hub.
- [Fog of War on a Real Map with PostGIS](/blog/kurukuru-fog-of-war): turning GPS trails into an explorable, game-like map.
- [Quest Books, an In-App Editor and Road Watch](/blog/kurukuru-quests-and-road-watch): game content you can edit in the app, and road safety reports.
- [Everything Else I Built at CosQ](/blog/cosq-ecosystem): WHAM! OTT, MemoChan, PreviouslyOn, Gothicco and more.
