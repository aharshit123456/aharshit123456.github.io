# Routing Infrastructure (OSRM)

We cut our routing API costs to basically zero and got sub-millisecond ETAs in the process.

Building a booking flow with live rider tracking, every active trip needs continuous ETA updates, not just one. Polling every 20 seconds for a 20 minute trip means 60+ API calls per order. Scale that across active live tracking and commercial APIs become expensive fast. For a lean team, that's not a rounding error.

So I self-hosted OSRM instead. A localized OpenStreetMap graph, just our core Whitefield region, packaged as a sidecar container sitting right next to the API service inside the same ECS task. Routing queries now run over localhost. Zero external calls, zero external bill, single-digit millisecond latency.

OSRM gives you the shortest physical route. It doesn't know Bangalore traffic exists. So I layered custom heuristics on top, time-of-day multipliers, and static penalties for the junctions every Bangalore driver already knows by name: Silk Board, Tin Factory, Kundalahalli Gate. If a route passes within 300m of one of these during peak hours, the penalty gets added before the user ever sees the ETA.

And if the OSRM container ever hiccups, it falls back to straight-line distance instantly. Routing is a UX layer, not something that should ever block a booking.

Building at scale isn't about reaching for the most popular API by default. It's about knowing when self-hosting buys you control, speed, and cost savings that the commercial option simply can't match for your specific problem.

Knowing what NOT to build is just as important as knowing what to build.
