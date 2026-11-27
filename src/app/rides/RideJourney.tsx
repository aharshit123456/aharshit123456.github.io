'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Stop } from './RideMap';

const ICON: Record<string, string> = {
  start: '🏁', end: '🏠', toll: '🧾', city: '🏙️', dest: '⛪', offroad: '🥾', food: '🍴', detour: '⚠️',
};

const SVG = {
  cup: '<svg viewBox="0 0 24 24"><path d="M5 9h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3v2.5M11 3v2.5M14 3v2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  toll: '<svg viewBox="0 0 24 24"><path d="M4 10l8-5 8 5v10H4z"/><rect x="10" y="13" width="4" height="7" fill="#fff"/></svg>',
  church: '<svg viewBox="0 0 24 24"><path d="M11 2h2v3h3v2h-3v2h-2V7H8V5h3z" /><path d="M5 11l7-4 7 4v9H5z"/><rect x="10" y="14" width="4" height="6" fill="#fff"/></svg>',
  boot: '<svg viewBox="0 0 24 24"><path d="M7 3h4v9l6 4v4H4v-5l3-2z"/></svg>',
  city: '<svg viewBox="0 0 24 24"><path d="M4 20V9l5-3v3l5-3v5l6 0v9z"/></svg>',
};
const KEY_KINDS = new Set(['start', 'end', 'dest', 'city', 'offroad', 'detour']);
function pinFor(kind: string): { html: string; size: [number, number]; anchor: [number, number] } {
  if (KEY_KINDS.has(kind)) {
    const red = kind === 'dest' || kind === 'start' || kind === 'end';
    const col = red ? '#e0241d' : '#2a2520';
    const ic = kind === 'dest' ? SVG.church : kind === 'offroad' ? SVG.boot : kind === 'city' ? SVG.city : '';
    const inner = ic ? `<span class="pin-key-ic">${ic}</span>` : `<span class="pin-key-dot"></span>`;
    return {
      html: `<div class="pin-key" style="--pc:${col}"><svg class="pin-key-tear" viewBox="0 0 28 38"><path d="M14 0C6.3 0 0 6 0 13.4 0 23 14 38 14 38s14-15 14-24.6C28 6 21.7 0 14 0Z"/></svg>${inner}</div>`,
      size: [28, 38], anchor: [14, 38],
    };
  }
  const ic = kind === 'food' ? SVG.cup : SVG.toll;
  const col = kind === 'food' ? '#e0241d' : '#2a2520';
  return { html: `<div class="pin-badge" style="--pc:${col}">${ic}</div>`, size: [30, 30], anchor: [15, 15] };
}

export default function RideJourney({ stops, fit }: { stops: Stop[]; fit?: [[number, number], [number, number]] }) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const bikeRef = useRef<L.Marker | null>(null);
  const [step, setStep] = useState(-1); // -1 = overview
  const [ready, setReady] = useState(false);

  const places = stops.filter((s) => s.kind !== 'via');

  // init map once
  useEffect(() => {
    if (!holder.current || mapRef.current) return;
    const map = L.map(holder.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', subdomains: 'abc', maxZoom: 19,
    }).addTo(map);
    if (fit) map.fitBounds(fit as L.LatLngBoundsExpression, { padding: [36, 36] });

    places.forEach((s, idx) => {
      const p = pinFor(s.kind);
      const icon = L.divIcon({ className: `jmark jmark-${s.kind}`, html: p.html, iconSize: p.size, iconAnchor: p.anchor });
      const m = L.marker([s.lat, s.lng], { icon }).addTo(map);
      m.on('click', () => setStep(idx));
      markersRef.current.push(m);
    });

    const bikeIcon = L.divIcon({
      className: 'map-bike',
      html: `<img src="/assets/rides/cb350.gif" alt="" class="map-bike-img" style="width:72px;height:51px;image-rendering:pixelated;display:block;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.35));"/>`,
      iconSize: [72, 51], iconAnchor: [36, 44],
    });
    bikeRef.current = L.marker([places[0].lat, places[0].lng], { icon: bikeIcon, interactive: false, zIndexOffset: 1000 }).addTo(map);

    let cancelled = false;
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const g = j?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        const line = (g && g.length > 2 ? g.map(([lng, lat]) => [lat, lng]) : stops.map((s) => [s.lat, s.lng])) as [number, number][];
        L.polyline(line, { color: '#e7dcc0', weight: 9 }).addTo(map);
        L.polyline(line, { color: '#e0241d', weight: 4, dashArray: '2 9', lineCap: 'round' }).addTo(map);
        setReady(true);
      })
      .catch(() => {
        L.polyline(places.map((s) => [s.lat, s.lng]) as [number, number][], { color: '#e0241d', weight: 4, dashArray: '2 9' }).addTo(map);
        setReady(true);
      });

    setTimeout(() => map.invalidateSize(), 60);
    return () => { cancelled = true; map.remove(); mapRef.current = null; markersRef.current = []; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // react to step
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m, i) => m.getElement()?.classList.toggle('is-current', i === step));
    if (step < 0) {
      if (fit) map.flyToBounds(fit as L.LatLngBoundsExpression, { padding: [36, 36], duration: 1.1 });
      bikeRef.current?.setLatLng([places[0].lat, places[0].lng]);
    } else {
      const s = places[step];
      map.flyTo([s.lat, s.lng], s.kind === 'offroad' || s.kind === 'dest' ? 13 : 11, { duration: 1.3 });
      bikeRef.current?.setLatLng([s.lat, s.lng]);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = step >= 0 ? places[step] : null;
  const maps = cur ? `https://www.google.com/maps/search/?api=1&query=${cur.lat},${cur.lng}` : '#';

  return (
    <div className="journey">
      <div className="journey-map ride-map" ref={holder}>
        <span className="map-tab">The Route</span>
        <div className="map-legend" aria-hidden="true">
          <div className="ml-row"><span className="ml-route" /><span>Our Route (≈ 600 km)</span></div>
          <div className="ml-row"><span className="pin-badge ml-sw" style={{ ['--pc' as string]: '#e0241d' }} dangerouslySetInnerHTML={{ __html: SVG.cup }} /><span>Food / Chai</span></div>
          <div className="ml-row"><span className="pin-badge ml-sw" style={{ ['--pc' as string]: '#2a2520' }} dangerouslySetInnerHTML={{ __html: SVG.toll }} /><span>Toll Gate</span></div>
          <div className="ml-row"><span className="ml-key-sw" /><span>Key Stop</span></div>
        </div>
      </div>

      <aside className="journey-panel">
        {step < 0 ? (
          <div className="jp-intro">
            <p className="rt-kick">The ride, stop by stop</p>
            <h2 className="rt-title">Take the journey</h2>
            <p className="jp-lede">{places.length} stops across ~600 km, from a sleeping Bengaluru to a church that drowns. Step through it, pin by pin.</p>
            <button className="jp-start" onClick={() => setStep(0)} disabled={!ready}>
              ▶ Start the journey
            </button>
          </div>
        ) : (
          <div className="jp-stop" key={step}>
            <span className="jp-count">Stop {step + 1} <i>/ {places.length}</i></span>
            {cur?.label && <span className="jp-label">{cur.label}</span>}
            <h2 className="jp-name"><span className="jp-ic">{ICON[cur!.kind] || '📍'}</span>{cur?.name}</h2>
            {(cur?.treat || cur?.note) && <p className="jp-note">{cur?.treat || cur?.note}</p>}
            <a className="jp-maps" href={maps} target="_blank" rel="noopener noreferrer">Open in Maps ↗</a>
            <div className="jp-nav">
              <button className="jp-btn" onClick={() => setStep((s) => Math.max(-1, s - 1))}>← Back</button>
              <span className="jp-dots" aria-hidden="true">
                {places.map((_, i) => <i key={i} className={i === step ? 'on' : ''} />)}
              </span>
              <button className="jp-btn jp-next" onClick={() => setStep((s) => Math.min(places.length - 1, s + 1))} disabled={step === places.length - 1}>
                {step === places.length - 1 ? 'Home 🏁' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
